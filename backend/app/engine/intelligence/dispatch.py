"""
Intelligence Dispatch Service - Swarm 2.0
Provides a unified interface for LLM providers with intelligent routing and fallback.
Standardizes outputs into the InferenceOutput model.
"""

import json
from typing import Dict, Optional, Any
from ..protocol.base import InferenceOutput
from ...llm.llm_router import get_llm_router

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
        If structured format is not enforced by the model, it uses a parser.
        """
        # Note: In a production version, we would use JSON mode or specific prompt engineering
        # to ensure the model returns { "thought": "...", "action_type": "...", "action_data": "..." }
        
        response = self.router.generate_content(prompt, generation_config)
        raw_text = response.text.strip()
        
        try:
            # Try to parse as JSON first
            # We wrap in a block to find JSON if the model included extra text
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
        except Exception:
            pass
            
        # Fallback for unstructured models
        return InferenceOutput(
            thought="Direct generation; structured parsing failed.",
            action_type="direct_response",
            action_data={"text": raw_text},
            raw_response=raw_text
        )

# Singleton
_dispatch = None

def get_intelligence_dispatch() -> IntelligenceDispatch:
    global _dispatch
    if _dispatch is None:
        _dispatch = IntelligenceDispatch()
    return _dispatch
