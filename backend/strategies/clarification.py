"""Clarification strategy - asks for details on unclear parts"""
from backend.strategies.base_strategy import BaseStrategy
from typing import Dict

class ClarificationStrategy(BaseStrategy):
    """Strategy that focuses on clarifying unclear aspects"""
    
    def get_strategy_id(self) -> str:
        return "clarification"
    
    def get_strategy_name(self) -> str:
        return "ClarificationStrategy"
    
    def get_default_parameters(self) -> Dict:
        return {
            "completeness_threshold": 70,
            "clarity_threshold": 75,
            "temperature": 0.6,
            "max_tokens": 120
        }
    
    def get_followup_guidance(
        self,
        question: Dict,
        response: str,
        evaluation: Dict,
        context: Dict
    ) -> Dict:
        """Provide guidance for clarification follow-up"""
        scores = evaluation.get("deterministic_scores", {})
        completeness = scores.get("completeness", 0)
        clarity = scores.get("clarity", 0)
        details = evaluation.get("evaluation_details", {})
        
        # Identify what needs clarification
        missing_keywords = details.get("keywords_missing", [])
        gaps = []
        
        if completeness < self.parameters.get("completeness_threshold", 70):
            gaps.append("incomplete explanation")
        if clarity < self.parameters.get("clarity_threshold", 75):
            gaps.append("unclear explanation")
        if missing_keywords:
            gaps.append(f"missing concepts: {', '.join(missing_keywords[:3])}")
        
        # Determine focus - provide intent, not instructions
        if missing_keywords:
            focus = f"The candidate should explain what {missing_keywords[0]} means in this context, or how {missing_keywords[0]} relates to what they just described. This concept needs clarification."
        elif clarity < 70:
            focus = "The candidate should rephrase or explain a specific part of their answer more clearly. Unclear aspects need clarification."
        else:
            focus = "The candidate should provide more details on a specific aspect that was mentioned but not fully explained. Concrete examples or elaboration are needed."
        
        return {
            "reason": f"Response needs clarification. Completeness: {completeness}, Clarity: {clarity}",
            "focus_areas": gaps,
            "approach": "Ask a direct question to clarify unclear or missing aspects",
            "tone": "supportive",
            "strategy_guidance": focus
        }

