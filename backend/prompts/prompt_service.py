"""
Prompt Service - Core service for managing and rendering prompts.

Provides:
- Loading prompts from file system
- Variable interpolation with truncation
- Runtime override of generation config and knobs
- Caching for performance
"""

import os
import json
import re
from typing import Dict, List, Optional, Any
from pathlib import Path

from prompts.models import (
    Prompt,
    PromptMeta,
    PromptCategory,
    GenerationConfig,
    PromptKnobs,
    PromptVariable
)


class PromptService:
    """
    Service for loading, managing, and rendering prompts.
    
    Prompts are stored as JSON files in:
        backend/prompts/templates/{category}/{variant}.json
    
    Usage:
        service = PromptService()
        
        # Get a prompt
        prompt = service.get_prompt("evaluation", "coding")
        
        # Render with variables
        rendered = service.render(
            "eval_coding_v1",
            variables={"question": "What is...", "response": "I think..."},
            config_overrides={"temperature": 0.5}
        )
    """
    
    def __init__(self, templates_dir: Optional[str] = None):
        """
        Initialize the PromptService.
        
        Args:
            templates_dir: Path to templates directory. Defaults to backend/prompts/templates
        """
        if templates_dir:
            self.templates_dir = Path(templates_dir)
        else:
            # Default: backend/prompts/templates
            self.templates_dir = Path(__file__).parent / "templates"
        
        # Cache loaded prompts
        self._cache: Dict[str, Prompt] = {}
        self._index: Dict[str, str] = {}  # id -> filepath mapping
        
        # Build index on init
        self._build_index()
    
    def _build_index(self) -> None:
        """Scan templates directory and build an index of available prompts."""
        if not self.templates_dir.exists():
            print(f"[PromptService] Templates directory not found: {self.templates_dir}")
            return
        
        for category_dir in self.templates_dir.iterdir():
            if category_dir.is_dir():
                for json_file in category_dir.glob("*.json"):
                    try:
                        with open(json_file, 'r', encoding='utf-8') as f:
                            data = json.load(f)
                            prompt_id = data.get("id")
                            if prompt_id:
                                self._index[prompt_id] = str(json_file)
                    except Exception as e:
                        print(f"[PromptService] Error indexing {json_file}: {e}")
        
        print(f"[PromptService] Indexed {len(self._index)} prompts from {self.templates_dir}")
    
    def get_prompt(
        self,
        category: str,
        variant: str,
        version: Optional[str] = None
    ) -> Optional[Prompt]:
        """
        Get a prompt by category and variant.
        
        Args:
            category: Prompt category (evaluation, feedback, followup, question_generation)
            variant: Variant within category (e.g., "coding", "behavioral")
            version: Optional specific version (default: latest)
        
        Returns:
            Prompt object or None if not found
        """
        # Construct expected path
        filepath = self.templates_dir / category / f"{variant}.json"
        
        if not filepath.exists():
            print(f"[PromptService] Prompt not found: {filepath}")
            return None
        
        return self._load_prompt(str(filepath))
    
    def get_prompt_by_id(self, prompt_id: str) -> Optional[Prompt]:
        """Get a prompt by its unique ID."""
        if prompt_id in self._cache:
            return self._cache[prompt_id]
        
        filepath = self._index.get(prompt_id)
        if filepath:
            return self._load_prompt(filepath)
        
        return None
    
    def _load_prompt(self, filepath: str) -> Optional[Prompt]:
        """Load a prompt from file and cache it."""
        try:
            prompt = Prompt.from_json_file(filepath)
            self._cache[prompt.id] = prompt
            return prompt
        except Exception as e:
            print(f"[PromptService] Error loading prompt from {filepath}: {e}")
            return None
    
    def list_prompts(self, category: Optional[str] = None) -> List[PromptMeta]:
        """
        List available prompts, optionally filtered by category.
        
        Args:
            category: Optional category filter
        
        Returns:
            List of PromptMeta objects
        """
        result = []
        
        for prompt_id, filepath in self._index.items():
            prompt = self.get_prompt_by_id(prompt_id)
            if prompt:
                if category is None or prompt.category.value == category:
                    result.append(PromptMeta.from_prompt(prompt))
        
        return result
    
    def render(
        self,
        prompt_id: str,
        variables: Dict[str, Any],
        config_overrides: Optional[Dict] = None,
        knob_overrides: Optional[Dict] = None
    ) -> Optional[Dict]:
        """
        Render a prompt with variables and optional overrides.
        
        Args:
            prompt_id: The prompt ID
            variables: Variable values to interpolate
            config_overrides: Override generation config (temperature, max_tokens, etc.)
            knob_overrides: Override knobs (truncation, examples, etc.)
        
        Returns:
            Dict with:
                - rendered_prompt: The final prompt text
                - generation_config: Merged generation config
                - knobs: Merged knobs
            Or None if prompt not found
        """
        prompt = self.get_prompt_by_id(prompt_id)
        if not prompt:
            return None
        
        # Merge configs with overrides
        final_config = prompt.generation_config
        if config_overrides:
            final_config = prompt.generation_config.merge(config_overrides)
        
        final_knobs = prompt.knobs
        if knob_overrides:
            final_knobs = prompt.knobs.merge(knob_overrides)
        
        # Process variables with truncation
        processed_vars = self._process_variables(
            variables,
            prompt.variables,
            final_knobs
        )
        
        # Render template
        rendered_prompt = self._interpolate(prompt.template, processed_vars)
        
        return {
            "rendered_prompt": rendered_prompt,
            "generation_config": final_config,
            "knobs": final_knobs,
            "prompt_id": prompt_id,
            "prompt_version": prompt.version
        }
    
    def _process_variables(
        self,
        provided: Dict[str, Any],
        definitions: List[PromptVariable],
        knobs: PromptKnobs
    ) -> Dict[str, Any]:
        """
        Process variables: validate, apply defaults, truncate.
        
        Args:
            provided: User-provided variable values
            definitions: Variable definitions from prompt
            knobs: Current knobs (may contain truncation settings)
        
        Returns:
            Processed variables ready for interpolation
        """
        result = {}
        
        # Create lookup for variable definitions
        var_defs = {v.name: v for v in definitions}
        
        for name, value in provided.items():
            var_def = var_defs.get(name)
            
            # Apply truncation if defined
            if isinstance(value, str):
                max_len = None
                
                # Check knobs for specific truncation
                if name == "question" and knobs.truncate_question_length:
                    max_len = knobs.truncate_question_length
                elif name == "response" and knobs.truncate_response_length:
                    max_len = knobs.truncate_response_length
                elif var_def and var_def.max_length:
                    max_len = var_def.max_length
                
                if max_len and len(value) > max_len:
                    value = value[:max_len]
            
            result[name] = value
        
        # Apply defaults for missing required variables
        for var_def in definitions:
            if var_def.name not in result:
                if var_def.default is not None:
                    result[var_def.name] = var_def.default
                elif var_def.required:
                    print(f"[PromptService] Warning: Required variable '{var_def.name}' not provided")
        
        return result
    
    def _interpolate(self, template: str, variables: Dict[str, Any]) -> str:
        """
        Interpolate variables into template.
        
        Supports:
            - {variable_name} - simple substitution
            - {variable_name:default} - with default value
        
        Args:
            template: Prompt template with placeholders
            variables: Variable values to substitute
        
        Returns:
            Rendered prompt string
        """
        def replace_var(match):
            full_match = match.group(1)
            
            # Check for default value syntax: {var:default}
            if ':' in full_match:
                var_name, default = full_match.split(':', 1)
            else:
                var_name = full_match
                default = f"{{{var_name}}}"  # Keep placeholder if not found
            
            value = variables.get(var_name)
            
            if value is None:
                return default
            
            # Convert to string representation
            if isinstance(value, list):
                return ', '.join(str(v) for v in value)
            elif isinstance(value, dict):
                return json.dumps(value, indent=2)
            else:
                return str(value)
        
        # Match {variable_name} or {variable_name:default}
        pattern = r'\{([^}]+)\}'
        return re.sub(pattern, replace_var, template)
    
    def get_generation_config(
        self,
        prompt_id: str,
        overrides: Optional[Dict] = None
    ) -> Optional[GenerationConfig]:
        """
        Get generation config for a prompt with optional overrides.
        
        Useful for getting the config separately from rendering.
        """
        prompt = self.get_prompt_by_id(prompt_id)
        if not prompt:
            return None
        
        if overrides:
            return prompt.generation_config.merge(overrides)
        return prompt.generation_config
    
    def reload(self) -> None:
        """Reload all prompts from disk (clears cache)."""
        self._cache.clear()
        self._index.clear()
        self._build_index()
        print(f"[PromptService] Reloaded {len(self._index)} prompts")
    
    def validate_prompt(self, prompt: Prompt) -> List[str]:
        """
        Validate a prompt definition.
        
        Returns list of validation errors (empty if valid).
        """
        errors = []
        
        if not prompt.id:
            errors.append("Prompt ID is required")
        
        if not prompt.name:
            errors.append("Prompt name is required")
        
        if not prompt.template:
            errors.append("Prompt template is required")
        
        # Check that all variables in template are defined
        template_vars = set(re.findall(r'\{([^}:]+)', prompt.template))
        defined_vars = {v.name for v in prompt.variables}
        
        undefined = template_vars - defined_vars
        if undefined:
            errors.append(f"Variables used in template but not defined: {undefined}")
        
        unused = defined_vars - template_vars
        if unused:
            # Warning, not error
            print(f"[PromptService] Warning: Defined variables not used in template: {unused}")
        
        return errors


# Singleton instance for convenience
_default_service: Optional[PromptService] = None


def get_prompt_service() -> PromptService:
    """Get the default PromptService instance."""
    global _default_service
    if _default_service is None:
        _default_service = PromptService()
    return _default_service
