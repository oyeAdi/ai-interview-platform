"""
Universal Activity Tracker

Tracks activity for ALL question types (coding and text answers)
to capture data for future cheating detection.

Current Mode: Capture-only (data stored but not acted upon)
"""

import json
import os
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field, asdict
from datetime import datetime


@dataclass
class Snapshot:
    """A periodic snapshot of the answer"""
    timestamp: float
    length: int
    text_preview: str  # First 50 chars for reference


@dataclass
class PasteEvent:
    """A detected paste event"""
    timestamp: float
    chars_added: int
    source: str = "external"


@dataclass
class FocusChange:
    """A tab/window focus change"""
    timestamp: float
    focused: bool


@dataclass
class TypingMetrics:
    """Metrics about typing behavior"""
    total_time_ms: float = 0
    chars_typed: int = 0
    chars_pasted: int = 0
    paste_ratio: float = 0
    avg_typing_speed: float = 0  # chars per minute


@dataclass
class ActivityData:
    """Complete activity tracking data for a response"""
    question_id: str
    question_type: str
    snapshots: List[Snapshot] = field(default_factory=list)
    paste_events: List[PasteEvent] = field(default_factory=list)
    focus_changes: List[FocusChange] = field(default_factory=list)
    typing_metrics: TypingMetrics = field(default_factory=TypingMetrics)
    start_time: float = 0
    end_time: Optional[float] = None


@dataclass
class RiskAssessment:
    """Risk assessment based on activity data"""
    flags: List[str] = field(default_factory=list)
    risk_score: float = 0  # 0-100
    requires_review: bool = False
    details: Dict[str, Any] = field(default_factory=dict)


