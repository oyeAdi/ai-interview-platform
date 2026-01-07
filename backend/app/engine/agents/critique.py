"""
Critique Agent - Swarm 2.0 (Consolidated)
The coach and quality controller of the swarm. Derived from the legacy Critic.
Responsible for:
1. Output Quality Audit
2. Technical Accuracy Verification
3. Rapport & Tone Adjustment
"""

from ..protocol.base import BaseAgent, AgentContext, InferenceOutput
from ..intelligence.dispatch import get_intelligence_dispatch
from typing import Dict, Any, List, Optional

class CritiqueAgent(BaseAgent):
    """
    The Critique reviews other agents' outputs to ensure technical soundess and fairness.
    """
    
    def __init__(self):
        super().__init__(
            name="Critique",
            intelligence_provider=get_intelligence_dispatch()
        )

    async def process(self, context: AgentContext) -> InferenceOutput:
        """
        Audits a proposed action or provides session coaching.
        """
        prompt = self._build_critique_prompt(context)
        prompt += "\n\nCRITICAL: Respond in JSON: " + '{"thought": "...", "action_type": "quality_audit", "action_data": {"score": 0-100, "fix_required": true, "suggestion": "..."}}'
        
        output = await self.intelligence_provider.generate_structured(prompt)
        self._log_thought(context.session_id, output.thought)
        return output

    def _build_critique_prompt(self, context: AgentContext) -> str:
        proposed_action = context.metadata.get("proposed_action", "No action")
        subject = context.metadata.get("subject_agent", "Agent")
        return f"Audit this action by {subject}: {proposed_action}"

# Singleton
_critique = None

def get_critique_agent() -> CritiqueAgent:
    global _critique
    if _critique is None:
        _critique = CritiqueAgent()
    return _critique
