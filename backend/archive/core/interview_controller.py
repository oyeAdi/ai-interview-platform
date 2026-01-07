"""Main interview orchestrator"""
from typing import Dict, Optional
from datetime import datetime
from core.question_manager import QuestionManager
from core.context_manager import ContextManager
from evaluation.evaluator import Evaluator
from strategies.strategy_factory import StrategyFactory
from llm.gemini_client import GeminiClient
from utils.logger import Logger
from config import Config
from services.event_store import get_event_store
from services.agents.architect_agent import get_architect_agent
from services.agents.executioner_agent import get_executioner_agent
from services.agents.evaluator_agent import get_evaluator_agent

class InterviewController:
    """Orchestrates the entire interview flow"""
    
    def __init__(self, language: str, jd_id: Optional[str] = None, expert_mode: bool = False, session_id: Optional[str] = None):
        self.language = language
        self.expert_mode = expert_mode
        self.question_manager = QuestionManager(language)
        self.context_manager = ContextManager(language, jd_id, session_id=session_id)
        self.evaluator = Evaluator()
        self.strategy_factory = StrategyFactory()
        self.gemini_client = GeminiClient()
        self.logger = Logger()
        self.event_store = get_event_store()
        self.architect = get_architect_agent()
        self.executioner = get_executioner_agent()
        self.agent_evaluator = get_evaluator_agent()
        
        # Legacy components (kept for compatibility or reference during transition)
        self.legacy_evaluator = self.evaluator
        self.legacy_strategy_factory = self.strategy_factory
        
        # Initialize session in log with correct session_id
        self.logger.initialize_session(
            self.context_manager.session_id,
            language,
            jd_id
        )
        
        self.current_question: Optional[Dict] = None
        self.current_followup_count = 0
        self.total_questions = Config.DEFAULT_QUESTIONS
        self.max_followups_per_question = Config.MAX_FOLLOWUPS_PER_QUESTION
        
        # Dynamic follow-up tracking
        self.followup_stop_reason: Optional[str] = None  # sufficient_skill, no_knowledge, max_reached
        self.followup_confidence: float = 0.0
        
        # Expert mode: store pending followup awaiting approval
        self.pending_followup: Optional[Dict] = None
        self.pending_evaluation: Optional[Dict] = None
        self.pending_strategy: Optional[Dict] = None
        
        # Position data model and resume for personalized questions
        self.data_model: Optional[Dict] = None
        self.resume_text: str = ""
        self.first_question_generated: bool = False
        self.role_type: Optional[str] = None  # NEW: For role-based question selection
        
        # Question categories for filtering (from quick start or position data model)
        self.question_categories: Optional[Dict] = None
    
    def start_interview(self) -> Dict:
        """Start the interview with a warm, natural greeting using the ExecutionerAgent"""
        
        # Get greeting from ExecutionerAgent
        action = self.executioner.get_next_action(
            self.context_manager.session_id,
            {"current_phase": "greeting"}
        )
        
        # Emit InterviewStarted event
        self.event_store.append_event(
            self.context_manager.session_id,
            "InterviewStarted",
            {
                "candidate_name": getattr(self, 'candidate_name', 'Anonymous Candidate'),
                "position_title": self.language.title() + " Developer",
                "language": self.language,
                "expert_name": "AI Interviewer Swarm",
                "greeting_text": action["text"]
            }
        )
        
        return {
            "type": "greeting",
            "message": action["text"]
        }
    
    def get_next_question(self) -> Optional[Dict]:
        """Get next question or phase-based action for the interview"""
        context = self.context_manager.get_context()
        round_num = len(self.context_manager.context["interview_context"]["round_summaries"]) + 1
        
        # --- NEW: Multi-Phase Introduction (Greeting -> Self-Intro -> Candidate-Intro) ---
        # We use current_followup_count or a custom state to track which intro phase we are in
        if not self.first_question_generated:
            # Determine next phase based on historical events or simple counter
            # For simplicity, we'll use local session state or event counts
            events = self.event_store.get_events(self.context_manager.session_id)
            exec_actions = [e for e in events if e["event_type"] == "ExecutionerAction"]
            phases_completed = [e["event_data"]["phase"] for e in exec_actions]
            
            next_phase = None
            if "greeting" in phases_completed and "self_introduction" not in phases_completed:
                next_phase = "self_introduction"
            elif "self_introduction" in phases_completed and "candidate_introduction" not in phases_completed:
                next_phase = "candidate_introduction"
            
            if next_phase:
                action = self.executioner.get_next_action(
                    self.context_manager.session_id,
                    {"current_phase": next_phase}
                )
                return {
                    "type": "statement" if next_phase == "self_introduction" else "question",
                    "text": action["text"],
                    "phase": next_phase,
                    "is_intro": True
                }

        # For the first technical question, generate a personalized question based on resume and experience level
        if round_num == 1 and not self.first_question_generated and self.resume_text:
            # Force "seed_execution" phase
            personalized_question = self._generate_personalized_first_question()
            if personalized_question:
                self.first_question_generated = True
                self.current_question = personalized_question
                self.current_followup_count = 0
                
                # Update context
                self.context_manager.update_round(round_num)
                self.context_manager.add_question_asked(personalized_question["id"])
                
                return {
                    "type": "question",
                    "question_id": personalized_question["id"],
                    "text": personalized_question["text"],
                    "question_type": personalized_question["type"],
                    "topic": personalized_question.get("topic"),
                    "round_number": round_num,
                    "is_personalized": True
                }
        
        # Standard question selection from question bank
        # If question_categories are set (from quick start), use category-based selection
        if self.question_categories:
            # Count how many questions we've asked per category
            questions_by_category = {}
            for summary in context.get("round_summaries", []):
                cat = summary.get("question_category", "unknown")
                questions_by_category[cat] = questions_by_category.get(cat, 0) + 1
            
            # Find a category that still has quota
            eligible_categories = []
            for cat_name, cat_config in self.question_categories.items():
                if cat_config.get("enabled", False):
                    asked_count = questions_by_category.get(cat_name, 0)
                    if asked_count < cat_config.get("count", 0):
                        eligible_categories.append(cat_name)
            
            selected_category = None
            if eligible_categories:
                # ⭐ INTELLIGENT SELECTION: Use role-based flow instead of random
                try:
                    from config.role_categories import get_next_category_in_flow, get_excluded_categories
                    
                    # Get asked categories
                    asked_categories = list(questions_by_category.keys())
                    
                    # Try to get next category from role flow
                    if self.role_type:
                        # Filter out excluded categories
                        excluded = get_excluded_categories(self.role_type)
                        safe_categories = [c for c in eligible_categories if c not in excluded]
                        
                        if safe_categories:
                            # Build enabled categories dict for flow function
                            enabled_dict = {cat: self.question_categories[cat] for cat in safe_categories}
                            
                            # Get next category following role flow
                            selected_category = get_next_category_in_flow(
                                self.role_type, asked_categories, enabled_dict
                            )
                            
                            # If flow complete, pick first safe category
                            if not selected_category and safe_categories:
                                selected_category = safe_categories[0]
                        else:
                            selected_category = None
                    else:
                        # Fallback: pick first eligible (no role specified)
                        selected_category = eligible_categories[0]
                except ImportError:
                    # Fallback if role_categories not available
                    import random
                    selected_category = random.choice(eligible_categories)
            
            if selected_category:
                # Filter questions by this category
                filtered_questions = [
                    q for q in self.question_manager.question_bank
                    if q.get("category") == selected_category
                    and q["id"] not in self.question_manager.questions_asked
                ]
                if filtered_questions:
                    import random
                    question = random.choice(filtered_questions)
                else:
                    question = None
            else:
                # All categories exhausted
                question = None
        else:
            # Default behavior: select from all questions
            question = self.question_manager.select_question(context)
        
        if not question:
            return None
        
        # Store enriched question
        self.current_question = question.copy()
        self.current_question["round_number"] = round_num
        self.current_question["question_number"] = round_num
        self.current_question["category"] = question.get("category", "unknown")
        
        self.current_followup_count = 0
        
        # Update context
        self.context_manager.update_round(round_num)
        self.context_manager.add_question_asked(question["id"])
        
        # Track question category
        question_category = question.get("category", "unknown")
        
        # Log the question to log.json
        self.logger.log_question(
            self.context_manager.session_id,
            question["id"],
            question["text"],
            question["type"],
            round_num,
            question_category,
            question.get("topic")
        )
        
        # Emit QuestionAsked event
        self.event_store.append_event(
            self.context_manager.session_id,
            "QuestionAsked",
            {
                "question_id": question["id"],
                "question_text": question["text"],
                "question_category": question_category,
                "question_number": round_num,
                "difficulty": question.get("difficulty", "medium")
            }
        )
        
        return {
            "type": "question",
            "question_id": question["id"],
            "text": question["text"],
            "question_type": question["type"],
            "topic": question.get("topic"),
            "round_number": round_num,
            "question_number": round_num,
            "category": question_category
        }
    
    def generate_transition_message(self, reason: str = "neutral") -> Dict:
        """
        Generate smooth transition message to next question.
        
        Args:
            reason: Transition reason (success, struggle, drop, neutral, max_reached)
        
        Returns:
            Dict with type='transition', text, and reason
        """
        current_topic = "this area"
        if self.current_question:
            current_topic = self.current_question.get("topic", "this topic")
            if not current_topic or current_topic == "unknown":
                category = self.current_question.get("category", "this area")
                current_topic = category.replace("_", " ")
        
        transitions = {
            "success": f"Excellent work on {current_topic}! You've demonstrated strong understanding. Let's explore a different aspect...",
            "struggle": f"I can see {current_topic} is challenging. Let's shift to a related area that might be more aligned with your experience...",
            "drop": f"You've shown good insights on {current_topic}. Let's move to the next topic...",
            "neutral": f"Thank you for your thoughts on {current_topic}. Let's continue with the next question...",
            "max_reached": f"We've explored {current_topic} thoroughly. Let's move forward to the next topic..."
        }
        
        return {
            "type": "transition",
            "text": transitions.get(reason, transitions["neutral"]),
            "reason": reason
        }
    
    
    def _generate_personalized_first_question(self) -> Optional[Dict]:
        """
        Generate a personalized first question using the Architect Agent.
        """
        required_skills = []
        experience_level = "mid"
        
        if self.data_model:
            experience_level = self.data_model.get("experience_level", "mid")
            required_skills = [s.get("skill", "") for s in self.data_model.get("required_skills", [])]
        
        if not required_skills:
            required_skills = [self.language]
            
        position_title = f"{self.language.title()} Developer"
        
        try:
            # Delegate to Architect Agent
            question_data = self.architect.generate_initial_question(
                session_id=self.context_manager.session_id,
                jd_id=self.context_manager.jd_id,
                resume_text=self.resume_text,
                required_skills=required_skills,
                language=self.language,
                experience_level=experience_level,
                position_title=position_title
            )
            
            # Note: ArchitectAgent already logs the question and emits the event.
            # We just need to mark it as asked in our question manager for local tracking if needed.
            # But Architect uses its own ID, so we'll just track that.
            self.question_manager.questions_asked.append(question_data["id"])
            
            return question_data
            
        except Exception as e:
            print(f"Error in ArchitectAgent call: {e}")
            # Fallback will be handled by ArchitectAgent itself or we can do it here if needed
            return None
    
    def process_response(self, response_text: str, response_type: str = "initial") -> Dict:
        """Process candidate response"""
        if not self.current_question:
            raise ValueError("No active question")
        
        # Emit AnswerSubmitted event
        self.event_store.append_event(
            self.context_manager.session_id,
            "AnswerSubmitted",
            {
                "question_id": self.current_question["id"],
                "answer_text": response_text,
                "response_type": response_type
            }
        )
        
        # 1. Evaluate response using the new EvaluatorAgent
        scores = self.agent_evaluator.score_response(
            question=self.current_question["text"],
            answer=response_text,
            experience_level=self.context_manager.get_context().get("experience_level", "mid")
        )
        
        evaluation = {
            "deterministic_scores": scores,
            "overall_score": scores.get("overall", 50),
            "reasoning": scores.get("summary", ""),
            "accuracy": scores.get("accuracy", 0),
            "completeness": scores.get("completeness", 0),
            "depth": scores.get("depth", 0)
        }
        
        # Emit ResponseScored event
        self.event_store.append_event(
            self.context_manager.session_id,
            "ResponseScored",
            {
                "question_id": self.current_question["id"],
                "question_number": self.current_question.get("question_number", 1),
                "answer_text": response_text,
                "scores": scores,
                "llm_reasoning": scores.get("summary", "")
            }
        )
        
        # 2. Get next action from ExecutionerAgent
        executioner_context = {
            "current_phase": "dynamic_followup",
            "last_answer": response_text,
            "last_question": self.current_question["text"],
            "question_count": len(self.context_manager.get_context().get("previous_questions", [])),
            "experience_level": self.context_manager.get_context().get("experience_level", "mid")
        }
        
        agent_action = self.executioner.get_next_action(
            self.context_manager.session_id,
            executioner_context
        )
        
        followup = None
        strategy_data = {}
        
        if agent_action.get("type") == "question":
            followup = {
                "id": f"follow_{self.context_manager.session_id[:8]}",
                "text": agent_action["text"],
                "type": "followup",
                "category": agent_action.get("strategy", "depth"),
                "agent": "Executioner"
            }
            strategy_data = {
                "id": agent_action.get("strategy", "depth"),
                "name": agent_action.get("strategy", "depth").capitalize(),
                "reason": agent_action.get("scores", {}).get("summary", ""),
                "parameters": agent_action.get("scores", {}),
                "focus_areas": [agent_action.get("strategy", "depth")]
            }
        
        # Log response
        self.logger.log_response(
            self.context_manager.session_id,
            self.current_question["id"],
            response_text,
            response_type,
            self.current_followup_count if response_type == "followup" else 0,
            evaluation,
            None
        )
        
        # Update context
        self._update_context_with_response(
            response_text,
            evaluation,
            None,
            followup
        )
        
        # Expert mode: store followup for approval
        if self.expert_mode and followup:
            self.pending_followup = followup
            self.pending_evaluation = evaluation
            self.pending_strategy = strategy_data
            return {
                "evaluation": evaluation,
                "strategy": strategy_data,
                "followup": None,
                "pending_approval": True,
                "pending_followup": followup
            }
        
        return {
            "evaluation": evaluation,
            "strategy": strategy_data,
            "followup": followup
        }
    
    def _generate_followup(self, response: str, evaluation: Dict, strategy) -> Optional[Dict]:
        """Generate follow-up question using strategy and LLM with dynamic stopping"""
        # Check if max reached
        if self.current_followup_count >= self.max_followups_per_question:
            self.followup_stop_reason = "max_reached"
            self.followup_confidence = 1.0
            return None
        
        # Check if AI has decided to stop
        if self.followup_stop_reason is not None:
            return None
        
        # Use AI to determine if we should continue (only after first follow-up)
        if self.current_followup_count > 0:
            should_continue = self.gemini_client.should_continue_followup(
                question=self.current_question.get("text", ""),
                response=response,
                evaluation=evaluation,
                followup_count=self.current_followup_count,
                experience_level=self.data_model.get("experience_level", "mid") if self.data_model else "mid"
            )
            
            # Soft Stop Logic: "Opinion by OPINION_THRESHOLD" based on SUSTAINED performance
            # After OPINION_THRESHOLD followups, we have enough data to form an opinion
            from config import Config
            opinion_threshold = Config.OPINION_THRESHOLD
            if self.current_followup_count >= opinion_threshold:
                # Calculate average score of the current round to ensure consistency
                current_round_summary = self.context_manager.get_current_round_summary()
                avg_round_score = 0
                if current_round_summary and current_round_summary.get("score_trend"):
                    scores = current_round_summary["score_trend"]
                    # We are at follow-up #2, which means we have:
                    # 1 Initial Response + 2 Follow-up Responses = 3 Data Points.
                    # This provides sufficient basis for an opinion.
                    avg_round_score = sum(scores) / len(scores)
                else:
                    # Fallback to current score if no trend data
                    avg_round_score = evaluation.get("overall_score", 0)

                # Early Exit (Success) - Sustained High Performance
                # Lowered from 85% to 75% - form opinion faster
                if avg_round_score >= 80:
                    self.followup_stop_reason = "high_confidence_success"
                    self.followup_confidence = 0.95
                    return None
                
                # Early Exit (Failure) - Sustained Poor Performance
                if avg_round_score < 45:
                    self.followup_stop_reason = "high_confidence_failure"
                    self.followup_confidence = 0.95
                    return None
            
            # Mercy Kill: Trend Analysis (Drop > 25 points)
            current_round_summary = self.context_manager.get_current_round_summary()
            if current_round_summary and len(current_round_summary.get("score_trend", [])) >= 2:
                recent_scores = current_round_summary["score_trend"][-3:]  # Last 3 scores
                if len(recent_scores) >= 2:
                    drop = max(recent_scores) - recent_scores[-1]
                    if drop > 25:
                        self.followup_stop_reason = "performance_drop"
                        self.followup_confidence = 0.9
                        return None

            if not should_continue.get("continue", True):
                self.followup_stop_reason = should_continue.get("reason", "sufficient_skill")
                self.followup_confidence = should_continue.get("confidence", 0.8)
                return None
        
        self.current_followup_count += 1
        self.context_manager.update_followup_number(self.current_followup_count)
        
        # Strategy provides guidance
        strategy_guidance = strategy.get_followup_guidance(
            self.current_question,
            response,
            evaluation,
            self.context_manager.get_context()
        )
        
        # Generate follow-up using LLM
        followup_text = self.gemini_client.generate_followup(
            self.current_question,
            response,
            evaluation,
            strategy_guidance,
            self.context_manager.get_context()
        )
        
        return {
            "text": followup_text,
            "followup_number": self.current_followup_count,
            "strategy_id": strategy.get_strategy_id(),
            "generation_reason": strategy_guidance.get("reason", "")
        }
    
    # Expert Mode Methods
    def approve_followup(self, rating: Optional[str] = None) -> Optional[Dict]:
        """Expert approves the pending followup as-is"""
        if not self.pending_followup:
            return None
        
        followup = self.pending_followup
        self.pending_followup = None
        
        # Log expert feedback
        if rating:
            self.logger.log_expert_feedback(
                self.context_manager.session_id,
                self.current_question["id"] if self.current_question else "",
                followup,
                action="approved",
                rating=rating
            )
        
        return followup
    
    def edit_followup(self, edited_text: str, rating: Optional[str] = None) -> Optional[Dict]:
        """Expert edits the pending followup before sending"""
        if not self.pending_followup:
            return None
        
        original_followup = self.pending_followup
        edited_followup = {
            **original_followup,
            "text": edited_text,
            "expert_edited": True,
            "original_text": original_followup["text"]
        }
        
        self.pending_followup = None
        
        # Log expert feedback
        self.logger.log_expert_feedback(
            self.context_manager.session_id,
            self.current_question["id"] if self.current_question else "",
            original_followup,
            action="edited",
            rating=rating,
            edited_text=edited_text
        )
        
        return edited_followup
    
    def override_followup(self, custom_text: str, rating: Optional[str] = None) -> Dict:
        """Expert overrides with their own custom followup"""
        original_followup = self.pending_followup
        
        custom_followup = {
            "text": custom_text,
            "followup_number": self.current_followup_count,
            "strategy_id": "expert_override",
            "generation_reason": "Expert provided custom question",
            "expert_override": True,
            "original_followup": original_followup
        }
        
        self.pending_followup = None
        
        # Log expert feedback
        self.logger.log_expert_feedback(
            self.context_manager.session_id,
            self.current_question["id"] if self.current_question else "",
            original_followup,
            action="overridden",
            rating=rating,
            custom_text=custom_text
        )
        
        return custom_followup
    
    def get_pending_followup(self) -> Optional[Dict]:
        """Get the pending followup awaiting expert approval"""
        if not self.pending_followup:
            return None
        return {
            "followup": self.pending_followup,
            "evaluation": self.pending_evaluation,
            "strategy": self.pending_strategy
        }
    
    def _update_context_with_response(
        self,
        response: str,
        evaluation: Dict,
        strategy,
        followup: Optional[Dict]
    ):
        """Update context with response data"""
        round_num = self.context_manager.context["interview_context"]["current_round"]
        current_summary = self.context_manager.get_current_round_summary()
        
        response_data = {
            "response_number": len(current_summary.get("responses", [])) if current_summary else 0,
            "type": "initial" if self.current_followup_count == 0 else "followup",
            "text": response,
            "scores": evaluation.get("deterministic_scores", {}),
            "timestamp": datetime.now().isoformat()
        }
        
        if not current_summary:
            # Create new round summary
            current_summary = {
                "round_number": round_num,
                "question_id": self.current_question["id"],
                "question_text": self.current_question["text"],
                "topic": self.current_question.get("topic"),
                "responses": [response_data],
                "score_trend": [evaluation.get("overall_score", 0)],
                "topics_covered": [],
                "gaps_identified": [],
                "strengths": [],
                "weaknesses": [],
                "followup_history": []
            }
            self.context_manager.add_round_summary(current_summary)
        else:
            current_summary["responses"].append(response_data)
            current_summary["score_trend"].append(evaluation.get("overall_score", 0))
        
        if followup:
            current_summary["followup_history"].append({
                "number": followup["followup_number"],
                "text": followup["text"],
                "strategy": strategy.get_strategy_id(),
                "reason": followup.get("generation_reason", "")
            })
        
        # Update strategy context
        score_improvement = None
        if len(current_summary["responses"]) > 1:
            prev_score = current_summary["score_trend"][-2]
            curr_score = current_summary["score_trend"][-1]
            score_improvement = curr_score - prev_score
        
        self.context_manager.update_strategy_context(
            strategy.get_strategy_id(),
            score_improvement
        )
    
    def complete_round(self):
        """Complete current round and prepare for next"""
        current_summary = self.context_manager.get_current_round_summary()
        if current_summary:
            # Calculate round metrics
            if current_summary["responses"]:
                initial_score = current_summary["score_trend"][0]
                final_score = current_summary["score_trend"][-1]
                current_summary["initial_score"] = initial_score
                current_summary["final_score"] = final_score
                current_summary["score_improvement"] = final_score - initial_score
        
        # Reset for next question
        self.current_question = None
        self.current_followup_count = 0
        self.followup_stop_reason = None
        self.followup_confidence = 0.0
    
    def is_interview_complete(self) -> bool:
        """Check if interview is complete"""
        return len(self.context_manager.context["interview_context"]["round_summaries"]) >= self.total_questions
    
    def get_progress(self) -> Dict:
        """Get interview progress"""
        rounds_completed = len(self.context_manager.context["interview_context"]["round_summaries"])
        total = self.total_questions
        percentage = (rounds_completed / total * 100) if total > 0 else 0
        
        return {
            "rounds_completed": rounds_completed,
            "total_rounds": total,
            "percentage": round(percentage, 1),
            "current_round": self.context_manager.context["interview_context"]["current_round"],
            "current_followup": self.current_followup_count,
            "max_followups": self.max_followups_per_question,
            "followup_stop_reason": self.followup_stop_reason,
            "followup_confidence": self.followup_confidence
        }
    
    def finalize_interview(self):
        """Finalize interview and generate summary"""
        # Calculate final metrics
        summaries = self.context_manager.context["interview_context"]["round_summaries"]
        if summaries:
            all_scores = []
            all_topics = set()
            
            for summary in summaries:
                if summary.get("score_trend"):
                    all_scores.extend(summary["score_trend"])
                if summary.get("topic"):
                    all_topics.add(summary["topic"])
            
            avg_score = sum(all_scores) / len(all_scores) if all_scores else 0
            
            self.context_manager.update_overall_metrics({
                "average_score": avg_score,
                "topics_covered": list(all_topics),
                "score_trend": "improving" if len(all_scores) > 1 and all_scores[-1] > all_scores[0] else "stable"
            })
        
        # Finalize log
        self.logger.finalize_session(self.context_manager.session_id)
        
        return {
            "session_id": self.context_manager.session_id,
            "summary": self.context_manager.get_context()
        }

