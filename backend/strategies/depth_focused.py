"""Depth-focused strategy - deepens understanding of same topic"""
from backend.strategies.base_strategy import BaseStrategy
from typing import Dict

class DepthFocusedStrategy(BaseStrategy):
    """Strategy that focuses on deepening understanding"""
    
    def get_strategy_id(self) -> str:
        return "depth_focused"
    
    def get_strategy_name(self) -> str:
        return "DepthFocusedStrategy"
    
    def get_default_parameters(self) -> Dict:
        return {
            "depth_threshold": 70,
            "completeness_weight": 0.3,
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
        """Provide guidance for depth-focused follow-up"""
        scores = evaluation.get("deterministic_scores", {})
        depth_score = scores.get("depth", 0)
        completeness_score = scores.get("completeness", 0)
        
        # Identify gaps
        gaps = []
        if depth_score < self.parameters.get("depth_threshold", 70):
            gaps.append("needs deeper explanation")
        if completeness_score < 70:
            gaps.append("missing key concepts")
        
        # Determine focus - provide intent, not instructions
        if depth_score < 60:
            focus = "The candidate needs to provide a specific real-world example or practical application. They should give concrete code examples."
        elif completeness_score < 70:
            focus = "The candidate should discuss edge cases, error handling, or scenarios where this approach might fail. Missing aspects need to be covered."
        else:
            focus = "The candidate should explore advanced scenarios, performance implications, or connections to more complex Python patterns. Deeper understanding is needed."
        
        return {
            "reason": f"Response shows good understanding but could benefit from deeper exploration. Depth: {depth_score}, Completeness: {completeness_score}",
            "focus_areas": gaps if gaps else ["advanced applications"],
            "approach": "Ask a follow-up that builds on the candidate's answer to explore deeper understanding",
            "tone": "encouraging",
            "strategy_guidance": focus
        }

