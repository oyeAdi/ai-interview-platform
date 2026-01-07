from ..protocol.base import BaseAgent, AgentContext, InferenceOutput
from ...services.llm import get_intelligence_dispatch

class CriticAgent(BaseAgent):
    """
    The Critic reviews the work of other agents.
    It ensures that questions are technically sound and that evaluations are fair.
    """
    
    def __init__(self):
        super().__init__(
            name="Critic",
            intelligence_provider=get_intelligence_dispatch()
        )

    async def process(self, context: AgentContext) -> InferenceOutput:
        """
        Audits the proposed agent action for quality and alignment.
        """
        action_type = context.metadata.get("target_action", "audit_action")
        
        prompt = ""
        if action_type == "audit_quality":
            prompt = self._build_quality_audit_prompt(context)
            prompt += "\n\nCRITICAL: Respond in strictly valid JSON format: " + '{"thought": "...", "action_type": "quality_audit", "action_data": {"confidence_score": 0.0-1.0, "quality_score": 0-100, "technical_accuracy": "Low/Medium/High", "bias_detected": true/false, "critique": "...", "suggestions": "..."}}'
        else:
            prompt = self._build_audit_prompt(context)
            # Request structured quality audit
            prompt += "\n\nCRITICAL: You must respond in the following JSON format:\n"
            prompt += '{"thought": "Your reasoning about the output quality/bias", "action_type": "quality_audit", "action_data": {"confidence_score": 0.0-1.0, "quality_score": 0-100, "bias_detected": true/false, "technical_accuracy": "Low/Medium/High", "adjustment_required": true/false, "suggested_fix": "..."}}'
        
        output = await self.intelligence_provider.generate_structured(prompt)
        self._log_thought(context.session_id, output.thought)
        return output

    def _build_quality_audit_prompt(self, context: AgentContext) -> str:
        audit_target = context.metadata.get("audit_target", "unknown")
        target_data = context.metadata.get(audit_target, {})
        
        return f"""You are the Critic Agent. Your job is to strictly evaluate the quality of another agent's output.
TARGET AGENT: {audit_target}
OUTPUT DATA:
{target_data}

EVALUATION CRITERIA:
1. Is the analysis supported by the data provided?
2. Are the confidence scores realistic?
3. Is there any evidence of hallucination or bias?
4. Are the identified skills accurate?
"""

    def _build_audit_prompt(self, context: AgentContext) -> str:
        proposed_action = context.metadata.get("proposed_action", "No action found.")
        agent_name = context.metadata.get("subject_agent", "Unknown Agent")
        
        return f"""You are the Critic Agent for an elite AI interview swarm.
Your duty is to ensure the highest standards of technical integrity and fair evaluation.

PROPOSED ACTION BY {agent_name}:
{proposed_action}

AUDIT FOCUS:
1. TECHNICAL ACCURACY: Is the technical depth appropriate for the role?
2. NEUTRALITY: Does the question or evaluation have any inherent bias?
3. RAPPORT: Is the tone professional yet human?
"""

# Singleton
_critic = None

def get_critic_agent() -> CriticAgent:
    global _critic
    if _critic is None:
        _critic = CriticAgent()
    return _critic
