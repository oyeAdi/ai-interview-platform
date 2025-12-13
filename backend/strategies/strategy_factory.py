"""Strategy factory for creating and selecting strategies"""
from typing import Dict, Optional, Tuple
from strategies.base_strategy import BaseStrategy
from strategies.depth_focused import DepthFocusedStrategy
from strategies.clarification import ClarificationStrategy
from strategies.breadth_focused import BreadthFocusedStrategy
from strategies.challenge import ChallengeStrategy
from config import Config

class StrategyFactory:
    """Factory for creating and selecting interview strategies"""
    
    def __init__(self):
        self.strategies = {
            "depth_focused": DepthFocusedStrategy,
            "clarification": ClarificationStrategy,
            "breadth_focused": BreadthFocusedStrategy,
            "challenge": ChallengeStrategy
        }
        self._last_selection_reason = ""
    
    def create_strategy(self, strategy_id: str, parameters: Optional[Dict] = None) -> BaseStrategy:
        """Create a strategy instance"""
        strategy_class = self.strategies.get(strategy_id)
        if not strategy_class:
            raise ValueError(f"Unknown strategy: {strategy_id}")
        return strategy_class(parameters)
    
    def get_last_selection_reason(self) -> str:
        """Get the reason for the last strategy selection"""
        return self._last_selection_reason
    
    def select_strategy(self, evaluation: Dict, context: Dict) -> BaseStrategy:
        """
        Context-aware strategy selection
        Analyzes response characteristics and selects appropriate strategy
        """
        scores = evaluation.get("deterministic_scores", {})
        overall_score = evaluation.get("overall_score", 0)
        completeness = scores.get("completeness", 0)
        depth = scores.get("depth", 0)
        
        # Get strategy context for performance weighting
        strategy_context = context.get("interview_context", {}).get("strategy_context", {})
        available_strategies = strategy_context.get("available_strategies", {})
        
        # Context-aware selection with reasoning
        if completeness < Config.COMPLETENESS_THRESHOLD:
            selected_id = "clarification"
            self._last_selection_reason = f"Response completeness ({completeness:.0f}%) is below threshold ({Config.COMPLETENESS_THRESHOLD}%). Need to clarify and get more details."
        elif depth < Config.DEPTH_THRESHOLD:
            selected_id = "depth_focused"
            self._last_selection_reason = f"Response depth ({depth:.0f}%) is below threshold ({Config.DEPTH_THRESHOLD}%). Need to explore the topic more deeply."
        elif overall_score > Config.HIGH_SCORE_THRESHOLD:
            selected_id = "challenge"
            self._last_selection_reason = f"Excellent response (score: {overall_score:.0f}/100). Challenging with advanced scenarios to test limits."
        else:
            selected_id = "breadth_focused"
            self._last_selection_reason = f"Good response (score: {overall_score:.0f}/100). Exploring related topics to assess broader knowledge."
        
        # Get strategy parameters from context if available
        strategy_info = available_strategies.get(selected_id, {})
        parameters = strategy_info.get("parameters", None)
        
        return self.create_strategy(selected_id, parameters)

