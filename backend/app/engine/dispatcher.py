from typing import Dict, List, Any, Optional, Type
from .protocol.base import BaseAgent, AgentContext, InferenceOutput
import asyncio
import logging

logger = logging.getLogger(__name__)

class SwarmDispatcher:
    """
    Central hub for the 11-agent swarm.
    Handles agent registration, message routing, and swarm-wide state.
    """
    
    def __init__(self):
        self.agents: Dict[str, BaseAgent] = {}
        self.session_contexts: Dict[str, AgentContext] = {}

    def register_agent(self, agent: BaseAgent):
        """Register an agent with the dispatcher."""
        self.agents[agent.name.lower()] = agent
        logger.info(f"Agent registered: {agent.name}")

    async def dispatch(self, agent_name: str, context: AgentContext) -> InferenceOutput:
        """
        Dispatch a request to a specific agent.
        """
        agent_name = agent_name.lower()
        if agent_name not in self.agents:
            raise ValueError(f"Agent '{agent_name}' not found in swarm.")
        
        agent = self.agents[agent_name]
        logger.info(f"Dispatching to agent: {agent.name} for session: {context.session_id}")
        
        # Execute agent process
        result = await agent.process(context)
        
        # Log thought for transparency
        print(f"[{agent.name}] THOUGHT: {result.thought}")
        
        return result

    async def broadcast(self, context: AgentContext) -> List[InferenceOutput]:
        """
        Broadcast a context update to all registered agents (e.g., for monitoring).
        """
        tasks = [agent.process(context) for agent in self.agents.values()]
        return await asyncio.gather(*tasks)

# Global dispatcher instance
_dispatcher = SwarmDispatcher()

def get_dispatcher() -> SwarmDispatcher:
    return _dispatcher
