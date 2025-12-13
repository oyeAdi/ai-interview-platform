"""Question bank management and selection"""
import json
import os
import random
from typing import Dict, List, Optional
from backend.config import Config

class QuestionManager:
    """Manages question bank and intelligent question selection"""
    
    def __init__(self, language: str):
        self.language = language
        self.question_bank: List[Dict] = []
        self.questions_asked: List[str] = []
        self.load_question_bank()
    
    def load_question_bank(self):
        """Load question bank from JSON file"""
        question_file = os.path.join(
            Config.QUESTIONS_DIR, 
            f"{self.language}.json"
        )
        
        if not os.path.exists(question_file):
            raise FileNotFoundError(f"Question bank not found: {question_file}")
        
        with open(question_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            self.question_bank = data.get("questions", [])
    
    def select_question(self, context: Dict) -> Optional[Dict]:
        """
        Intelligently select next question based on context
        Uses topic-based selection, avoids duplicates
        """
        if not self.question_bank:
            return None
        
        # Get topics already covered
        topics_covered = set()
        for summary in context.get("round_summaries", []):
            if "topic" in summary:
                topics_covered.add(summary["topic"])
        
        # Filter questions
        available_questions = [
            q for q in self.question_bank 
            if q["id"] not in self.questions_asked
        ]
        
        if not available_questions:
            # All questions asked, reset or return None
            return None
        
        # Prefer questions from uncovered topics
        uncovered_questions = [
            q for q in available_questions
            if q.get("topic") not in topics_covered
        ]
        
        if uncovered_questions:
            selected = random.choice(uncovered_questions)
        else:
            # All topics covered, select any available
            selected = random.choice(available_questions)
        
        self.questions_asked.append(selected["id"])
        return selected
    
    def get_question_by_id(self, question_id: str) -> Optional[Dict]:
        """Get question by ID"""
        for q in self.question_bank:
            if q["id"] == question_id:
                return q
        return None
    
    def get_topics(self) -> List[str]:
        """Get all available topics"""
        topics = set()
        for q in self.question_bank:
            if "topic" in q:
                topics.add(q["topic"])
        return list(topics)





