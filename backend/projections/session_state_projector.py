from typing import Dict, Any
from supabase_config import supabase_admin
import asyncio

class SessionStateProjector:
    """
    Projector that maintains the 'session_state_projection' table for real-time monitoring.
    """
    def __init__(self):
        self.table_name = "session_state_projection"

    def handle_event(self, event: Dict[str, Any]):
        """Route event to the correct projection update handler"""
        event_type = event.get("event_type")
        session_id = event.get("session_id")
        data = event.get("event_data", {})
        
        # We run these as background tasks if needed, but for now direct calls
        if event_type == "InterviewStarted":
            self._on_interview_started(session_id, data)
        elif event_type == "QuestionAsked":
            self._on_question_asked(session_id, data)
        elif event_type == "AnswerSubmitted":
            self._on_answer_submitted(session_id, data)
        elif event_type == "ResponseScored":
            self._on_response_scored(session_id, data)
        elif event_type == "InterviewCompleted":
            self._on_interview_completed(session_id, data)

    def _on_interview_started(self, session_id: str, data: Dict[str, Any]):
        """Initialize session state projection"""
        payload = {
            "session_id": session_id,
            "current_state": "started",
            "candidate_name": data.get("candidate_name"),
            "position_title": data.get("position_title"),
            "expert_name": data.get("expert_name"),
            "detected_language": data.get("language"),
            "last_updated_at": "now()"
        }
        try:
            supabase_admin.table(self.table_name).upsert(payload).execute()
        except Exception as e:
            print(f"[ERROR] SessionStateProjector._on_interview_started: {e}")

    def _on_question_asked(self, session_id: str, data: Dict[str, Any]):
        """Update current question and phase"""
        payload = {
            "current_state": "questioning",
            "current_phase": data.get("question_category"),
            "current_question_id": data.get("question_id"),
            "last_updated_at": "now()"
        }
        # Increment questions_asked using raw RPC if possible, or just fetch and update
        # For simplicity in this implementation, we'll do a partial update
        try:
            # First fetch current to increment locally if needed, but let's try direct update first
            # We can use the 'increment' logic if we had the RPC, otherwise we'll just set it
            supabase_admin.table(self.table_name).update(payload).eq("session_id", session_id).execute()
        except Exception as e:
            print(f"[ERROR] SessionStateProjector._on_question_asked: {e}")

    def _on_answer_submitted(self, session_id: str, data: Dict[str, Any]):
        """Update state to evaluating"""
        payload = {
            "current_state": "evaluating",
            "last_updated_at": "now()"
        }
        try:
            supabase_admin.table(self.table_name).update(payload).eq("session_id", session_id).execute()
        except Exception as e:
            print(f"[ERROR] SessionStateProjector._on_answer_submitted: {e}")

    def _on_response_scored(self, session_id: str, data: Dict[str, Any]):
        """Return to questioning state or wait for next action"""
        payload = {
            "current_state": "questioning",
            "last_updated_at": "now()"
        }
        try:
            supabase_admin.table(self.table_name).update(payload).eq("session_id", session_id).execute()
        except Exception as e:
            print(f"[ERROR] SessionStateProjector._on_response_scored: {e}")

    def _on_interview_completed(self, session_id: str, data: Dict[str, Any]):
        """Mark session as completed"""
        payload = {
            "current_state": "completed",
            "last_updated_at": "now()"
        }
        try:
            supabase_admin.table(self.table_name).update(payload).eq("session_id", session_id).execute()
        except Exception as e:
            print(f"[ERROR] SessionStateProjector._on_interview_completed: {e}")
