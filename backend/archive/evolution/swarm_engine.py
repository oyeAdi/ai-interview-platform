"""SWARM evolutionary engine for strategy evolution"""
from typing import Dict, List
from evolution.parameter_tuner import ParameterTuner
from evolution.performance_analyzer import PerformanceAnalyzer
from strategies.strategy_factory import StrategyFactory

class SwarmEngine:
    """SWARM evolutionary engine for continuous strategy adaptation"""
    
    def __init__(self):
        self.parameter_tuner = ParameterTuner()
        self.performance_analyzer = PerformanceAnalyzer()
        self.strategy_factory = StrategyFactory()
    
    def evolve_strategies(self, session_id: str, context: Dict) -> Dict:
        """
        Evolve strategies based on performance
        Updates strategy weights and parameters
        """
        # Analyze performance
        performance = self.performance_analyzer.analyze_strategy_performance(session_id)
        
        # Get strategy context
        strategy_context = context.get("interview_context", {}).get("strategy_context", {})
        available_strategies = strategy_context.get("available_strategies", {})
        
        # Update weights based on performance
        total_performance = sum(
            perf.get("average_score_improvement", 0) * perf.get("usage_count", 0)
            for perf in performance.values()
        )
        
        updated_strategies = {}
        for strategy_id, perf_data in performance.items():
            if strategy_id in available_strategies:
                # Calculate new weight based on performance
                performance_score = perf_data.get("average_score_improvement", 0)
                usage_count = perf_data.get("usage_count", 0)
                
                if total_performance > 0:
                    weight = (performance_score * usage_count) / total_performance
                else:
                    weight = 0.25  # Default equal weight
                
                updated_strategies[strategy_id] = {
                    "weight": weight,
                    "last_performance": performance_score,
                    "parameters": available_strategies[strategy_id].get("parameters", {})
                }
        
        return updated_strategies






