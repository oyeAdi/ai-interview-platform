"""Configuration management for AI Interviewer"""
import os
from typing import Optional

class Config:
    """Application configuration"""
    
    # Gemini API
    # Use new API key provided by user
    # Gemini API
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # Hugging Face API
    HUGGINGFACE_API_KEY: str = os.getenv("HUGGINGFACE_API_KEY", "")
    
    # Email Configuration
    SENDGRID_API_KEY: str = os.getenv("SENDGRID_API_KEY", "")
    SENDGRID_FROM_EMAIL: str = os.getenv("SENDGRID_FROM_EMAIL", "aditya_raj@epam.com")
    GMAIL_EMAIL: str = os.getenv("GMAIL_EMAIL", "brut.aditya@gmail.com")
    GMAIL_APP_PASSWORD: str = os.getenv("GMAIL_APP_PASSWORD", "")
    
    # Interview settings

    # Max follow-ups per question - AI decides dynamically when to stop (up to this limit)
    MAX_FOLLOWUPS_PER_QUESTION: int = int(os.getenv("MAX_FOLLOWUPS_PER_QUESTION", "8"))
    DEFAULT_QUESTIONS: int = int(os.getenv("DEFAULT_QUESTIONS", "5"))
    OPINION_THRESHOLD: int = int(os.getenv("OPINION_THRESHOLD", "4"))  # Form opinion after 4 follow-ups
    
    # File paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Candidate results directory
    CANDIDATE_RESULTS_DIR: str = os.path.join(BASE_DIR, "backend", "candidate_results")
    QUESTIONS_DIR: str = os.path.join(BASE_DIR, "backend", "questions")
    JDS_DIR: str = os.path.join(BASE_DIR, "backend", "jds")
    RESUMES_DIR: str = os.path.join(BASE_DIR, "backend", "resumes")
    LOGS_DIR: str = os.path.join(BASE_DIR, "backend", "logs")
    LOG_FILE: str = os.path.join(LOGS_DIR, "log.json")
    LOG_ARCHIVE_FILE: str = os.path.join(LOGS_DIR, "log_archive.json")
    
    # Log cleanup configuration (hybrid approach)
    MAX_SESSIONS_IN_LOG: int = 2  # Keep only last 2 sessions
    MAX_SESSION_AGE_DAYS: int = 1  # Keep sessions from last 1 day
    
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

