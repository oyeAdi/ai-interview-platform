"""
Prompt Microservice Module

Provides versioned, configurable LLM prompts with runtime override support.
Implements the Strangler Fig pattern for gradual migration.
"""

from app.prompts.models import (
    Prompt,
    PromptVariable,
    GenerationConfig,
    PromptKnobs,
    PromptCategory
)
from app.prompts.prompt_service import PromptService

__all__ = [
    "Prompt",
    "PromptVariable", 
    "GenerationConfig",
    "PromptKnobs",
    "PromptCategory",
    "PromptService"
]