class AnswerActivityTracker:
    """
    Tracks activity for ALL question types - coding AND text answers.
    
    Currently in capture-only mode: data is stored for future analysis
    but no actions are taken based on the data.
    """
    
    # Thresholds for flagging (configurable)
    LARGE_PASTE_THRESHOLD = 200  # chars
    HIGH_PASTE_RATIO_THRESHOLD = 0.7  # 70% pasted
    FREQUENT_FOCUS_LOSS_THRESHOLD = 5  # times
    FAST_ANSWER_THRESHOLD = 30  # seconds for complex questions
    
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.question_activities: Dict[str, ActivityData] = {}
        self.storage_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "models",
            "activity_logs.json"
        )
    
    def start_tracking(self, question_id: str, question_type: str) -> None:
        """Start tracking activity for a question"""
        self.question_activities[question_id] = ActivityData(
            question_id=question_id,
            question_type=question_type,
            start_time=datetime.utcnow().timestamp() * 1000
        )
    
    def capture_snapshot(
        self,
        question_id: str,
        answer_text: str,
        timestamp: Optional[float] = None
    ) -> None:
        """Capture a periodic snapshot of the answer"""
        if question_id not in self.question_activities:
            return
        
        timestamp = timestamp or (datetime.utcnow().timestamp() * 1000)
        snapshot = Snapshot(
            timestamp=timestamp,
            length=len(answer_text),
            text_preview=answer_text[:50] if answer_text else ""
        )
        self.question_activities[question_id].snapshots.append(snapshot)
    
    def detect_large_paste(
        self,
        question_id: str,
        old_text: str,
        new_text: str,
        timestamp: Optional[float] = None
    ) -> Optional[Dict]:
        """Detect if a large paste occurred"""
        if question_id not in self.question_activities:
            return None
        
        chars_added = len(new_text) - len(old_text)
        
        if chars_added > self.LARGE_PASTE_THRESHOLD:
            timestamp = timestamp or (datetime.utcnow().timestamp() * 1000)
            paste_event = PasteEvent(
                timestamp=timestamp,
                chars_added=chars_added,
                source="external"
            )
            self.question_activities[question_id].paste_events.append(paste_event)
            
            return {
                "detected": True,
                "chars_added": chars_added,
                "timestamp": timestamp
            }
        
        return None
    
    def track_tab_focus(
        self,
        question_id: str,
        focused: bool,
        timestamp: Optional[float] = None
    ) -> None:
        """Track tab/window focus changes"""
        if question_id not in self.question_activities:
            return
        
        timestamp = timestamp or (datetime.utcnow().timestamp() * 1000)
        focus_change = FocusChange(
            timestamp=timestamp,
            focused=focused
        )
        self.question_activities[question_id].focus_changes.append(focus_change)
    
    def get_typing_pattern(self, question_id: str) -> Dict:
        """Get typing pattern metrics"""
        if question_id not in self.question_activities:
            return {}
        
        activity = self.question_activities[question_id]
        return asdict(activity.typing_metrics)
    
    def finalize_tracking(
        self,
        question_id: str,
        typing_metrics: Optional[Dict] = None
    ) -> ActivityData:
        """Finalize tracking for a question and return activity data"""
        if question_id not in self.question_activities:
            return None
        
        activity = self.question_activities[question_id]
        activity.end_time = datetime.utcnow().timestamp() * 1000
        
        # Update typing metrics if provided
        if typing_metrics:
            activity.typing_metrics = TypingMetrics(
                total_time_ms=typing_metrics.get("total_time_ms", 0),
                chars_typed=typing_metrics.get("chars_typed", 0),
                chars_pasted=typing_metrics.get("chars_pasted", 0),
                paste_ratio=typing_metrics.get("paste_ratio", 0),
                avg_typing_speed=typing_metrics.get("avg_typing_speed", 0)
            )
        
        return activity
    
    def assess_risk(self, question_id: str) -> RiskAssessment:
        """
        Assess cheating risk based on activity data.
        
        Currently capture-only - returns flags but doesn't block.
        """
        if question_id not in self.question_activities:
            return RiskAssessment()
        
        activity = self.question_activities[question_id]
        assessment = RiskAssessment()
        risk_score = 0
        
        # Check for large paste events
        total_pasted = sum(p.chars_added for p in activity.paste_events)
        if total_pasted > self.LARGE_PASTE_THRESHOLD:
            assessment.flags.append("large_paste_detected")
            risk_score += 30
            assessment.details["total_chars_pasted"] = total_pasted
        
        # Check paste ratio
        if activity.typing_metrics.paste_ratio > self.HIGH_PASTE_RATIO_THRESHOLD:
            assessment.flags.append("high_paste_ratio")
            risk_score += 25
            assessment.details["paste_ratio"] = activity.typing_metrics.paste_ratio
        
        # Check focus changes
        focus_losses = sum(1 for f in activity.focus_changes if not f.focused)
        if focus_losses > self.FREQUENT_FOCUS_LOSS_THRESHOLD:
            assessment.flags.append("frequent_focus_loss")
            risk_score += 20
            assessment.details["focus_losses"] = focus_losses
        
        # Check answer time (if it seems suspiciously fast)
        if activity.end_time and activity.start_time:
            answer_time_sec = (activity.end_time - activity.start_time) / 1000
            if answer_time_sec < self.FAST_ANSWER_THRESHOLD and total_pasted > 100:
                assessment.flags.append("unusually_fast_answer")
                risk_score += 15
                assessment.details["answer_time_sec"] = answer_time_sec
        
        # Check for paste immediately after focus loss
        for paste in activity.paste_events:
            for focus in activity.focus_changes:
                if (not focus.focused and 
                    paste.timestamp > focus.timestamp and 
                    paste.timestamp - focus.timestamp < 5000):  # Within 5 seconds
                    if "focus_lost_before_paste" not in assessment.flags:
                        assessment.flags.append("focus_lost_before_paste")
                        risk_score += 20
                        break
        
        assessment.risk_score = min(100, risk_score)
        assessment.requires_review = assessment.risk_score >= 50
        
        return assessment
    
    def save_activity(self) -> None:
        """Save all activity data to storage"""
        try:
            # Load existing data
            if os.path.exists(self.storage_path):
                with open(self.storage_path, 'r') as f:
                    all_data = json.load(f)
            else:
                all_data = {"sessions": {}}
            
            # Add this session's data
            session_data = {
                "session_id": self.session_id,
                "saved_at": datetime.utcnow().isoformat(),
                "questions": {}
            }
            
            for qid, activity in self.question_activities.items():
                session_data["questions"][qid] = self._serialize_activity(activity)
            
            all_data["sessions"][self.session_id] = session_data
            
            # Save
            os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)
            with open(self.storage_path, 'w') as f:
                json.dump(all_data, f, indent=2)
                
        except Exception as e:
            print(f"Error saving activity data: {e}")
    
    def _serialize_activity(self, activity: ActivityData) -> Dict:
        """Serialize activity data to dict"""
        return {
            "question_id": activity.question_id,
            "question_type": activity.question_type,
            "start_time": activity.start_time,
            "end_time": activity.end_time,
            "snapshots": [asdict(s) for s in activity.snapshots],
            "paste_events": [asdict(p) for p in activity.paste_events],
            "focus_changes": [asdict(f) for f in activity.focus_changes],
            "typing_metrics": asdict(activity.typing_metrics)
        }
    
    @staticmethod
    def from_api_data(data: Dict) -> ActivityData:
        """Create ActivityData from API payload"""
        return ActivityData(
            question_id=data.get("question_id", ""),
            question_type=data.get("question_type", ""),
            start_time=data.get("start_time", 0),
            end_time=data.get("end_time"),
            snapshots=[
                Snapshot(
                    timestamp=s.get("timestamp", 0),
                    length=s.get("length", 0),
                    text_preview=s.get("text_preview", "")
                )
                for s in data.get("snapshots", [])
            ],
            paste_events=[
                PasteEvent(
                    timestamp=p.get("timestamp", 0),
                    chars_added=p.get("chars_added", 0),
                    source=p.get("source", "external")
                )
                for p in data.get("paste_events", [])
            ],
            focus_changes=[
                FocusChange(
                    timestamp=f.get("timestamp", 0),
                    focused=f.get("focused", True)
                )
                for f in data.get("focus_changes", [])
            ],
            typing_metrics=TypingMetrics(
                total_time_ms=data.get("typing_metrics", {}).get("total_time_ms", 0),
                chars_typed=data.get("typing_metrics", {}).get("chars_typed", 0),
                chars_pasted=data.get("typing_metrics", {}).get("chars_pasted", 0),
                paste_ratio=data.get("typing_metrics", {}).get("paste_ratio", 0),
                avg_typing_speed=data.get("typing_metrics", {}).get("avg_typing_speed", 0)
            )
        )


# Convenience function for quick risk flags
def get_activity_risk_flags(activity_data: Dict) -> List[str]:
    """
    Quick function to get risk flags from activity data.
    
    Args:
        activity_data: Activity data dict from API
    
    Returns:
        List of risk flag strings
    """
    flags = []
    
    # Check paste events
    paste_events = activity_data.get("paste_events", [])
    total_pasted = sum(p.get("chars_added", 0) for p in paste_events)
    if total_pasted > 200:
        flags.append("large_paste_detected")
    
    # Check paste ratio
    metrics = activity_data.get("typing_metrics", {})
    if metrics.get("paste_ratio", 0) > 0.7:
        flags.append("high_paste_ratio")
    
    # Check focus changes
    focus_changes = activity_data.get("focus_changes", [])
    focus_losses = sum(1 for f in focus_changes if not f.get("focused", True))
    if focus_losses > 5:
        flags.append("frequent_focus_loss")
    
    return flags

