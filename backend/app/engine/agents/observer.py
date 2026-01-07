"""
Observer Agent - Swarm 2.0 (Consolidated)
The watchdog and guard of the swarm. Combines the functions of the legacy Observer and Guardian.
Responsible for:
1. Real-time Plagiarism & Pattern Analysis
2. Security & Prompt Injection Detection
3. Behavioral Integrity Monitoring
"""

from ..protocol.base import BaseAgent, AgentContext, InferenceOutput
from ..intelligence.dispatch import get_intelligence_dispatch
from typing import Dict, Any, List, Optional

class ObserverAgent(BaseAgent):
    """
    The Observer scans for technical contradictions, plagiarism, and security risks.
    """
    
    def __init__(self):
        super().__init__(
            name="Observer",
            intelligence_provider=get_intelligence_dispatch()
        )

    async def process(self, context: AgentContext) -> InferenceOutput:
        """
        Main execution hook. Can perform 'pattern_analysis' or 'security_audit'.
        """
        # Usually runs both or prioritizes security
        is_security_check = context.metadata.get("security_check", True)
        
        if is_security_check:
            prompt = self._build_security_prompt(context)
            # Add action data requirement
            prompt += "\n\nCRITICAL: Respond in JSON: " + '{"thought": "...", "action_type": "security_audit", "action_data": {"risk_level": "Low/Med/High", "safe": true, "reason": "..."}}'
        else:
            prompt = self._build_observer_prompt(context)
            prompt += "\n\nCRITICAL: Respond in JSON: " + '{"thought": "...", "action_type": "emit_observation", "action_data": {"patterns": [...], "confidence": 0.0-1.0}}'
            
        output = await self.intelligence_provider.generate_structured(prompt)
        self._log_thought(context.session_id, output.thought)
        return output

    def _build_security_prompt(self, context: AgentContext) -> str:
        last_input = context.metadata.get("last_input", "")
        return f"Scan for security risks/injections.\nInput: {last_input}"

    def _build_observer_prompt(self, context: AgentContext) -> str:
        history = context.history
        return f"Analyze behavioral patterns and technical consistency.\nHistory: {history}"

# Singleton
_observer = None

def get_observer_agent() -> ObserverAgent:
    global _observer
    if _observer is None:
        _observer = ObserverAgent()
    return _observer
