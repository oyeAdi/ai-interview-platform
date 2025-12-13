"""Challenge strategy - tests understanding with harder questions"""
from strategies.base_strategy import BaseStrategy
from typing import Dict

class ChallengeStrategy(BaseStrategy):
    """Strategy that challenges with harder questions"""
    
    def get_strategy_id(self) -> str:
        return "challenge"
    
    def get_strategy_name(self) -> str:
        return "ChallengeStrategy"
    
    def get_default_parameters(self) -> Dict:
        return {
            "challenge_threshold": 90,
            "difficulty_increase": 1,
            "temperature": 0.7,
            "max_tokens": 150
        }
    
    def get_followup_guidance(
        self,
        question: Dict,
        response: str,
        evaluation: Dict,
        context: Dict
    ) -> Dict:
        """Provide guidance for challenge follow-up"""
        scores = evaluation.get("deterministic_scores", {})
        overall_score = evaluation.get("overall_score", 0)
        depth = scores.get("depth", 0)
        
        # Determine challenge level - provide intent, not instructions
        if overall_score >= 95:
            focus = "The candidate should address a specific edge case scenario, such as modifying a dictionary while iterating over it, or handling nested dictionaries. Advanced scenarios should be explored."
        elif depth >= 85:
            focus = "The candidate should discuss trade-offs: performance implications of this approach, limitations, or alternative ways to achieve the same result."
        else:
            focus = "The candidate should address a more complex scenario: applying this in a real-world application with large datasets, or walking through a more complex use case."
        
        return {
            "reason": f"Strong response (score: {overall_score}, depth: {depth}). Testing understanding with a more challenging question.",
            "focus_areas": ["edge cases", "advanced scenarios", "trade-offs", "limitations"],
            "approach": "Present a more challenging scenario or question that tests deeper understanding",
            "tone": "professional",
            "strategy_guidance": focus
        }

