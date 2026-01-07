"""
Monitor Agent - Swarm 2.0 (Consolidated)
The recorder and watcher of the swarm. Combines the functions of the legacy Watcher, Interpreter, and Logger.
Responsible for:
1. System Health & Telemetry (Watcher)
2. Semantic Decoding (Interpreter)
3. Audit & Insight Extraction (Logger)
"""

from engine.protocol.base import BaseAgent, AgentContext, InferenceOutput
from engine.intelligence.dispatch import get_intelligence_dispatch
from typing import Dict, Any, List, Optional

class MonitorAgent(BaseAgent):
    """
    The Monitor oversees system stability and extracts technical signals.
    """
    
    def __init__(self):
        super().__init__(
            name="Monitor",
            intelligence_provider=get_intelligence_dispatch()
        )

    async def process(self, context: AgentContext) -> InferenceOutput:
        """
        Main execution hook. Can perform 'health_check', 'decode_input', or 'audit_session'.
        """
        task = context.metadata.get("monitor_task", "decode_input")
        
        if task == "health_check":
            prompt = self._build_health_prompt(context)
            prompt += "\n\nCRITICAL: Respond in JSON: " + '{"thought": "...", "action_type": "health_check", "action_data": {"status": "Healthy/Degraded", "latency": 0}}'
        elif task == "audit_session":
            prompt = self._build_audit_prompt(context)
            prompt += "\n\nCRITICAL: Respond in JSON: " + '{"thought": "...", "action_type": "audit_complete", "action_data": {"integrity_score": 0-100}}'
        else:
            prompt = self._build_decode_prompt(context)
            prompt += "\n\nCRITICAL: Respond in JSON: " + '{"thought": "...", "action_type": "decode_input", "action_data": {"concepts": [...], "complexity": "Basic/Int/Adv"}}'
            
        output = await self.intelligence_provider.generate_structured(prompt)
        self._log_thought(context.session_id, output.thought)
        return output

    def _build_health_prompt(self, context: AgentContext) -> str:
        telemetry = context.metadata.get("telemetry", {})
        return f"Check system health based on telemetry: {telemetry}"

    def _build_audit_prompt(self, context: AgentContext) -> str:
        history = context.history
        return f"Audit the interview history: {history}"

    def _build_decode_prompt(self, context: AgentContext) -> str:
        raw_input = context.metadata.get("raw_input", "")
        return f"Decode the semantic meaning of this input: {raw_input}"

# Singleton
_monitor = None

def get_monitor_agent() -> MonitorAgent:
    global _monitor
    if _monitor is None:
        _monitor = MonitorAgent()
    return _monitor
