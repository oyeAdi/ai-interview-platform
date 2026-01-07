from ..protocol.base import BaseAgent, AgentContext, InferenceOutput
from ...services.llm import get_intelligence_dispatch
# Note: We'll use the existing Logger utility for now
from utils.logger import Logger

class LoggerAgent(BaseAgent):
    """
    The Logger monitors the interview stream and extracts structured insights.
    """
    
    def __init__(self):
        super().__init__(
            name="Logger",
            intelligence_provider=get_intelligence_dispatch()
        )
        self.logger_util = Logger()

    async def process(self, context: AgentContext) -> InferenceOutput:
        """
        Processes the current session context to extract learnings or audit the log.
        """
        action_type = context.metadata.get("target_action", "extract_insights")
        
        if action_type == "audit_session":
            prompt = self._build_audit_prompt(context)
            prompt += "\n\nCRITICAL: Respond in JSON format: " + '{"thought": "...", "action_type": "audit_complete", "action_data": {"integrity_score": 0-100, "missing_events": [...], "anomalies": [...]}}'
        else:
            prompt = self._build_insight_prompt(context)
            prompt += "\n\nCRITICAL: Respond in JSON format: " + '{"thought": "...", "action_type": "insight_extracted", "action_data": {"key_learnings": [...], "candidate_signals": [...], "confidence": 0.0-1.0}}'
        
        output = await self.intelligence_provider.generate_structured(prompt)
        self._log_thought(context.session_id, output.thought)
        return output

    def _build_audit_prompt(self, context: AgentContext) -> str:
        history = context.history
        return f"Audit the following interview history for logical consistency and event integrity:\n{history}"

    def _build_insight_prompt(self, context: AgentContext) -> str:
        history = context.history
        return f"Extract key candidate signals and technical learnings from this interview segment:\n{history}"

# Singleton
_logger_agent = None

def get_logger_agent() -> LoggerAgent:
    global _logger_agent
    if _logger_agent is None:
        _logger_agent = LoggerAgent()
    return _logger_agent
