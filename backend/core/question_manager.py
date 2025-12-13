"""Question bank management and selection"""
import json
import os
import random
from typing import Dict, List, Optional
from backend.config import Config

# Path to the centralized question bank
QUESTION_BANK_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models", "question_bank.json")

class QuestionManager:
    """Manages question bank and intelligent question selection"""
    
    def __init__(self, language: str):
        self.language = language
        self.question_bank: List[Dict] = []
        self.questions_asked: List[str] = []
        self.load_question_bank()
    
    def load_question_bank(self):
        """Load question bank from JSON file"""
        # First try the centralized question bank
        if os.path.exists(QUESTION_BANK_PATH):
            with open(QUESTION_BANK_PATH, 'r', encoding='utf-8') as f:
                data = json.load(f)
                all_questions = data.get("questions", [])
                # Filter by language if applicable (for coding questions)
                self.question_bank = [
                    q for q in all_questions 
                    if q.get("language", "").lower() == self.language.lower() 
                    or q.get("category") != "coding"  # Include non-coding questions
                    or self.language.lower() in [s.lower() for s in q.get("skills", [])]
                ]
                return
        
        # Fallback to language-specific file
        question_file = os.path.join(
            Config.QUESTIONS_DIR, 
            f"{self.language}.json"
        )
        
        if not os.path.exists(question_file):
            # If no file exists, use empty bank
            self.question_bank = []
            return
        
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
    
    def find_seed_question(
        self, 
        experience_level: str = "mid",
        skills: List[str] = None,
        category: str = None,
        difficulty: str = None
    ) -> Optional[Dict]:
        """
        Find a seed question from the bank based on criteria.
        Used as a structural template for AI-enhanced questions.
        
        Args:
            experience_level: junior, mid, senior, lead
            skills: List of required skills to match
            category: coding, conceptual, system_design, problem_solving
            difficulty: easy, medium, hard
        
        Returns:
            Best matching question or None
        """
        if not self.question_bank:
            return None
        
        skills = skills or []
        candidates = []
        
        for q in self.question_bank:
            score = 0
            
            # Match experience level
            q_levels = q.get("experience_levels", [])
            if experience_level in q_levels:
                score += 30
            elif experience_level == "mid" and "junior" in q_levels:
                score += 10  # Acceptable fallback
            elif experience_level == "senior" and "mid" in q_levels:
                score += 10
            
            # Match category
            if category and q.get("category") == category:
                score += 25
            
            # Match difficulty
            if difficulty and q.get("difficulty") == difficulty:
                score += 20
            elif not difficulty:
                # Default difficulty preference by level
                if experience_level == "junior" and q.get("difficulty") == "easy":
                    score += 15
                elif experience_level == "mid" and q.get("difficulty") == "medium":
                    score += 15
                elif experience_level in ["senior", "lead"] and q.get("difficulty") in ["medium", "hard"]:
                    score += 15
            
            # Match skills
            q_skills = [s.lower() for s in q.get("skills", [])]
            for skill in skills:
                if skill.lower() in q_skills:
                    score += 10
            
            # Avoid already asked questions
            if q["id"] in self.questions_asked:
                score -= 100
            
            if score > 0:
                candidates.append((score, q))
        
        if not candidates:
            # Return any available question
            available = [q for q in self.question_bank if q["id"] not in self.questions_asked]
            return random.choice(available) if available else None
        
        # Sort by score descending and return best match
        candidates.sort(key=lambda x: x[0], reverse=True)
        
        # Add some randomness among top candidates
        top_candidates = [c for c in candidates if c[0] >= candidates[0][0] - 10]
        selected = random.choice(top_candidates)[1]
        
        return selected
    
    def select_by_categories(
        self,
        enabled_categories: Dict[str, Dict],
        experience_level: str = "mid",
        context: Dict = None
    ) -> Optional[Dict]:
        """
        Select a question filtered by enabled categories.
        
        Args:
            enabled_categories: Dict like {"coding": {"enabled": True, "count": 3}, ...}
            experience_level: Target experience level
            context: Interview context with round summaries
        
        Returns:
            Selected question or None
        """
        context = context or {}
        
        # Get categories with remaining quota
        available_categories = []
        for cat_name, cat_config in enabled_categories.items():
            if cat_config.get("enabled", False) and cat_config.get("count", 0) > 0:
                available_categories.append(cat_name)
        
        if not available_categories:
            return None
        
        # Filter questions by enabled categories
        filtered_questions = [
            q for q in self.question_bank
            if q.get("category") in available_categories
            and q["id"] not in self.questions_asked
            and experience_level in q.get("experience_levels", ["mid"])
        ]
        
        if not filtered_questions:
            # Fallback: any question in enabled categories
            filtered_questions = [
                q for q in self.question_bank
                if q.get("category") in available_categories
                and q["id"] not in self.questions_asked
            ]
        
        if not filtered_questions:
            return None
        
        # Prefer questions from uncovered topics
        topics_covered = set()
        for summary in context.get("round_summaries", []):
            if "topic" in summary:
                topics_covered.add(summary["topic"])
        
        uncovered = [q for q in filtered_questions if q.get("topic") not in topics_covered]
        
        if uncovered:
            selected = random.choice(uncovered)
        else:
            selected = random.choice(filtered_questions)
        
        self.questions_asked.append(selected["id"])
        return selected





