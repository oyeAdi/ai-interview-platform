"""
Prompt Service - Supabase-backed service for managing and rendering prompts.

Provides:
- Loading prompts from Supabase 'prompt_templates' table
- Variable interpolation with truncation
- Runtime override of generation config and knobs
- Caching for performance
"""

import json
import re
from typing import Dict, List, Optional, Any
from supabase_config import supabase_admin

from prompts.models import (
    Prompt,
    PromptMeta,
    GenerationConfig,
    PromptKnobs,
    PromptVariable
)


class PromptService:
    """
    Service for loading, managing, and rendering prompts via Supabase.
    
    Prompts are stored in the 'prompt_templates' table.
    """
    
    def __init__(self):
        """Initialize the PromptService with Supabase admin client."""
        self.admin = supabase_admin
        self.table_name = "prompt_templates"
        
        # Cache loaded prompts
        self._cache: Dict[str, Prompt] = {}
    
    def get_prompt(
        self,
        category: str,
        variant: str,
        version: Optional[str] = None
    ) -> Optional[Prompt]:
        """
        Get a prompt by category and variant from Supabase.
        """
        query = self.admin.table(self.table_name).select('*').eq('category', category).eq('variant', variant).eq('status', 'active')
        
        if version:
            query = query.eq('version', version)
        else:
            query = query.order('version', desc=True).limit(1)
            
        response = query.execute()
        
        if response.data:
            return self._cache_and_return_prompt(response.data[0])
        
        return None
    
    def get_prompt_by_id(self, prompt_id: str) -> Optional[Prompt]:
        """Get a prompt by its unique ID from Supabase."""
        if prompt_id in self._cache:
            return self._cache[prompt_id]
        
        response = self.admin.table(self.table_name).select('*').eq('id', prompt_id).execute()
        
        if response.data:
            return self._cache_and_return_prompt(response.data[0])
        
        return None
    
    def _cache_and_return_prompt(self, data: Dict[str, Any]) -> Prompt:
        """Convert DB data to Prompt model and cache it."""
        # Map DB fields to Prompt model
        prompt = Prompt(
            id=data['id'],
            name=data['name'],
            version=data['version'],
            category=data['category'], # Enum will handle string
            variant=data['variant'],
            template=data['template'],
            variables=[PromptVariable(**v) for v in data['variables']] if isinstance(data['variables'], list) else [],
            generation_config=GenerationConfig(**data['generation_config']) if data['generation_config'] else GenerationConfig(),
            knobs=PromptKnobs(**data['knobs']) if data['knobs'] else PromptKnobs(),
            author=data.get('author', 'system'),
            notes=data.get('notes'),
            created_at=data.get('created_at'),
            updated_at=data.get('updated_at')
        )
        self._cache[prompt.id] = prompt
        return prompt
    
    def list_prompts(self, category: Optional[str] = None) -> List[PromptMeta]:
        """List available prompts from Supabase."""
        query = self.admin.table(self.table_name).select('id', 'name', 'version', 'category', 'variant', 'author', 'created_at')
        
        if category:
            query = query.eq('category', category)
            
        response = query.execute()
        
        return [
            PromptMeta(
                id=d['id'],
                name=d['name'],
                version=d['version'],
                category=d['category'],
                variant=d['variant']
            ) for d in response.data
        ] if response.data else []
    
    def render(
        self,
        prompt_id: str,
        variables: Dict[str, Any],
        config_overrides: Optional[Dict] = None,
        knob_overrides: Optional[Dict] = None
    ) -> Optional[Dict]:
        """
        Render a prompt with variables and optional overrides.
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
        """Process variables: validate, apply defaults, truncate."""
        result = {}
        var_defs = {v.name: v for v in definitions}
        
        for name, value in provided.items():
            var_def = var_defs.get(name)
            
            if isinstance(value, str):
                max_len = None
                if name == "question" and knobs.truncate_question_length:
                    max_len = knobs.truncate_question_length
                elif name == "response" and knobs.truncate_response_length:
                    max_len = knobs.truncate_response_length
                elif var_def and var_def.max_length:
                    max_len = var_def.max_length
                
                if max_len and len(value) > max_len:
                    value = value[:max_len]
            
            result[name] = value
        
        for var_def in definitions:
            if var_def.name not in result:
                if var_def.default is not None:
                    result[var_def.name] = var_def.default
                elif var_def.required:
                    print(f"[PromptService] Warning: Required variable '{var_def.name}' not provided")
        
        return result
    
    def _interpolate(self, template: str, variables: Dict[str, Any]) -> str:
        """Interpolate variables into template."""
        def replace_var(match):
            full_match = match.group(1)
            if ':' in full_match:
                var_name, default = full_match.split(':', 1)
            else:
                var_name = full_match
                default = f"{{{var_name}}}"
            
            value = variables.get(var_name)
            if value is None:
                return default
            
            if isinstance(value, list):
                return ', '.join(str(v) for v in value)
            elif isinstance(value, dict):
                return json.dumps(value, indent=2)
            else:
                return str(value)
        
        pattern = r'\{([^}]+)\}'
        return re.sub(pattern, replace_var, template)
    
    def reload(self) -> None:
        """Clear cache (Supabase is source of truth)."""
        self._cache.clear()
        print("[PromptService] Cache cleared")

# Singleton instance
_default_service: Optional[PromptService] = None

def get_prompt_service() -> PromptService:
    global _default_service
    if _default_service is None:
        _default_service = PromptService()
    return _default_service


# Singleton instance for convenience
_default_service: Optional[PromptService] = None


def get_prompt_service() -> PromptService:
    """Get the default PromptService instance."""
    global _default_service
    if _default_service is None:
        _default_service = PromptService()
    return _default_service
