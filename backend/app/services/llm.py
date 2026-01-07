import json
import logging
from typing import Dict, Optional, Any
from ..engine.protocol.base import InferenceOutput
# We'll import the existing LLM router for now to avoid rewriting the entire LLM layer yet
from llm.llm_router import get_llm_router

logger = logging.getLogger(__name__)

class IntelligenceDispatch:
    """
    Abstractions over various LLM providers.
    Ensures all responses are parsed into the standardized InferenceOutput format.
    """
    
    def __init__(self):
        self.router = get_llm_router()

    async def generate_structured(self, prompt: str, generation_config: Optional[Dict] = None) -> InferenceOutput:
        """
        Generates content and attempts to parse it into a structured InferenceOutput.
        """
        try:
            response = self.router.generate_content(prompt, generation_config)
            raw_text = response.text.strip()
            
            # Try to parse as JSON
            json_start = raw_text.find("{")
            json_end = raw_text.rfind("}") + 1
            if json_start != -1 and json_end != 0:
                data = json.loads(raw_text[json_start:json_end])
                return InferenceOutput(
                    thought=data.get("thought", "Thought not explicitly extracted."),
                    action_type=data.get("action_type", "unknown"),
                    action_data=data.get("action_data", {}),
                    raw_response=raw_text
                )
        except Exception as e:
            logger.warning(f"Failed to parse structured output: {e}")
            
        # Fallback for unstructured models
        return InferenceOutput(
            thought="Direct generation; structured parsing failed.",
            action_type="direct_response",
            action_data={"text": raw_text if 'raw_text' in locals() else "Error generating response"},
            raw_response=raw_text if 'raw_text' in locals() else ""
        )

# Singleton
_dispatch = None

def get_intelligence_dispatch() -> IntelligenceDispatch:
    global _dispatch
    if _dispatch is None:
        _dispatch = IntelligenceDispatch()
    return _dispatch
