"""
Evaluator Agent - Swarm 2.0
Performs real-time scoring and analysis.
Restored original naming as per UI.
"""

from engine.protocol.base import BaseAgent, AgentContext, InferenceOutput
from engine.intelligence.dispatch import get_intelligence_dispatch

class EvaluatorAgent(BaseAgent):
    """
    The Evaluator scoring candidate responses.
    """
    
    def __init__(self):
        super().__init__(
            name="Evaluator",
            intelligence_provider=get_intelligence_dispatch()
        )

    async def process(self, context: AgentContext) -> InferenceOutput:
        prompt = self._build_analysis_prompt(context)
        prompt += "\n\nCRITICAL: Respond in JSON format: " + '{"thought": "...", "action_type": "evaluate", "action_data": {"accuracy": 0-100, "completeness": 0-100, "depth": 0-100, "overall": 0-100, "summary": "..."}}'
        
        output = await self.intelligence_provider.generate_structured(prompt)
        self._log_thought(context.session_id, output.thought)
        return output

    def _build_analysis_prompt(self, context: AgentContext) -> str:
        last_question = context.metadata.get("last_question", "")
        last_answer = context.metadata.get("last_answer", "")
        return f"You are the Evaluator Agent...\nQ: {last_question}\nA: {last_answer}"

# Singleton
_evaluator = None

def get_evaluator_agent() -> EvaluatorAgent:
    global _evaluator
    if _evaluator is None:
        _evaluator = EvaluatorAgent()
    return _evaluator
