"""Log management - continuous appending to log.json"""
import json
import os
from typing import Dict, Optional, List
from datetime import datetime, timedelta
from config import Config

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
    
    def _cleanup_old_sessions(self, log_data: Dict):
        """Clean slate approach: Archive ALL old sessions, keep ONLY the current session"""
        sessions = log_data.get("interview_sessions", [])
        
        if len(sessions) <= 1:
            # Only current session, nothing to cleanup
            return
        
        # Archive ALL sessions except the last one (current session)
        old_sessions = sessions[:-1]
        current_session = sessions[-1:]
        
        if old_sessions:
            self._archive_sessions(old_sessions)
            log_data["interview_sessions"] = current_session
            print(f"[INFO] Clean slate: Archived {len(old_sessions)} old sessions, keeping only current session")
    
    def _archive_sessions(self, sessions: List[Dict]):
        """Archive old sessions to log_archive.json"""
        archive_file = Config.LOG_ARCHIVE_FILE
        
        # Load existing archive
        if os.path.exists(archive_file):
            try:
                with open(archive_file, 'r', encoding='utf-8') as f:
                    archive_data = json.load(f)
            except (FileNotFoundError, json.JSONDecodeError):
                archive_data = {"archived_sessions": []}
        else:
            archive_data = {"archived_sessions": []}
        
        # Append old sessions
        archive_data["archived_sessions"].extend(sessions)
        archive_data["last_archived"] = datetime.now().isoformat()
        archive_data["total_archived"] = len(archive_data["archived_sessions"])
        
        # Save archive
        os.makedirs(os.path.dirname(archive_file), exist_ok=True)
        with open(archive_file, 'w', encoding='utf-8') as f:
            json.dump(archive_data, f, indent=2, ensure_ascii=False)
        
        print(f"[INFO] Archived {len(sessions)} sessions to {archive_file}")
    
    def initialize_session(self, session_id: str, language: str, jd_id: Optional[str] = None):
        """Initialize new session in log - MINIMAL data only with hybrid cleanup"""
        log_data = self._load_log()
        
        # Check if session already exists
        session_idx = self._find_session(session_id, log_data)
        
        if session_idx is None:
            # Create new session with MINIMAL data
            # NO duplicates - state data belongs in sessions.json
            new_session = {
                "session_id": session_id,  # Reference only (for lookup)
                "detected_language": language,  # Interview-specific data
                "created_at": datetime.now().isoformat(),  # For cleanup logic
                "questions": [],  # Transcript data
                "strategy_performance": {},  # Analytics data
                "expert_feedback": []  # Analytics data
            }
            log_data["interview_sessions"].append(new_session)
            
            # HYBRID CLEANUP: Keep last N sessions OR sessions from last N days
            self._cleanup_old_sessions(log_data)
            
            self._save_log(log_data)
    
    def log_question(
        self,
        session_id: str,
        question_id: str,
        question_text: str,
        question_type: str,
        round_number: int,
        category: Optional[str] = None,
        topic: Optional[str] = None
    ):
        """Log the main question when it's first asked"""
        log_data = self._load_log()
        session_idx = self._find_session(session_id, log_data)
        
        if session_idx is None:
            self.initialize_session(session_id, "unknown")
            log_data = self._load_log()
            session_idx = self._find_session(session_id, log_data)
        
        session = log_data["interview_sessions"][session_idx]
        
        # Check if question already exists
        question_entry = None
        for q in session.get("questions", []):
            if q.get("question_id") == question_id:
                question_entry = q
                break
        
        if question_entry is None:
            # Create new question entry with full details
            question_entry = {
                "question_id": question_id,
                "round_number": round_number,
                "question_text": question_text,
                "question_type": question_type,
                "category": category,
                "topic": topic,
                "timestamp": datetime.now().isoformat(),
                "responses": []
            }
            session.setdefault("questions", []).append(question_entry)
            self._save_log(log_data)
        else:
            # Update existing entry if it doesn't have question_text
            if "question_text" not in question_entry:
                question_entry["question_text"] = question_text
                question_entry["question_type"] = question_type
                question_entry["category"] = category
                question_entry["topic"] = topic
                question_entry["timestamp"] = datetime.now().isoformat()
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
    
    def get_session_log(self, session_id: str) -> Optional[Dict]:
        """Get log data for specific session"""
        log_data = self._load_log()
        session_idx = self._find_session(session_id, log_data)
        if session_idx is not None:
            return log_data["interview_sessions"][session_idx]
        return None

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


    def log_email_event(self, session_id: str, event_type: str, data: dict):
        '''Log email-related events'''
        log_data = self._load_log()
        session_idx = self._find_session(session_id, log_data)
        if session_idx is None:
            return
        session = log_data['interview_sessions'][session_idx]
        if 'email_events' not in session:
            session['email_events'] = []
        session['email_events'].append({'event_type': event_type, 'timestamp': datetime.now().isoformat(), **data})
        self._save_log(log_data)
    
    def log_resume_parse(self, session_id: str, data: dict):
        '''Log resume parsing events'''
        log_data = self._load_log()
        session_idx = self._find_session(session_id, log_data)
        if session_idx is None:
            return
        session = log_data['interview_sessions'][session_idx]
        if 'resume_parse_events' not in session:
            session['resume_parse_events'] = []
        session['resume_parse_events'].append({'timestamp': datetime.now().isoformat(), **data})
        self._save_log(log_data)
