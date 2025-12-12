"""Log management - continuous appending to log.json"""
import json
import os
from typing import Dict, Optional
from datetime import datetime
from backend.config import Config

class Logger:
    """Manages continuous logging to log.json"""
    
    def __init__(self):
        self.log_file = Config.LOG_FILE
        self._ensure_log_file()
    
    def _ensure_log_file(self):
        """Ensure log file and directory exist"""
        os.makedirs(os.path.dirname(self.log_file), exist_ok=True)
        if not os.path.exists(self.log_file):
            initial_data = {
                "interview_sessions": [],
                "aggregate_statistics": {
                    "total_sessions": 0,
                    "strategy_rankings": [],
                    "topic_performance": {}
                }
            }
            with open(self.log_file, 'w', encoding='utf-8') as f:
                json.dump(initial_data, f, indent=2)
    
    def _load_log(self) -> Dict:
        """Load current log file"""
        try:
            with open(self.log_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {
                "interview_sessions": [],
                "aggregate_statistics": {
                    "total_sessions": 0,
                    "strategy_rankings": [],
                    "topic_performance": {}
                }
            }
    
    def _save_log(self, data: Dict):
        """Save log data to file"""
        with open(self.log_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    
    def _find_session(self, session_id: str, log_data: Dict) -> Optional[int]:
        """Find session index by ID"""
        for i, session in enumerate(log_data.get("interview_sessions", [])):
            if session.get("session_id") == session_id:
                return i
        return None
    
    def initialize_session(self, session_id: str, language: str, jd_id: Optional[str] = None):
        """Initialize new session in log"""
        log_data = self._load_log()
        
        # Check if session already exists
        session_idx = self._find_session(session_id, log_data)
        
        if session_idx is None:
            # Create new session
            new_session = {
                "session_id": session_id,
                "timestamp": datetime.now().isoformat(),
                "detected_language": language,
                "jd_id": jd_id,
                "config": {
                    "total_questions": Config.DEFAULT_QUESTIONS,
                    "followups_per_question": Config.FOLLOWUPS_PER_QUESTION
                },
                "questions": [],
                "strategy_performance": {},
                "parameter_updates": {}
            }
            log_data["interview_sessions"].append(new_session)
            self._save_log(log_data)
    
    def log_response(
        self,
        session_id: str,
        question_id: str,
        response_text: str,
        response_type: str,
        followup_number: int,
        evaluation: Dict,
        strategy
    ):
        """Append response evaluation to log immediately"""
        log_data = self._load_log()
        session_idx = self._find_session(session_id, log_data)
        
        if session_idx is None:
            self.initialize_session(session_id, "unknown")
            log_data = self._load_log()
            session_idx = self._find_session(session_id, log_data)
        
        session = log_data["interview_sessions"][session_idx]
        
        # Find or create question entry
        question_entry = None
        for q in session.get("questions", []):
            if q.get("question_id") == question_id:
                question_entry = q
                break
        
        if question_entry is None:
            # Create new question entry
            question_entry = {
                "question_id": question_id,
                "round_number": len(session.get("questions", [])) + 1,
                "responses": []
            }
            session.setdefault("questions", []).append(question_entry)
        
        # Create response entry
        response_entry = {
            "response_number": len(question_entry.get("responses", [])),
            "response_type": response_type,
            "candidate_response": response_text,
            "timestamp": datetime.now().isoformat(),
            "evaluation": evaluation,
            "strategy_used": {
                "strategy_id": strategy.get_strategy_id(),
                "strategy_name": strategy.get_strategy_name(),
                "parameters": strategy.get_parameters(),
                "performance_metrics": {
                    "response_quality_improvement": None,
                    "engagement_score": None
                }
            }
        }
        
        if response_type == "followup":
            response_entry["followup_number"] = followup_number
        
        question_entry.setdefault("responses", []).append(response_entry)
        
        # Save immediately (continuous logging)
        self._save_log(log_data)
    
    def update_followup_generated(
        self,
        session_id: str,
        question_id: str,
        response_number: int,
        followup: Dict
    ):
        """Update response entry with generated follow-up"""
        log_data = self._load_log()
        session_idx = self._find_session(session_id, log_data)
        
        if session_idx is None:
            return
        
        session = log_data["interview_sessions"][session_idx]
        for q in session.get("questions", []):
            if q.get("question_id") == question_id:
                responses = q.get("responses", [])
                if response_number < len(responses):
                    responses[response_number]["followup_generated"] = followup
                    self._save_log(log_data)
                break
    
    def log_expert_feedback(
        self,
        session_id: str,
        question_id: str,
        original_followup: Optional[Dict],
        action: str,
        rating: Optional[str] = None,
        edited_text: Optional[str] = None,
        custom_text: Optional[str] = None
    ):
        """Log expert feedback for evolutionary learning"""
        log_data = self._load_log()
        session_idx = self._find_session(session_id, log_data)
        
        if session_idx is None:
            return
        
        session = log_data["interview_sessions"][session_idx]
        
        # Ensure expert_feedback array exists
        if "expert_feedback" not in session:
            session["expert_feedback"] = []
        
        feedback_entry = {
            "timestamp": datetime.now().isoformat(),
            "question_id": question_id,
            "action": action,  # "approved", "edited", "overridden"
            "rating": rating,  # "good" or "bad"
            "original_followup": original_followup,
        }
        
        if action == "edited" and edited_text:
            feedback_entry["edited_text"] = edited_text
        elif action == "overridden" and custom_text:
            feedback_entry["custom_text"] = custom_text
        
        session["expert_feedback"].append(feedback_entry)
        
        # Update strategy performance metrics for evolutionary learning
        if original_followup and rating:
            strategy_id = original_followup.get("strategy_id", "unknown")
            if "strategy_performance" not in session:
                session["strategy_performance"] = {}
            
            if strategy_id not in session["strategy_performance"]:
                session["strategy_performance"][strategy_id] = {
                    "total_uses": 0,
                    "good_ratings": 0,
                    "bad_ratings": 0,
                    "edited_count": 0,
                    "overridden_count": 0
                }
            
            perf = session["strategy_performance"][strategy_id]
            perf["total_uses"] += 1
            
            if rating == "good":
                perf["good_ratings"] += 1
            elif rating == "bad":
                perf["bad_ratings"] += 1
            
            if action == "edited":
                perf["edited_count"] += 1
            elif action == "overridden":
                perf["overridden_count"] += 1
        
        self._save_log(log_data)
    
    def finalize_session(self, session_id: str):
        """Finalize session and update aggregate statistics"""
        log_data = self._load_log()
        session_idx = self._find_session(session_id, log_data)
        
        if session_idx is None:
            return
        
        # Update aggregate statistics
        stats = log_data.get("aggregate_statistics", {})
        stats["total_sessions"] = len(log_data.get("interview_sessions", []))
        
        # Calculate strategy rankings (simplified)
        # In full implementation, would aggregate across all sessions
        stats["strategy_rankings"] = []
        
        self._save_log(log_data)
    
    def get_log_data(self) -> Dict:
        """Get current log data"""
        return self._load_log()
    
    def get_successful_examples(self, strategy_id: Optional[str] = None, limit: int = 3) -> list:
        """
        Retrieve successful expert feedback examples for prompt enhancement.
        Returns examples where expert edited/overridden and rated as 'good',
        or where expert approved without changes (implying the AI did well).
        
        These examples are used for few-shot learning in LLM prompts.
        """
        log_data = self._load_log()
        examples = []
        
        for session in log_data.get("interview_sessions", []):
            feedback_list = session.get("expert_feedback", [])
            questions = session.get("questions", [])
            
            for feedback in feedback_list:
                # Skip if rating is "bad" - we only want successful examples
                if feedback.get("rating") == "bad":
                    continue
                
                # Filter by strategy if specified
                original = feedback.get("original_followup", {})
                if strategy_id and original.get("strategy_id") != strategy_id:
                    continue
                
                action = feedback.get("action")
                question_id = feedback.get("question_id")
                
                # Find the original question context
                question_context = None
                for q in questions:
                    if q.get("question_id") == question_id:
                        question_context = q
                        break
                
                example = {
                    "strategy_id": original.get("strategy_id"),
                    "action": action,
                    "rating": feedback.get("rating"),
                    "question_context": question_context.get("question_id") if question_context else None,
                }
                
                if action == "edited" and feedback.get("edited_text"):
                    # Expert improved the AI suggestion
                    example["ai_suggestion"] = original.get("text", "")
                    example["expert_improvement"] = feedback.get("edited_text")
                    example["learning"] = "Expert edited this to be better"
                    examples.append(example)
                    
                elif action == "overridden" and feedback.get("custom_text"):
                    # Expert replaced with their own - this is a gold standard example
                    example["ai_suggestion"] = original.get("text", "")
                    example["expert_improvement"] = feedback.get("custom_text")
                    example["learning"] = "Expert provided a better alternative"
                    examples.append(example)
                    
                elif action == "approved" and feedback.get("rating") == "good":
                    # AI did well - this is also useful to reinforce
                    example["ai_suggestion"] = original.get("text", "")
                    example["expert_improvement"] = original.get("text", "")  # Same text
                    example["learning"] = "AI suggestion was rated good by expert"
                    examples.append(example)
        
        # Sort by most recent (assuming they're appended chronologically)
        # and return limited examples
        return examples[-limit:] if len(examples) > limit else examples
    
    def get_strategy_success_rate(self) -> Dict:
        """
        Calculate success rate per strategy based on expert feedback.
        Used to inform strategy selection.
        """
        log_data = self._load_log()
        strategy_stats = {}
        
        for session in log_data.get("interview_sessions", []):
            perf = session.get("strategy_performance", {})
            
            for strategy_id, stats in perf.items():
                if strategy_id not in strategy_stats:
                    strategy_stats[strategy_id] = {
                        "total_uses": 0,
                        "good_ratings": 0,
                        "bad_ratings": 0,
                        "edited_count": 0,
                        "overridden_count": 0
                    }
                
                strategy_stats[strategy_id]["total_uses"] += stats.get("total_uses", 0)
                strategy_stats[strategy_id]["good_ratings"] += stats.get("good_ratings", 0)
                strategy_stats[strategy_id]["bad_ratings"] += stats.get("bad_ratings", 0)
                strategy_stats[strategy_id]["edited_count"] += stats.get("edited_count", 0)
                strategy_stats[strategy_id]["overridden_count"] += stats.get("overridden_count", 0)
        
        # Calculate success rates
        for strategy_id, stats in strategy_stats.items():
            total_rated = stats["good_ratings"] + stats["bad_ratings"]
            if total_rated > 0:
                stats["success_rate"] = stats["good_ratings"] / total_rated
                # Penalty for edits/overrides (expert had to fix it)
                stats["quality_score"] = stats["success_rate"] - (0.1 * stats["edited_count"] / max(1, stats["total_uses"])) - (0.2 * stats["overridden_count"] / max(1, stats["total_uses"]))
            else:
                stats["success_rate"] = 0.5  # No data, assume neutral
                stats["quality_score"] = 0.5
        
        return strategy_stats

