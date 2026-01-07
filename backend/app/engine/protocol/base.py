from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field

class InferenceOutput(BaseModel):
    """
    Standardized output for all LLM interactions within the swarm.
    Ensures that 'thought' is always captured for transparency.
    """
    thought: str = Field(..., description="The internal reasoning or 'Chain of Thought' of the agent.")
    action_type: str = Field(..., description="The primary action the agent is taking (e.g., 'ask', 'evaluate', 'conclude').")
    action_data: Any = Field(..., description="Payload associated with the action.")
    raw_response: Optional[str] = Field(None, description="The unmodified text from the LLM provider.")

class AgentContext(BaseModel):
    """
    Execution context provided to agents, abstracting away database/external state.
    """
    session_id: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    history: List[Dict[str, Any]] = Field(default_factory=list)

class BaseAgent(ABC):
    """
    Rigorous base class for all Swarm 2.0 agents.
    Enforces the 'Think-before-Act' protocol.
    """
    
    def __init__(self, name: str, intelligence_provider: Any):
        self.name = name
        self.intelligence_provider = intelligence_provider

    @abstractmethod
    async def process(self, context: AgentContext) -> InferenceOutput:
        """
        Main execution hook. Agents must process the context and return a structured InferenceOutput.
        """
        pass

    def _log_thought(self, session_id: str, thought: str):
        """Internal helper to emit thought events to the pulse monitor."""
        print(f"[{self.name}] THOUGHT: {thought}")
        # Integration with EventStore and Logger would happen here
