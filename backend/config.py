"""Configuration management for AI Interviewer"""
import os
from typing import Optional

class Config:
    """Application configuration"""
    
    # Gemini API
    # Use new API key provided by user
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "AIzaSyAhMC13D-v4DcX1pMJ1JvtaZHO7gJOmmI4")
    
    # Interview settings

    # Max follow-ups per question - AI decides dynamically when to stop (up to this limit)
    MAX_FOLLOWUPS_PER_QUESTION: int = int(os.getenv("MAX_FOLLOWUPS_PER_QUESTION", "8"))
    DEFAULT_QUESTIONS: int = int(os.getenv("DEFAULT_QUESTIONS", "5"))
    
    # File paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Candidate results directory
    CANDIDATE_RESULTS_DIR: str = os.path.join(BASE_DIR, "backend", "candidate_results")
    QUESTIONS_DIR: str = os.path.join(BASE_DIR, "backend", "questions")
    JDS_DIR: str = os.path.join(BASE_DIR, "backend", "jds")
    RESUMES_DIR: str = os.path.join(BASE_DIR, "backend", "resumes")
    LOGS_DIR: str = os.path.join(BASE_DIR, "backend", "logs")
    LOG_FILE: str = os.path.join(LOGS_DIR, "log.json")
    
    # Strategy parameters
    DEFAULT_STRATEGY_WEIGHTS: dict = {
        "depth_focused": 0.25,
        "clarification": 0.25,
        "breadth_focused": 0.25,
        "challenge": 0.25
    }
    
    # Evaluation thresholds
    COMPLETENESS_THRESHOLD: int = 70
    DEPTH_THRESHOLD: int = 60
    HIGH_SCORE_THRESHOLD: int = 90
    
    @classmethod
    def validate(cls) -> bool:
        """Validate configuration"""
        if not cls.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        return True

