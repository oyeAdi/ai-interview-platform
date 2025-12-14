"""
Pydantic models for Prompt Microservice.

Defines the schema for prompts, variables, generation config, and knobs.
"""

from typing import Dict, List, Optional, Any, Union
from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime
import json


class PromptCategory(str, Enum):
    """Categories of prompts in the interview system."""
    EVALUATION = "evaluation"
    FEEDBACK = "feedback"
    FOLLOWUP = "followup"
    QUESTION_GENERATION = "question_generation"
    WIKI = "wiki"
    CODE_REVIEW = "code_review"
    NARRATIVE = "narrative"


class VariableType(str, Enum):
    """Types of variables that can be interpolated into prompts."""
    STRING = "string"
    INTEGER = "int"
    FLOAT = "float"
    BOOLEAN = "bool"
    LIST = "list"
    OBJECT = "object"


class OutputFormat(str, Enum):
    """Expected output formats from LLM."""
    TEXT = "text"
    JSON = "json"
    STRUCTURED = "structured"  # Custom parsing required


@dataclass
class PromptVariable:
    """Definition of a variable that can be interpolated into a prompt."""
    name: str
    type: VariableType = VariableType.STRING
    required: bool = True
    default: Any = None
    max_length: Optional[int] = None  # For truncation
    description: Optional[str] = None
    
    def to_dict(self) -> Dict:
        return {
            "name": self.name,
            "type": self.type.value,
            "required": self.required,
            "default": self.default,
            "max_length": self.max_length,
            "description": self.description
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> "PromptVariable":
        return cls(
            name=data["name"],
            type=VariableType(data.get("type", "string")),
            required=data.get("required", True),
            default=data.get("default"),
            max_length=data.get("max_length"),
            description=data.get("description")
        )


@dataclass
class GenerationConfig:
    """LLM generation parameters."""
    temperature: float = 0.7
    max_output_tokens: int = 256
    top_p: Optional[float] = None
    top_k: Optional[int] = None
    
    def to_dict(self) -> Dict:
        result = {
            "temperature": self.temperature,
            "max_output_tokens": self.max_output_tokens
        }
        if self.top_p is not None:
            result["top_p"] = self.top_p
        if self.top_k is not None:
            result["top_k"] = self.top_k
        return result
    
    @classmethod
    def from_dict(cls, data: Dict) -> "GenerationConfig":
        return cls(
            temperature=data.get("temperature", 0.7),
            max_output_tokens=data.get("max_output_tokens", 256),
            top_p=data.get("top_p"),
            top_k=data.get("top_k")
        )
    
    def merge(self, overrides: Dict) -> "GenerationConfig":
        """Create a new config with overrides applied."""
        return GenerationConfig(
            temperature=overrides.get("temperature", self.temperature),
            max_output_tokens=overrides.get("max_output_tokens", self.max_output_tokens),
            top_p=overrides.get("top_p", self.top_p),
            top_k=overrides.get("top_k", self.top_k)
        )


@dataclass
class PromptKnobs:
    """Prompt-specific configuration knobs beyond LLM params."""
    truncate_question_length: Optional[int] = None
    truncate_response_length: Optional[int] = None
    include_examples: bool = True
    output_format: OutputFormat = OutputFormat.TEXT
    fallback_enabled: bool = True
    custom: Dict[str, Any] = field(default_factory=dict)  # Strategy-specific knobs
    
    def to_dict(self) -> Dict:
        return {
            "truncate_question_length": self.truncate_question_length,
            "truncate_response_length": self.truncate_response_length,
            "include_examples": self.include_examples,
            "output_format": self.output_format.value,
            "fallback_enabled": self.fallback_enabled,
            "custom": self.custom
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> "PromptKnobs":
        return cls(
            truncate_question_length=data.get("truncate_question_length"),
            truncate_response_length=data.get("truncate_response_length"),
            include_examples=data.get("include_examples", True),
            output_format=OutputFormat(data.get("output_format", "text")),
            fallback_enabled=data.get("fallback_enabled", True),
            custom=data.get("custom", {})
        )
    
    def merge(self, overrides: Dict) -> "PromptKnobs":
        """Create new knobs with overrides applied."""
        custom_merged = {**self.custom, **overrides.get("custom", {})}
        return PromptKnobs(
            truncate_question_length=overrides.get("truncate_question_length", self.truncate_question_length),
            truncate_response_length=overrides.get("truncate_response_length", self.truncate_response_length),
            include_examples=overrides.get("include_examples", self.include_examples),
            output_format=OutputFormat(overrides.get("output_format", self.output_format.value)),
            fallback_enabled=overrides.get("fallback_enabled", self.fallback_enabled),
            custom=custom_merged
        )


@dataclass
class Prompt:
    """
    Complete prompt definition with template, variables, and configuration.
    
    This is the core data model for the Prompt Microservice.
    """
    id: str
    name: str
    category: PromptCategory
    template: str
    
    # Optional fields
    variant: Optional[str] = None
    version: str = "1.0.0"
    variables: List[PromptVariable] = field(default_factory=list)
    generation_config: GenerationConfig = field(default_factory=GenerationConfig)
    knobs: PromptKnobs = field(default_factory=PromptKnobs)
    
    # Metadata
    description: Optional[str] = None
    author: str = "system"
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    notes: Optional[str] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now().isoformat()
        if self.updated_at is None:
            self.updated_at = self.created_at
    
    def to_dict(self) -> Dict:
        """Serialize prompt to dictionary (for JSON storage)."""
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category.value,
            "variant": self.variant,
            "version": self.version,
            "template": self.template,
            "variables": [v.to_dict() for v in self.variables],
            "generation_config": self.generation_config.to_dict(),
            "knobs": self.knobs.to_dict(),
            "description": self.description,
            "author": self.author,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "notes": self.notes
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> "Prompt":
        """Deserialize prompt from dictionary."""
        return cls(
            id=data["id"],
            name=data["name"],
            category=PromptCategory(data["category"]),
            variant=data.get("variant"),
            version=data.get("version", "1.0.0"),
            template=data["template"],
            variables=[PromptVariable.from_dict(v) for v in data.get("variables", [])],
            generation_config=GenerationConfig.from_dict(data.get("generation_config", {})),
            knobs=PromptKnobs.from_dict(data.get("knobs", {})),
            description=data.get("description"),
            author=data.get("author", "system"),
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at"),
            notes=data.get("notes")
        )
    
    @classmethod
    def from_json_file(cls, filepath: str) -> "Prompt":
        """Load prompt from a JSON file."""
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return cls.from_dict(data)
    
    def save_to_json(self, filepath: str) -> None:
        """Save prompt to a JSON file."""
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(self.to_dict(), f, indent=2, ensure_ascii=False)


@dataclass
class PromptMeta:
    """Lightweight metadata for listing prompts without full template."""
    id: str
    name: str
    category: PromptCategory
    variant: Optional[str]
    version: str
    description: Optional[str]
    
    @classmethod
    def from_prompt(cls, prompt: Prompt) -> "PromptMeta":
        return cls(
            id=prompt.id,
            name=prompt.name,
            category=prompt.category,
            variant=prompt.variant,
            version=prompt.version,
            description=prompt.description
        )
