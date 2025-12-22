"""
Observer Agent - Swarm 2.0
The evolution of the Learning Observer.
Responsible for recursive pattern recognition and technical behavioral analysis.
"""

from engine.protocol.base import BaseAgent, AgentContext, InferenceOutput
from engine.intelligence.dispatch import get_intelligence_dispatch

class ObserverAgent(BaseAgent):
    """
    The Observer looks for patterns across multiple answers.
    It identifies consistent strengths or recurring technical contradictions.
    """
    
    def __init__(self):
        super().__init__(
            name="Observer",
            intelligence_provider=get_intelligence_dispatch()
        )

    async def process(self, context: AgentContext) -> InferenceOutput:
        """
        Analyzes the historical patterns of the session.
        """
        prompt = self._build_observation_prompt(context)
        
        # Request structured pattern analysis
        prompt += "\n\nCRITICAL: You must respond in the following JSON format:\n"
        prompt += '{"thought": "Your reasoning about historical patterns", "action_type": "emit_observation", "action_data": {"identified_patterns": [...], "contradictions": [...], "confidence_trend": "Improving/Declining/Stable", "behavioral_summary": "..."}}'
        
        output = await self.intelligence_provider.generate_structured(prompt)
        
        # Log the observer's insight
        self._log_thought(context.session_id, output.thought)
        
        return output

    def _build_observation_prompt(self, context: AgentContext) -> str:
        history = context.history
        
        return f"""You are the Observer Agent for a high-fidelity AI interview swarm.
Your goal is to find the 'hidden' signals in the candidate's technical behavior.

INTERVIEW HISTORY:
{history}

TASK:
1. Look for recurring technical themes (e.g., 'Consistently mentions scalability', 'Struggles with memory management models').
2. Identify any contradictions between an early claim and a later detailed implementation.
3. Assess the overall confidence trend of the candidate.
"""

# Singleton
_observer = None

def get_observer_agent() -> ObserverAgent:
    global _observer
    if _observer is None:
        _observer = ObserverAgent()
    return _observer
