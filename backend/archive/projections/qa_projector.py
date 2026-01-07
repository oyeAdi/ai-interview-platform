from typing import Dict, Any
from supabase_config import supabase_admin

class QAProjector:
    """
    Projector that maintains the 'qa_projection' table for results and analysis.
    """
    def __init__(self):
        self.table_name = "qa_projection"

    def handle_event(self, event: Dict[str, Any]):
        event_type = event.get("event_type")
        session_id = event.get("session_id")
        data = event.get("event_data", {})
        
        if event_type == "QuestionAsked":
            self._on_question_asked(session_id, data, event.get("occurred_at"))
        elif event_type == "ResponseScored":
            self._on_response_scored(session_id, data, event.get("occurred_at"))

    def _on_question_asked(self, session_id: str, data: Dict[str, Any], timestamp: str):
        """Record the asked question"""
        payload = {
            "session_id": session_id,
            "question_number": data.get("question_number"), # Need to ensure this is passed in event
            "question_text": data.get("question_text"),
            "question_category": data.get("question_category"),
            "asked_at": timestamp
        }
        try:
            supabase_admin.table(self.table_name).upsert(payload, on_conflict="session_id, question_number").execute()
        except Exception as e:
            print(f"[ERROR] QAProjector._on_question_asked: {e}")

    def _on_response_scored(self, session_id: str, data: Dict[str, Any], timestamp: str):
        """Update question with answer and score"""
        payload = {
            "answer_text": data.get("answer_text"),
            "score": data.get("scores", {}).get("overall"),
            "evaluation_reasoning": data.get("llm_reasoning"),
            "answered_at": timestamp
        }
        try:
            # We assume question_number is available in ResponseScored data or we match by session_id and latest question
            # For now, let's assume data has question_number
            q_num = data.get("question_number")
            if q_num:
                supabase_admin.table(self.table_name).update(payload).eq("session_id", session_id).eq("question_number", q_num).execute()
        except Exception as e:
            print(f"[ERROR] QAProjector._on_response_scored: {e}")
