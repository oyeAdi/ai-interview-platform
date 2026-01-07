"""
Architect Agent - Generation Swarm
Responsible for generating personalized, high-quality interview questions.
Integrates JD, Resume, and Learning patterns.
"""

from typing import Dict, List, Optional, Any
from llm.gemini_client import GeminiClient
from prompts.prompt_service import get_prompt_service
from services.learning_repository import get_learning_repository
from services.event_store import get_event_store

class ArchitectAgent:
    """
    The Architect Agent designs personalized questions for the candidate.
    It bridges the gap between static requirements and dynamic assessment.
    """
    
    def __init__(self):
        self.gemini_client = GeminiClient()
        self.prompt_service = get_prompt_service()
        self.learning_repo = get_learning_repository()
        self.event_store = get_event_store()
        
    def generate_initial_question(
        self, 
        session_id: str,
        jd_id: Optional[str],
        resume_text: str,
        required_skills: List[str],
        language: str = "general",
        experience_level: str = "mid",
        position_title: str = "Candidate"
    ) -> Dict:
        """
        Generates the first personalized question for an interview.
        """
        # 1. Fetch relevant patterns from Learning Repository
        patterns = self.learning_repo.get_high_confidence_learnings(
            category="question_generation",
            limit=5
        )
        
        # 2. Add patterns to variables for prompting if available
        learning_context = ""
        if patterns:
            learning_context = "\n\nLearned Patterns to follow:\n"
            for p in patterns[:3]:
                learning_context += f"- {p.get('pattern')}\n"
        
        # 3. Render prompt based on technicality
        is_coding = any(s.lower() in ["java", "python", "javascript", "coding", "software"] for s in required_skills)
        variant = "personalized_coding" if is_coding else "personalized"
        
        # Determine prompt template
        prompt_templates = {
            "personalized_coding": "first_question_personalized",
            "personalized": "first_question_personalized"
        }
        
        render_result = self.prompt_service.render(
            prompt_templates.get(variant, "first_question_personalized"),
            variables={
                "position_title": position_title,
                "experience_level": experience_level,
                "language": language,
                "resume_text": resume_text[:1500],
                "required_skills": ", ".join(required_skills),
                "seed_text": "Tell me about a complex project you worked on.", # Fallback seed
                "seed_topic": "Project Experience",
                "seed_category": "coding" if is_coding else "conceptual"
            },
            knob_overrides={
                "custom": {"learning_context": learning_context}
            }
        )
        
        if not render_result:
            return self._get_fallback_question(session_id, position_title)
            
        # 4. Generate with LLM
        response = self.gemini_client.model.generate_content(
            render_result["rendered_prompt"],
            generation_config=render_result["generation_config"].to_gemini_config()
        )
        
        question_text = response.text.strip()
        
        # 5. Clean up
        if question_text.startswith('"') and question_text.endswith('"'):
            question_text = question_text[1:-1]
            
        # 6. Create question object
        question_id = f"arch_{session_id[:8]}"
        question_data = {
            "id": question_id,
            "text": question_text,
            "type": "probing",
            "category": "personalization",
            "topic": "introduction",
            "difficulty": experience_level,
            "is_personalized": True,
            "agent": "Architect"
        }
        
        # 7. Emit Event
        self.event_store.append_event(
            session_id,
            "QuestionAsked",
            {
                "question_id": question_id,
                "question_text": question_text,
                "question_category": "personalization",
                "question_number": 1,
                "agent": "Architect",
                "thought_process": "Generated personalized intro based on JD/Resume and learned patterns."
            }
        )
        
        return question_data

    def _get_fallback_question(self, session_id: str, position_title: str) -> Dict:
        """Simple fallback if generation fails"""
        question_text = f"Welcome! To start with, could you walk me through your background and how it prepares you for this {position_title} role?"
        question_id = f"fallback_{session_id[:8]}"
        return {
            "id": question_id,
            "text": question_text,
            "type": "probing",
            "category": "intro",
            "topic": "experience",
            "difficulty": "mid",
            "is_personalized": False
        }

# Singleton
_architect = None

def get_architect_agent() -> ArchitectAgent:
    global _architect
    if _architect is None:
        _architect = ArchitectAgent()
    return _architect
