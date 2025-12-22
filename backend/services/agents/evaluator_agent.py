"""
Evaluator Agent - Generation Swarm
Responsible for real-time scoring of candidate responses.
Provides Accuracy, Completeness, and Depth metrics.
"""

from typing import Dict, List, Optional, Any
from llm.gemini_client import GeminiClient
from prompts.prompt_service import get_prompt_service

class EvaluatorAgent:
    """
    The Evaluator Agent scores candidate responses in real-time.
    Its output is used by the Executioner to determine follow-up strategies.
    """
    
    def __init__(self):
        self.gemini_client = GeminiClient()
        self.prompt_service = get_prompt_service()
        
    def score_response(
        self,
        question: str,
        answer: str,
        experience_level: str = "mid",
        expected_keywords: List[str] = []
    ) -> Dict:
        """
        Scores a candidate response across multiple dimensions.
        """
        # 1. Render prompt
        render_result = self.prompt_service.render(
            "response_evaluation",
            variables={
                "question": question,
                "answer": answer,
                "expected_keywords": ", ".join(expected_keywords) if expected_keywords else "None explicitly defined",
                "experience_level": experience_level
            }
        )
        
        if not render_result:
            return self._get_fallback_scores()
            
        # 2. Generate with LLM
        response = self.gemini_client.model.generate_content(
            render_result["rendered_prompt"],
            generation_config=render_result["generation_config"].to_gemini_config()
        )
        
        raw_text = response.text.strip()
        
        # 3. Parse custom pseudo-key-value format from template
        parsed_scores = self._parse_evaluation_output(raw_text)
        
        return parsed_scores

    def _parse_evaluation_output(self, text: str) -> Dict:
        """Parses the structured text output from the LLM into a dictionary."""
        lines = text.split("\n")
        scores = {
            "accuracy": 0,
            "completeness": 0,
            "depth": 0,
            "clarity": 0,
            "overall": 0,
            "summary": "No summary provided."
        }
        
        for line in lines:
            if ":" not in line:
                continue
                
            key, val = line.split(":", 1)
            key = key.strip().lower()
            val = val.strip()
            
            if key == "accuracy":
                scores["accuracy"] = self._extract_score(val)
            elif key == "completeness":
                scores["completeness"] = self._extract_score(val)
            elif key == "depth":
                scores["depth"] = self._extract_score(val)
            elif key == "clarity":
                scores["clarity"] = self._extract_score(val)
            elif key == "overall":
                scores["overall"] = self._extract_score(val)
            elif key == "summary":
                scores["summary"] = val
                
        return scores

    def _extract_score(self, text: str) -> int:
        """Extracts a numeric score from strings like '85' or '85/100' or '[85]'."""
        import re
        match = re.search(r"(\d+)", text)
        if match:
            return min(100, max(0, int(match.group(1))))
        return 0

    def _get_fallback_scores(self) -> Dict:
        """Fallback scores if evaluation fails."""
        return {
            "accuracy": 50,
            "completeness": 50,
            "depth": 50,
            "clarity": 50,
            "overall": 50,
            "summary": "Evaluation failed. Using median fallback."
        }

# Singleton
_evaluator = None

def get_evaluator_agent() -> EvaluatorAgent:
    global _evaluator
    if _evaluator is None:
        _evaluator = EvaluatorAgent()
    return _evaluator
