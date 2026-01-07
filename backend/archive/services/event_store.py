from typing import Dict, Any, List, Optional
from datetime import datetime
import json
from supabase_config import supabase_admin
from projections.session_state_projector import SessionStateProjector
from projections.qa_projector import QAProjector
from projections.performance_projector import PerformanceProjector

class EventStore:
    def __init__(self):
        self.table_name = "interview_events"
        self.projectors = []

    def register_projector(self, projector):
        self.projectors.append(projector)

    def append_event(self, session_id: str, event_type: str, event_data: Dict[str, Any], event_metadata: Optional[Dict[str, Any]] = None):
        """
        Append a new event to the store and trigger projectors.
        """
        try:
            # 1. Get the current maximum sequence number for this session
            response = supabase_admin.table(self.table_name)\
                .select("sequence_number")\
                .eq("session_id", session_id)\
                .order("sequence_number", desc=True)\
                .limit(1)\
                .execute()
            
            last_seq = response.data[0]["sequence_number"] if response.data else 0
            new_seq = last_seq + 1

            # 2. Insert the new event
            event_record = {
                "session_id": session_id,
                "event_type": event_type,
                "event_data": event_data,
                "event_metadata": event_metadata or {},
                "sequence_number": new_seq,
                "occurred_at": datetime.utcnow().isoformat()
            }
            
            insert_res = supabase_admin.table(self.table_name).insert(event_record).execute()
            
            if insert_res.data:
                # 3. Trigger projectors asynchronously (or synchronously for now for simplicity)
                self._trigger_projectors(insert_res.data[0])
                return insert_res.data[0]
            
            return None
        except Exception as e:
            print(f"[ERROR] EventStore.append_event: {e}")
            return None

    def get_events(self, session_id: str) -> List[Dict[str, Any]]:
        """Retrieve all events for a session in order"""
        try:
            response = supabase_admin.table(self.table_name)\
                .select("*")\
                .eq("session_id", session_id)\
                .order("sequence_number", desc=False)\
                .execute()
            return response.data or []
        except Exception as e:
            print(f"[ERROR] EventStore.get_events: {e}")
            return []

    def _trigger_projectors(self, event: Dict[str, Any]):
        """Propagate event to all registered projectors"""
        for projector in self.projectors:
            try:
                projector.handle_event(event)
            except Exception as e:
                print(f"[ERROR] Projector {projector.__class__.__name__} failed: {e}")

# Global instance for easy access
_event_store = None

def get_event_store():
    global _event_store
    if _event_store is None:
        _event_store = EventStore()
        # Register all Phase 2 Projectors
        _event_store.register_projector(SessionStateProjector())
        _event_store.register_projector(QAProjector())
        _event_store.register_projector(PerformanceProjector())
    return _event_store
