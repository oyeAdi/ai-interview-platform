"""Breadth-focused strategy - explores related topics"""
from backend.strategies.base_strategy import BaseStrategy
from typing import Dict

class BreadthFocusedStrategy(BaseStrategy):
    """Strategy that focuses on exploring related topics"""
    
    def get_strategy_id(self) -> str:
        return "breadth_focused"
    
    def get_strategy_name(self) -> str:
        return "BreadthFocusedStrategy"
    
    def get_default_parameters(self) -> Dict:
        return {
            "related_topic_weight": 0.5,
            "temperature": 0.8,
            "max_tokens": 150
        }
    
    def get_followup_guidance(
        self,
        question: Dict,
        response: str,
        evaluation: Dict,
        context: Dict
    ) -> Dict:
        """Provide guidance for breadth-focused follow-up"""
        scores = evaluation.get("deterministic_scores", {})
        overall_score = evaluation.get("overall_score", 0)
        
        # Get current topic and related topics
        current_topic = question.get("topic", "")
        context_topics = context.get("interview_context", {}).get("overall_metrics", {}).get("topics_covered", [])
        
        # Determine focus - provide intent, not instructions
        if overall_score >= 80:
            focus = "The candidate should explain how this concept relates to other Python features like list comprehensions, generators, or context managers. Connections to related concepts should be explored."
        else:
            focus = "The candidate should discuss a related Python concept that connects to the current topic, such as list iteration, set operations, or dictionary comprehensions. Broader understanding should be assessed."
        
        return {
            "reason": f"Response shows adequate understanding (score: {overall_score}). Exploring related topics to assess breadth of knowledge.",
            "focus_areas": ["related concepts", "different contexts", "broader applications"],
            "approach": "Ask about a related topic or concept that connects to the current answer",
            "tone": "exploratory",
            "strategy_guidance": focus
        }

