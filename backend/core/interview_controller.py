"""Main interview orchestrator"""
from typing import Dict, Optional
from datetime import datetime
from backend.core.question_manager import QuestionManager
from backend.core.context_manager import ContextManager
from backend.evaluation.evaluator import Evaluator
from backend.strategies.strategy_factory import StrategyFactory
from backend.llm.gemini_client import GeminiClient
from backend.utils.logger import Logger
from backend.config import Config

class InterviewController:
    """Orchestrates the entire interview flow"""
    
    def __init__(self, language: str, jd_id: Optional[str] = None, expert_mode: bool = False):
        self.language = language
        self.expert_mode = expert_mode
        self.question_manager = QuestionManager(language)
        self.context_manager = ContextManager(language, jd_id)
        self.evaluator = Evaluator()
        self.strategy_factory = StrategyFactory()
        self.gemini_client = GeminiClient()
        self.logger = Logger()
        
        # Initialize session in log
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
    
    def start_interview(self) -> Dict:
        """Start the interview with a warm, natural greeting"""
        import random
        
        # Varied, natural greetings to avoid robotic feel
        greetings = [
            "Hi there! Thanks for joining today. I'm really looking forward to our conversation. Let's get started!",
            "Hello! Great to have you here. I'm excited to learn more about your experience. Let's dive in!",
            "Hi! Thanks for taking the time to chat with me today. I've had a chance to review your background and I have some interesting questions for you.",
            "Hello and welcome! I appreciate you being here. Let's have a good conversation about your experience and skills.",
            "Hi! It's nice to meet you. I'm looking forward to discussing your background. Shall we begin?"
        ]
        
        greeting = random.choice(greetings)
        return {
            "type": "greeting",
            "message": greeting
        }
    
    def get_next_question(self) -> Optional[Dict]:
        """Get next question for the interview"""
        context = self.context_manager.get_context()
        round_num = len(self.context_manager.context["interview_context"]["round_summaries"]) + 1
        
        # For the first question, generate a personalized question based on resume and experience level
        if round_num == 1 and not self.first_question_generated and self.resume_text:
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
        question = self.question_manager.select_question(context)
        
        if not question:
            return None
        
        self.current_question = question
        self.current_followup_count = 0
        
        # Update context
        self.context_manager.update_round(round_num)
        self.context_manager.add_question_asked(question["id"])
        
        return {
            "type": "question",
            "question_id": question["id"],
            "text": question["text"],
            "question_type": question["type"],
            "topic": question.get("topic"),
            "round_number": round_num
        }
    
    def _generate_personalized_first_question(self) -> Optional[Dict]:
        """
        Generate a personalized first question using:
        1. Bank question as seed (structural template)
        2. Resume for personalization
        3. AI enhancement for natural conversation
        """
        experience_level = "mid"  # default
        position_title = self.language.title() + " Developer"
        required_skills = []
        
        if self.data_model:
            experience_level = self.data_model.get("experience_level", "mid")
            required_skills = [s.get("skill", "") for s in self.data_model.get("required_skills", [])]
        
        # Step 1: Find a seed question from the bank
        seed_question = self.question_manager.find_seed_question(
            experience_level=experience_level,
            skills=required_skills if required_skills else [self.language],
            category="conceptual" if experience_level == "junior" else None,
            difficulty="easy" if experience_level == "junior" else "medium"
        )
        
        # If no resume, just return the seed question directly
        if not self.resume_text:
            if seed_question:
                self.question_manager.questions_asked.append(seed_question["id"])
                return seed_question
            return None
        
        try:
            # Step 2: Enhance the seed question with resume personalization
            seed_text = seed_question.get("text", "") if seed_question else ""
            seed_topic = seed_question.get("topic", "") if seed_question else ""
            seed_category = seed_question.get("category", "conceptual") if seed_question else "conceptual"
            
            prompt = f"""You are a friendly, professional technical interviewer for a {position_title} position ({experience_level} level).

Your task: Create a personalized first question that combines a technical topic with the candidate's background.

SEED QUESTION (use as structural inspiration):
"{seed_text}"
Topic: {seed_topic}
Category: {seed_category}

CANDIDATE'S RESUME:
{self.resume_text[:1800]}

REQUIRED SKILLS: {', '.join(required_skills[:5]) if required_skills else self.language}

INSTRUCTIONS:
1. Start with a warm, brief acknowledgment (e.g., "I noticed from your resume..." or "I see you've worked with...")
2. Connect the seed question's topic to something specific from their resume
3. Make it feel like a natural conversation starter, not a generic question
4. Adjust complexity for {experience_level} level:
   - Junior: Direct, fundamental, encouraging
   - Mid: Practical, hands-on experience focused
   - Senior/Lead: Probing, decision-focused, architectural

EXAMPLE OUTPUT FORMATS:
- "I noticed you worked with [tech from resume]. The seed topic is about [topic]. How did you approach [specific aspect] in your [project]?"
- "I see you've built [feature from resume]. When you were working on that, how did you handle [seed topic concept]?"

Generate ONLY the personalized question text. Keep it conversational and warm."""

            # Generate enhanced question using LLM
            response = self.gemini_client.model.generate_content(prompt)
            question_text = response.text.strip()
            
            # Clean up the response
            if question_text.startswith('"') and question_text.endswith('"'):
                question_text = question_text[1:-1]
            
            # Remove any meta-text the LLM might have added
            for prefix in ["Question:", "Here's the question:", "Personalized question:"]:
                if question_text.lower().startswith(prefix.lower()):
                    question_text = question_text[len(prefix):].strip()
            
            # Mark seed question as used
            if seed_question:
                self.question_manager.questions_asked.append(seed_question["id"])
            
            return {
                "id": f"personalized_{self.context_manager.session_id[:8]}",
                "text": question_text,
                "type": seed_question.get("type", "probing") if seed_question else "probing",
                "category": seed_category,
                "topic": seed_topic or "experience_based",
                "difficulty": seed_question.get("difficulty", "medium") if seed_question else "medium",
                "is_personalized": True,
                "seed_question_id": seed_question.get("id") if seed_question else None,
                "experience_level": experience_level
            }
            
        except Exception as e:
            print(f"Error generating personalized question: {e}")
            # Fallback to seed question without personalization
            if seed_question:
                self.question_manager.questions_asked.append(seed_question["id"])
                return seed_question
            return None
    
    def process_response(self, response_text: str, response_type: str = "initial") -> Dict:
        """Process candidate response"""
        if not self.current_question:
            raise ValueError("No active question")
        
        # Evaluate response
        evaluation = self.evaluator.evaluate(
            self.current_question,
            response_text
        )
        
        # Select strategy
        strategy = self.strategy_factory.select_strategy(
            evaluation,
            self.context_manager.get_context()
        )
        
        # Generate follow-up if needed (before logging, so we can include it)
        followup = None
        should_generate_followup = response_type == "initial" or (
            response_type == "followup" and 
            self.current_followup_count < self.max_followups_per_question and
            self.followup_stop_reason is None  # AI hasn't decided to stop yet
        )
        
        if should_generate_followup:
            followup = self._generate_followup(
                response_text,
                evaluation,
                strategy
            )
        
        # Log response
        self.logger.log_response(
            self.context_manager.session_id,
            self.current_question["id"],
            response_text,
            response_type,
            self.current_followup_count if response_type == "followup" else 0,
            evaluation,
            strategy
        )
        
        # Update log with follow-up if generated
        if followup:
            self.logger.update_followup_generated(
                self.context_manager.session_id,
                self.current_question["id"],
                len(self.context_manager.get_current_round_summary().get("responses", [])) - 1 if self.context_manager.get_current_round_summary() else 0,
                followup
            )
        
        # Update context
        self._update_context_with_response(
            response_text,
            evaluation,
            strategy,
            followup
        )
        
        # Get strategy guidance for focus areas
        strategy_guidance = strategy.get_followup_guidance(
            self.current_question,
            response_text,
            evaluation,
            self.context_manager.get_context()
        ) if self.current_question else {}
        
        strategy_data = {
            "id": strategy.get_strategy_id(),
            "name": strategy.get_strategy_name(),
            "reason": self.strategy_factory.get_last_selection_reason(),
            "parameters": strategy.get_parameters(),
            "focus_areas": strategy_guidance.get("focus_areas", [])
        }
        
        # Expert mode: store followup for approval instead of returning immediately
        if self.expert_mode and followup:
            self.pending_followup = followup
            self.pending_evaluation = evaluation
            self.pending_strategy = strategy_data
            return {
                "evaluation": evaluation,
                "strategy": strategy_data,
                "followup": None,  # Don't send followup yet
                "pending_approval": True,
                "pending_followup": followup  # Send to expert for review
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

