"""
Evaluator Agent - Swarm 2.0 (Consolidated)
The judge and analyst of the swarm. Combines the functions of the legacy Evaluator and Analyst.
Responsible for:
1. Real-time response scoring
2. ATS Scoring (Resume matching)
3. Post-interview synthesis and reporting
"""

from engine.protocol.base import BaseAgent, AgentContext, InferenceOutput
from engine.intelligence.dispatch import get_intelligence_dispatch
from typing import Dict, Any, List, Optional

class EvaluatorAgent(BaseAgent):
    """
    The Evaluator scoring candidate responses and analyzing overall performance.
    """
    
    def __init__(self):
        super().__init__(
            name="Evaluator",
            intelligence_provider=get_intelligence_dispatch()
        )

    async def process(self, context: AgentContext) -> InferenceOutput:
        """
        Main execution hook. Can perform 'evaluate_response', 'calculate_ats', or 'generate_report'.
        """
        task = context.metadata.get("evaluator_task", "evaluate_response")
        
        if task == "calculate_ats":
            prompt = self._build_ats_prompt(context)
            prompt += "\n\nCRITICAL: Respond in JSON format: " + '{"thought": "...", "action_type": "ats_score", "action_data": {"score": 0-100, "reasoning": "...", "fit_category": "Strong/Potential/Weak"}}'
        elif task == "generate_report":
            prompt = self._build_synthesis_prompt(context)
            prompt += "\n\nCRITICAL: Respond in JSON format: " + '{"thought": "...", "action_type": "generate_report", "action_data": {"hiring_recommendation": "...", "key_strengths": [...], "critical_gaps": [...], "overall_score": 0-100}}'
        else:
            prompt = self._build_evaluation_prompt(context)
            prompt += "\n\nCRITICAL: Respond in JSON format: " + '{"thought": "...", "action_type": "evaluate", "action_data": {"accuracy": 0-100, "completeness": 0-100, "depth": 0-100, "overall": 0-100, "summary": "..."}}'
        
        output = await self.intelligence_provider.generate_structured(prompt)
        self._log_thought(context.session_id, output.thought)
        return output

    def _build_evaluation_prompt(self, context: AgentContext) -> str:
        last_question = context.metadata.get("last_question", "")
        last_answer = context.metadata.get("last_answer", "")
        return f"You are the Evaluator Agent. Score the candidate's last answer.\nQ: {last_question}\nA: {last_answer}"

    def _build_ats_prompt(self, context: AgentContext) -> str:
        resume = context.metadata.get("resume_text", "")
        jd = context.metadata.get("jd_text", "")
        return f"Compare the JD and Resume. Calculate a match score.\nJD: {jd}\nResume: {resume}"

    def _build_synthesis_prompt(self, context: AgentContext) -> str:
        history = context.history
        return f"You are the Evaluator Agent. Synthesize the entire interview and provide a final report.\nHistory: {history}"

# Singleton
_evaluator = None

def get_evaluator_agent() -> EvaluatorAgent:
    global _evaluator
    if _evaluator is None:
        _evaluator = EvaluatorAgent()
    return _evaluator
