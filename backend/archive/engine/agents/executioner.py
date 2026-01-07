"""
Executioner Agent - Swarm 2.0 (Consolidated)
The primary interaction engine of the swarm.
Responsible for:
1. Live dialogue with the candidate
2. Question delivery and follow-ups
3. Pre-interview candidate engagement (Emails)
"""

from engine.protocol.base import BaseAgent, AgentContext, InferenceOutput
from engine.intelligence.dispatch import get_intelligence_dispatch
from typing import Dict, Any, List, Optional

class ExecutionerAgent(BaseAgent):
    """
    The Executioner is the 'Voice' of the swarm.
    """
    
    def __init__(self):
        super().__init__(
            name="Executioner",
            intelligence_provider=get_intelligence_dispatch()
        )

    async def process(self, context: AgentContext) -> InferenceOutput:
        """
        Main execution hook. Can perform 'speak', 'generate_invitation', 'conclude_session'.
        """
        task = context.metadata.get("executioner_task", "speak")
        
        if task == "generate_invitation":
            prompt = self._build_invitation_prompt(context)
            prompt += "\n\nCRITICAL: Respond in JSON: " + '{"thought": "...", "action_type": "generate_email", "action_data": {"subject": "...", "body": "..."}}'
        else:
            prompt = self._build_dialogue_prompt(context)
            prompt += "\n\nCRITICAL: Respond in JSON: " + '{"thought": "...", "action_type": "speak", "action_data": {"text": "...", "transition": "...", "can_advance": true}}'
            
        output = await self.intelligence_provider.generate_structured(prompt)
        self._log_thought(context.session_id, output.thought)
        return output

    def _build_invitation_prompt(self, context: AgentContext) -> str:
        candidate = context.metadata.get("candidate_name", "Candidate")
        role = context.metadata.get("role_title", "Software Engineer")
        return f"Invite {candidate} to a technical interview for {role}."

    def _build_dialogue_prompt(self, context: AgentContext) -> str:
        history = context.history
        phase = context.metadata.get("current_phase", "General Tech")
        return f"Talk to the candidate. Phase: {phase}. History: {history[-5:]}"

# Singleton
_executioner = None

def get_executioner_agent() -> ExecutionerAgent:
    global _executioner
    if _executioner is None:
        _executioner = ExecutionerAgent()
    return _executioner
