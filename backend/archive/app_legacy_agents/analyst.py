from ..protocol.base import BaseAgent, AgentContext, InferenceOutput
from ...services.llm import get_intelligence_dispatch

class AnalystAgent(BaseAgent):
    """
    The Analyst synthesizes the entire session or performs pre-interview analysis.
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
        
        if action_type == "calculate_ats_score" or action_type == "analyze_fit":
            prompt = self._build_deep_analysis_prompt(context)
            prompt += "\n\nCRITICAL: Respond in strictly valid JSON format: " + '{"thought": "...", "action_type": "analyze_fit", "action_data": {"score": 0-100, "confidence_score": 0-100, "key_skills_found": [...], "missing_critical_skills": [...], "experience_years": 0.0, "education_match": "Strong/Medium/Weak", "reasoning": "...", "fit_category": "Strong/Potential/Weak"}}'
        else:
            prompt = self._build_synthesis_prompt(context)
            prompt += "\n\nCRITICAL: Respond in strictly valid JSON format: " + '{"thought": "...", "action_type": "generate_report", "action_data": {"hiring_recommendation": "...", "key_strengths": [...], "critical_gaps": [...]}}'
        
        output = await self.intelligence_provider.generate_structured(prompt)
        self._log_thought(context.session_id, output.thought)
        return output

    def _build_deep_analysis_prompt(self, context: AgentContext) -> str:
        resume = context.metadata.get("resume_text", "")
        jd = context.metadata.get("jd_text", "")
        return f"""You are the Lead Analyst for an elite recruitment swarm.
Your goal is to perform a deep technical and fit analysis of the Candidate against the Job Description.

JOB DESCRIPTION:
{jd}

CANDIDATE RESUME:
{resume}

TASKS:
1. Calculate a base match score (0-100).
2. Assign a confidence score (0-100) based on how much data is available.
3. Extract confirmed skills and critically missing skills.
4. Assess education and experience alignment.
5. Provide a concise reasoning summary.
"""

    def _build_synthesis_prompt(self, context: AgentContext) -> str:
        # Simplified for now, will be expanded during full implementation
        return "You are the Analyst Agent. Synthesize the interview history."

# Singleton
_analyst = None

def get_analyst_agent() -> AnalystAgent:
    global _analyst
    if _analyst is None:
        _analyst = AnalystAgent()
    return _analyst
