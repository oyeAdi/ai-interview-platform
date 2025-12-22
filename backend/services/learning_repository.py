"""Global Learning Repository - Supabase-backed knowledge base for system improvement."""

from typing import List, Dict, Any, Optional
from datetime import datetime
import json
from supabase_config import supabase_admin
from services.event_store import get_event_store

class LearningRepository:
    """Manages global learning knowledge base via Supabase."""
    
    def __init__(self):
        self.table_name = "learning_repository"
        self.admin = supabase_admin
        self.event_store = get_event_store()
    
    def add_learning(
        self, 
        pattern: str, 
        category: str, 
        confidence: float,
        session_id: str,
        applicable_to: List[str] = None,
        tags: List[str] = None
    ) -> str:
        """Add new learning or update existing one in Supabase."""
        # Check for similar patterns
        response = self.admin.table(self.table_name).select('*').eq('pattern', pattern).execute()
        existing = response.data[0] if response.data else None
        
        if existing:
            learning_id = self._update_learning(existing, confidence, session_id)
        else:
            learning_id = self._create_learning(pattern, category, confidence, session_id, applicable_to, tags)
            
        # Emit event for real-time monitoring
        self.event_store.append_event(
            session_id,
            "ObserverLearned",
            {
                "learning_id": learning_id,
                "pattern": pattern,
                "category": category,
                "confidence_score": confidence
            }
        )
        return learning_id
    
    def _create_learning(
        self, 
        pattern: str, 
        category: str, 
        confidence: float, 
        session_id: str,
        applicable_to: List[str] = None,
        tags: List[str] = None
    ) -> str:
        learning_id = f"{category[:4]}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        new_entry = {
            "learning_id": learning_id,
            "pattern": pattern,
            "category": category,
            "confidence_score": confidence,
            "frequency": 1,
            "applicable_to": applicable_to or ["SystemAgent"],
            "decision_context": "Auto-extracted from session",
            "impact_on_confidence": 0.05,
            "source_sessions": [session_id],
            "tags": tags or [],
            "status": "active"
        }
        
        response = self.admin.table(self.table_name).insert(new_entry).execute()
        return response.data[0]["learning_id"] if response.data else learning_id

    def _update_learning(self, existing: Dict[str, Any], confidence: float, session_id: str) -> str:
        source_sessions = existing.get("source_sessions", [])
        if session_id not in source_sessions:
            source_sessions.append(session_id)
            frequency = existing.get("frequency", 1) + 1
            # Weighted average for confidence
            new_confidence = (existing.get("confidence_score", 0) * (frequency - 1) + confidence) / frequency
            
            update_data = {
                "source_sessions": source_sessions,
                "frequency": frequency,
                "confidence_score": new_confidence,
                "updated_at": datetime.now().isoformat()
            }
            
            self.admin.table(self.table_name).update(update_data).eq('id', existing['id']).execute()
            
        return existing["learning_id"]

    def get_high_confidence_learnings(
        self, 
        min_confidence: float = 0.7,
        category: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Fetch high-confidence learnings from Supabase."""
        query = self.admin.table(self.table_name).select('*').gte('confidence_score', min_confidence).eq('status', 'active')
        
        if category:
            query = query.eq('category', category)
            
        response = query.order('confidence_score', desc=True).limit(limit).execute()
        return response.data if response.data else []

    def get_metrics(self) -> Dict[str, Any]:
        """Expose IQ metrics for Intelligence Hub."""
        response = self.admin.table(self.table_name).select('id', 'frequency', 'confidence_score').execute()
        data = response.data or []
        
        return {
            "total_learnings": len(data),
            "avg_confidence": sum(d['confidence_score'] for d in data) / len(data) if data else 0,
            "intelligence_level": "Expert" if len(data) > 100 else "Intermediate" if len(data) > 20 else "Novice"
        }

# Singleton
_repo_instance = None

def get_learning_repository() -> LearningRepository:
    global _repo_instance
    if _repo_instance is None:
        _repo_instance = LearningRepository()
    return _repo_instance
