from ..protocol.base import BaseAgent, AgentContext, InferenceOutput
from ...services.llm import get_intelligence_dispatch

class WatcherAgent(BaseAgent):
    """
    The Watcher monitors the infrastructure and telemetry of the swarm.
    """
    
    def __init__(self):
        super().__init__(
            name="Watcher",
            intelligence_provider=get_intelligence_dispatch()
        )

    async def process(self, context: AgentContext) -> InferenceOutput:
        """
        Monitors the telemetry of the session for health signals.
        """
        prompt = self._build_health_check_prompt(context)
        
        # Request structured health report
        prompt += "\n\nCRITICAL: You must respond in the following JSON format:\n"
        prompt += '{"thought": "Your reasoning about the system health", "action_type": "health_check", "action_data": {"confidence_score": 0.0-1.0, "system_status": "Healthy/Degraded/Critical", "latency_score": 0-100, "token_alert": true/false, "recommendation": "..."}}'
        
        output = await self.intelligence_provider.generate_structured(prompt)
        self._log_thought(context.session_id, output.thought)
        return output

    def _build_health_check_prompt(self, context: AgentContext) -> str:
        telemetry = context.metadata.get("telemetry", {})
        
        return f"""You are the Watcher Agent for a high-performance AI interview swarm.
Your goal is to ensure the platform remains responsive and reliable.

CURRENT TELEMETRY:
{telemetry}

MONITORING GOALS:
1. LATENCY: Are LLM responses taking too long (> 10s)?
2. QUOTA: Are we approaching rate limits?
3. ERRORS: Are there any recurring exceptions in the logs?
"""

# Singleton
_watcher = None

def get_watcher_agent() -> WatcherAgent:
    global _watcher
    if _watcher is None:
        _watcher = WatcherAgent()
    return _watcher
