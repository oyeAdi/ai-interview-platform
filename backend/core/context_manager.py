"""Interview context management"""
from typing import Dict, List, Optional
from datetime import datetime
import uuid

class ContextManager:
    """Manages interview context throughout the session"""
    
    def __init__(self, detected_language: str, jd_id: Optional[str] = None, session_id: Optional[str] = None):
        # Use provided session_id or generate new one
        if session_id:
            self.session_id = session_id
        else:
            self.session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        self.context = {
            "interview_context": {
                "session_id": self.session_id,
                "detected_language": detected_language,
                "jd_id": jd_id,
                "current_round": 0,
                "current_question_index": 0,
                "current_followup_number": 0,
                "questions_asked": [],
                "round_summaries": [],
                "overall_metrics": {
                    "average_score": 0.0,
                    "score_trend": "stable",
                    "topics_covered": [],
                    "topics_pending": [],
                    "overall_gaps": [],
                    "overall_strengths": [],
                    "overall_weaknesses": []
                },
                "strategy_context": {
                    "current_strategy": None,
                    "strategy_history": [],
                    "available_strategies": {
                        "depth_focused": {"weight": 0.25, "last_performance": None},
                        "clarification": {"weight": 0.25, "last_performance": None},
                        "breadth_focused": {"weight": 0.25, "last_performance": None},
                        "challenge": {"weight": 0.25, "last_performance": None}
                    }
                }
            }
        }
    
    def get_context(self) -> Dict:
        """Get current context"""
        return self.context
    
    def update_round(self, round_number: int):
        """Update current round number"""
        self.context["interview_context"]["current_round"] = round_number
    
    def update_question_index(self, index: int):
        """Update current question index"""
        self.context["interview_context"]["current_question_index"] = index
    
    def update_followup_number(self, number: int):
        """Update current follow-up number"""
        self.context["interview_context"]["current_followup_number"] = number
    
    def add_question_asked(self, question_id: str):
        """Add question ID to asked list"""
        if question_id not in self.context["interview_context"]["questions_asked"]:
            self.context["interview_context"]["questions_asked"].append(question_id)
    
    def add_round_summary(self, summary: Dict):
        """Add round summary"""
        self.context["interview_context"]["round_summaries"].append(summary)
    
    def update_overall_metrics(self, metrics: Dict):
        """Update overall metrics"""
        self.context["interview_context"]["overall_metrics"].update(metrics)
    
    def update_strategy_context(self, strategy_id: str, performance: Optional[float] = None):
        """Update strategy context"""
        strategy_ctx = self.context["interview_context"]["strategy_context"]
        strategy_ctx["current_strategy"] = strategy_id
        
        if performance is not None:
            if strategy_id in strategy_ctx["available_strategies"]:
                strategy_ctx["available_strategies"][strategy_id]["last_performance"] = performance
            
            strategy_ctx["strategy_history"].append({
                "strategy": strategy_id,
                "round": self.context["interview_context"]["current_round"],
                "performance": performance
            })
    
    def get_current_round_summary(self) -> Optional[Dict]:
        """Get current round summary"""
        round_num = self.context["interview_context"]["current_round"]
        summaries = self.context["interview_context"]["round_summaries"]
        for summary in summaries:
            if summary.get("round_number") == round_num:
                return summary
        return None

