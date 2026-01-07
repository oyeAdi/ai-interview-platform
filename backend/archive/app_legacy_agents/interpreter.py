from ..protocol.base import BaseAgent, AgentContext, InferenceOutput
from ...services.llm import get_intelligence_dispatch

class InterpreterAgent(BaseAgent):
    """
    The Interpreter decodes complex candidate inputs into machine-readable technical signals.
    """
    
    def __init__(self):
        super().__init__(
            name="Interpreter",
            intelligence_provider=get_intelligence_dispatch()
        )

    async def process(self, context: AgentContext) -> InferenceOutput:
        """
        Decodes the provided input and enriches the context with semantic technical tags.
        """
        prompt = self._build_decoding_prompt(context)
        
        # Request structured semantic decoding
        prompt += "\n\nCRITICAL: You must respond in the following JSON format:\n"
        prompt += '{"thought": "Your reasoning about the technical semantics", "action_type": "decode_input", "action_data": {"confidence_score": 0.0-1.0, "technical_terms": [...], "concepts_identified": [...], "complexity_level": "Basic/Intermediate/Advanced", "is_code": true/false, "decoded_signal": "..."}}'
        
        output = await self.intelligence_provider.generate_structured(prompt)
        self._log_thought(context.session_id, output.thought)
        return output

    def _build_decoding_prompt(self, context: AgentContext) -> str:
        raw_input = context.metadata.get("raw_input", "No input found.")
        
        return f"""You are the Interpreter Agent for a sophisticated technical interview system.
Your goal is to extract the deepest possible technical signal from the candidate's input.

RAW INPUT TO DECODE:
{raw_input}

DECODING GOALS:
1. SEMANTIC EXTRACTION: What are the core technical concepts being discussed?
2. COMPLEXITY ANALYTICS: What is the true proficiency level demonstrated?
3. ABSTRACTION LEVEL: Are they talking about implementation details or architectural design?
"""

# Singleton
_interpreter = None

def get_interpreter_agent() -> InterpreterAgent:
    global _interpreter
    if _interpreter is None:
        _interpreter = InterpreterAgent()
    return _interpreter
