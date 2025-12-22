"""
Executioner Agent - Swarm 2.0
Handles live dialogue and 7-phase flow.
Restored original naming as per UI.
"""

from engine.protocol.base import BaseAgent, AgentContext, InferenceOutput
from engine.intelligence.dispatch import get_intelligence_dispatch

class ExecutionerAgent(BaseAgent):
    """
    The Executioner manages the 'Human Touch' of the interview.
    """
    
    def __init__(self):
        super().__init__(
            name="Executioner",
            intelligence_provider=get_intelligence_dispatch()
        )

    async def process(self, context: AgentContext) -> InferenceOutput:
        """
        Manages dialogue or generates a pre-interview invitation email.
        """
        target_action = context.metadata.get("target_action", "speak")
        
        if target_action == "generate_invitation_email":
            prompt = self._build_email_prompt(context)
            prompt += "\n\nCRITICAL: Respond in JSON format: " + '{"thought": "...", "action_type": "generate_email", "action_data": {"subject": "...", "body": "..."}}'
        else:
            current_phase = context.metadata.get("current_phase", "greeting")
            prompt = self._build_dialogue_prompt(current_phase, context)
            prompt += "\n\nCRITICAL: Respond in JSON format: " + '{"thought": "...", "action_type": "speak", "action_data": {"text": "...", "phase_transition": "...", "strategy": "..."}}'
        
        output = await self.intelligence_provider.generate_structured(prompt)
        self._log_thought(context.session_id, output.thought)
        return output

    def _build_email_prompt(self, context: AgentContext) -> str:
        candidate_name = context.metadata.get("candidate_name", "Candidate")
        position_title = context.metadata.get("position_title", "Software Engineer")
        return f"Draft a professional invitation email for {candidate_name} for the position of {position_title}."

    def _build_dialogue_prompt(self, phase: str, context: AgentContext) -> str:
        return f"You are the Executioner Agent...\nPhase: {phase}"

# Singleton
_executioner = None

def get_executioner_agent() -> ExecutionerAgent:
    global _executioner
    if _executioner is None:
        _executioner = ExecutionerAgent()
    return _executioner
