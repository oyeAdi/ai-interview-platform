"""
Architect Agent - Swarm 2.0
Designs the technical trajectory and question sequences.
Restored original naming as per UI.
"""

from engine.protocol.base import BaseAgent, AgentContext, InferenceOutput
from engine.intelligence.dispatch import get_intelligence_dispatch

class ArchitectAgent(BaseAgent):
    """
    The Architect designs the personalized trajectory of the interview.
    """
    
    def __init__(self):
        super().__init__(
            name="Architect",
            intelligence_provider=get_intelligence_dispatch()
        )

    async def process(self, context: AgentContext) -> InferenceOutput:
        """
        Designs the technical trajectory or generates a pre-interview configuration.
        """
        target_action = context.metadata.get("target_action", "design_trajectory")
        
        if target_action == "configure_interview":
            prompt = self._build_config_prompt(context)
            prompt += "\n\nCRITICAL: Respond in JSON format: " + '{"thought": "...", "action_type": "configure_interview", "action_data": {"required_skills": [...], "milestones": [...], "estimated_duration": 45, "focus_areas": [...]}}'
        else:
            prompt = self._build_design_prompt(context)
            prompt += "\n\nCRITICAL: Respond in JSON format: " + '{"thought": "...", "action_type": "design_trajectory", "action_data": {"questions": [...]}}'
        
        output = await self.intelligence_provider.generate_structured(prompt)
        self._log_thought(context.session_id, output.thought)
        return output

    def _build_config_prompt(self, context: AgentContext) -> str:
        jd = context.metadata.get("jd_text", "")
        return f"Analyze this JD and propose an interview configuration.\nJD:\n{jd}"

    def _build_design_prompt(self, context: AgentContext) -> str:
        resume = context.metadata.get("resume_text", "Unknown candidate")
        jd = context.metadata.get("jd_text", "Unknown role")
        return f"You are the Architect Agent...\nJD:\n{jd}\nResume:\n{resume}"

# Singleton
_architect = None

def get_architect_agent() -> ArchitectAgent:
    global _architect
    if _architect is None:
        _architect = ArchitectAgent()
    return _architect
