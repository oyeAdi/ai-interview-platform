"""
Analyst Agent - Swarm 2.0
Post-interview synthesis and reporting.
Restored original naming as per UI.
"""

from engine.protocol.base import BaseAgent, AgentContext, InferenceOutput
from engine.intelligence.dispatch import get_intelligence_dispatch

class AnalystAgent(BaseAgent):
    """
    The Analyst synthesizes the entire session.
    """
    
    def __init__(self):
        super().__init__(
            name="Analyst",
            intelligence_provider=get_intelligence_dispatch()
        )

    async def process(self, context: AgentContext) -> InferenceOutput:
        """
        Synthesizes the entire interview history or performs pre-interview ATS scoring.
        """
        action_type = context.metadata.get("target_action", "generate_report")
        
        if action_type == "calculate_ats_score":
            prompt = self._build_ats_prompt(context)
            prompt += "\n\nCRITICAL: Respond in JSON format: " + '{"thought": "...", "action_type": "ats_score", "action_data": {"score": 0-100, "reasoning": "...", "fit_category": "Strong/Potential/Weak"}}'
        else:
            prompt = self._build_synthesis_prompt(context)
            prompt += "\n\nCRITICAL: Respond in JSON format: " + '{"thought": "...", "action_type": "generate_report", "action_data": {"hiring_recommendation": "...", "key_strengths": [...], "critical_gaps": [...]}}'
        
        output = await self.intelligence_provider.generate_structured(prompt)
        self._log_thought(context.session_id, output.thought)
        return output

    def _build_ats_prompt(self, context: AgentContext) -> str:
        resume = context.metadata.get("resume_text", "")
        jd = context.metadata.get("jd_text", "")
        return f"Compare the JD and Resume. Calculate a match score (0-100).\nJD: {jd}\nResume: {resume}"

    def _build_synthesis_prompt(self, context: AgentContext) -> str:
        return "You are the Analyst Agent..."

# Singleton
_analyst = None

def get_analyst_agent() -> AnalystAgent:
    global _analyst
    if _analyst is None:
        _analyst = AnalystAgent()
    return _analyst
