"""Parameter tuning for strategies based on performance"""
from typing import Dict, Optional
from backend.strategies.base_strategy import BaseStrategy

class ParameterTuner:
    """Tunes strategy parameters based on performance"""
    
    @staticmethod
    def tune_parameters(
        strategy: BaseStrategy,
        performance_metrics: Dict,
        previous_params: Dict
    ) -> Dict:
        """
        Tune strategy parameters based on performance
        Returns updated parameters
        """
        current_params = strategy.get_parameters().copy()
        
        # Get performance indicators
        score_improvement = performance_metrics.get("response_quality_improvement", 0)
        engagement = performance_metrics.get("engagement_score", 0)
        
        # Adjust parameters based on performance
        if score_improvement > 0:
            # Positive improvement - maintain or slightly increase weights
            if "completeness_weight" in current_params:
                current_params["completeness_weight"] = min(
                    0.5,
                    current_params["completeness_weight"] * 1.05
                )
        elif score_improvement < 0:
            # Negative improvement - decrease weights or adjust thresholds
            if "completeness_weight" in current_params:
                current_params["completeness_weight"] = max(
                    0.1,
                    current_params["completeness_weight"] * 0.95
                )
        
        # Adjust temperature based on engagement
        if "temperature" in current_params:
            if engagement < 70:
                # Low engagement - try different temperature
                current_params["temperature"] = min(
                    1.0,
                    current_params["temperature"] + 0.1
                )
            elif engagement > 90:
                # High engagement - maintain current temperature
                pass
        
        return current_params


