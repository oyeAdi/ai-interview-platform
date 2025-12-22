"""Base strategy interface"""
from abc import ABC, abstractmethod
from typing import Dict, Optional

class BaseStrategy(ABC):
    """Base class for all interview strategies"""
    
    def __init__(self, parameters: Optional[Dict] = None):
        self.parameters = parameters or self.get_default_parameters()
    
    @abstractmethod
    def get_strategy_id(self) -> str:
        """Return strategy identifier"""
        pass
    
    @abstractmethod
    def get_strategy_name(self) -> str:
        """Return strategy name"""
        pass
    
    @abstractmethod
    def get_followup_guidance(
        self,
        question: Dict,
        response: str,
        evaluation: Dict,
        context: Dict
    ) -> Dict:
        """
        Provide guidance for follow-up generation
        Returns dict with 'reason', 'focus_areas', 'approach'
        """
        pass
    
    def get_parameters(self) -> Dict:
        """Return current strategy parameters"""
        return self.parameters
    
    def update_parameters(self, new_params: Dict):
        """Update strategy parameters"""
        self.parameters.update(new_params)
    
    def get_default_parameters(self) -> Dict:
        """Return default parameters for this strategy"""
        return {
            "temperature": 0.7,
            "max_tokens": 150
        }










