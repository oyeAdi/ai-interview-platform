"""
Tracking Module

Provides universal activity tracking for interview responses:
- Code answer tracking
- Text answer tracking
- Cheating detection data capture (future use)
"""

from .activity_tracker import (
    AnswerActivityTracker,
    ActivityData,
    RiskAssessment,
    Snapshot,
    PasteEvent,
    FocusChange,
    TypingMetrics,
    get_activity_risk_flags
)

__all__ = [
    "AnswerActivityTracker",
    "ActivityData",
    "RiskAssessment",
    "Snapshot",
    "PasteEvent",
    "FocusChange",
    "TypingMetrics",
    "get_activity_risk_flags"
]

