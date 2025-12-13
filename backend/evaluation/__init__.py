"""
Evaluation Module

Provides comprehensive evaluation capabilities for:
- Code submissions
- Interview responses
- Candidate performance
"""

from .code_evaluator import (
    CodeEvaluator,
    CodeSubmission,
    CodeEvaluation,
    StaticAnalysisResult,
    evaluate_code_submission
)

__all__ = [
    "CodeEvaluator",
    "CodeSubmission", 
    "CodeEvaluation",
    "StaticAnalysisResult",
    "evaluate_code_submission"
]
