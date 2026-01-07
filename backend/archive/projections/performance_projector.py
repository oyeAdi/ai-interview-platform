from typing import Dict, Any
from supabase_config import supabase_admin

class PerformanceProjector:
    """
    Projector that maintains the 'performance_projection' table for analytics and final scores.
    """
    def __init__(self):
        self.table_name = "performance_projection"

    def handle_event(self, event: Dict[str, Any]):
        event_type = event.get("event_type")
        session_id = event.get("session_id")
        data = event.get("event_data", {})
        
        if event_type == "ResponseScored":
            self._on_response_scored(session_id, data)
        elif event_type == "InterviewCompleted":
            self._on_interview_completed(session_id, data)

    def _on_response_scored(self, session_id: str, data: Dict[str, Any]):
        """Update aggregate scores based on new evaluation"""
        # In a real event sourcing system, we might re-calculate everything from all events
        # For simplicity here, we'll do an incremental update or let the evaluator calculate the totals
        
        overall = data.get("scores", {}).get("overall", 0)
        
        # We'll use a JSONB update for category_scores if we had a more complex scoring agent
        # For now, let's just update the overall_score if it's the latest
        payload = {
            "session_id": session_id,
            "overall_score": overall, # This would ideally be an average or weighted sum
            "calculated_at": "now()"
        }
        try:
            supabase_admin.table(self.table_name).upsert(payload).execute()
        except Exception as e:
            print(f"[ERROR] PerformanceProjector._on_response_scored: {e}")

    def _on_interview_completed(self, session_id: str, data: Dict[str, Any]):
        """Finalize recommendation and summary"""
        payload = {
            "recommendation": data.get("recommendation"),
            "calculated_at": "now()"
        }
        try:
            supabase_admin.table(self.table_name).update(payload).eq("session_id", session_id).execute()
        except Exception as e:
            print(f"[ERROR] PerformanceProjector._on_interview_completed: {e}")
