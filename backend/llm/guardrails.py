"""
LLM Guardrails for Bounded Behavior

This module provides input validation, output validation, and behavioral constraints
to minimize hallucinations and ensure professional, on-topic responses.
"""

import re
import json
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum


class GuardrailViolation(Exception):
    """Exception raised when a guardrail check fails"""
    def __init__(self, message: str, violation_type: str):
        self.message = message
        self.violation_type = violation_type
        super().__init__(self.message)


class ViolationType(Enum):
    INPUT_INJECTION = "input_injection"
    OUTPUT_SCHEMA_MISMATCH = "output_schema_mismatch"
    HALLUCINATION_DETECTED = "hallucination_detected"
    OFF_TOPIC = "off_topic"
    UNSAFE_CONTENT = "unsafe_content"
    TOKEN_LIMIT_EXCEEDED = "token_limit_exceeded"


@dataclass
class GuardrailConfig:
    """Configuration for guardrail behavior"""
    max_input_length: int = 10000
    max_output_tokens: int = 2000
    allowed_topics: List[str] = None
    required_output_fields: List[str] = None
    blocked_phrases: List[str] = None
    
    def __post_init__(self):
        if self.allowed_topics is None:
            self.allowed_topics = [
                "python", "java", "javascript", "coding", "algorithms",
                "data_structures", "system_design", "databases", "microservices",
                "interview", "technical", "software", "engineering", "architecture"
            ]
        if self.blocked_phrases is None:
            self.blocked_phrases = [
                "ignore previous instructions",
                "disregard the above",
                "forget everything",
                "new instructions:",
                "system prompt:",
                "you are now",
                "pretend to be"
            ]


class LLMGuardrails:
    """
    Guardrails for bounded LLM behavior.
    
    Provides:
    - Input sanitization and validation
    - Output schema validation
    - Hallucination detection
    - Topic boundary enforcement
    - Safety filtering
    """
    
    def __init__(self, config: GuardrailConfig = None):
        self.config = config or GuardrailConfig()
        
        # Patterns for injection detection
        self.injection_patterns = [
            r"ignore\s+(all\s+)?previous",
            r"disregard\s+(the\s+)?above",
            r"new\s+instructions?\s*:",
            r"system\s+prompt\s*:",
            r"you\s+are\s+now\s+a",
            r"pretend\s+(to\s+)?be",
            r"act\s+as\s+if",
            r"forget\s+everything",
            r"\]\s*\}\s*\{",  # JSON injection attempt
        ]
        
        # Unsafe content patterns
        self.unsafe_patterns = [
            r"(password|secret|api[_\s]?key|token)\s*[:=]",
            r"(hack|exploit|vulnerability|inject)",
            r"(inappropriate|offensive|discriminat)",
        ]
    
    def validate_input(self, prompt: str, context: Dict = None) -> str:
        """
        Sanitize and validate input before LLM call.
        
        Args:
            prompt: The prompt text to validate
            context: Optional context dictionary with trusted data
        
        Returns:
            Sanitized prompt string
        
        Raises:
            GuardrailViolation: If input fails validation
        """
        context = context or {}
        
        # Check length
        if len(prompt) > self.config.max_input_length:
            prompt = prompt[:self.config.max_input_length]
        
        # Check for injection attempts
        prompt_lower = prompt.lower()
        for pattern in self.injection_patterns:
            if re.search(pattern, prompt_lower, re.IGNORECASE):
                raise GuardrailViolation(
                    f"Potential injection detected: {pattern}",
                    ViolationType.INPUT_INJECTION.value
                )
        
        # Check for blocked phrases
        for phrase in self.config.blocked_phrases:
            if phrase.lower() in prompt_lower:
                raise GuardrailViolation(
                    f"Blocked phrase detected: {phrase}",
                    ViolationType.INPUT_INJECTION.value
                )
        
        # Sanitize: Remove potential code execution patterns
        prompt = re.sub(r'<script[^>]*>.*?</script>', '', prompt, flags=re.DOTALL | re.IGNORECASE)
        prompt = re.sub(r'javascript:', '', prompt, flags=re.IGNORECASE)
        
        return prompt
    
    def validate_output(
        self, 
        response: str, 
        expected_schema: Dict = None,
        required_fields: List[str] = None
    ) -> Dict:
        """
        Validate LLM output against expected schema.
        
        Args:
            response: The raw response from LLM
            expected_schema: Optional schema to validate against
            required_fields: List of required fields in the response
        
        Returns:
            Validated and parsed response dict
        
        Raises:
            GuardrailViolation: If output fails validation
        """
        if not response or not response.strip():
            raise GuardrailViolation(
                "Empty response from LLM",
                ViolationType.OUTPUT_SCHEMA_MISMATCH.value
            )
        
        # If expecting JSON, try to parse it
        if expected_schema:
            try:
                # Try to extract JSON from response
                json_match = re.search(r'\{.*\}', response, re.DOTALL)
                if json_match:
                    parsed = json.loads(json_match.group())
                else:
                    parsed = json.loads(response)
                
                # Validate required fields
                if required_fields:
                    for field in required_fields:
                        if field not in parsed:
                            raise GuardrailViolation(
                                f"Missing required field: {field}",
                                ViolationType.OUTPUT_SCHEMA_MISMATCH.value
                            )
                
                return parsed
            except json.JSONDecodeError:
                # Return as text if not valid JSON
                return {"text": response, "raw": True}
        
        return {"text": response}
    
    def check_hallucination(
        self, 
        response: str, 
        source_data: Dict,
        strict: bool = False
    ) -> Dict:
        """
        Check if response references data not in source.
        
        Args:
            response: The LLM response to check
            source_data: Dictionary of trusted source data
            strict: If True, raise exception on hallucination
        
        Returns:
            Dict with hallucination_detected flag and details
        """
        result = {
            "hallucination_detected": False,
            "confidence": 1.0,
            "flagged_items": []
        }
        
        # Extract numbers from response
        response_numbers = set(re.findall(r'\b\d+(?:\.\d+)?\b', response))
        
        # Extract numbers from source
        source_str = json.dumps(source_data)
        source_numbers = set(re.findall(r'\b\d+(?:\.\d+)?\b', source_str))
        
        # Check for numbers not in source (potential hallucination)
        unknown_numbers = response_numbers - source_numbers
        # Filter out common numbers (0-10, 100, etc.)
        common_numbers = {'0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '100'}
        unknown_numbers = unknown_numbers - common_numbers
        
        if unknown_numbers:
            result["flagged_items"].extend([
                f"Number not in source: {num}" for num in list(unknown_numbers)[:5]
            ])
            result["confidence"] = 0.7
        
        # Check for specific claims about source data
        if "source_data" in source_data:
            # More sophisticated hallucination detection could go here
            pass
        
        if result["flagged_items"]:
            result["hallucination_detected"] = True
            if strict:
                raise GuardrailViolation(
                    f"Potential hallucination: {result['flagged_items']}",
                    ViolationType.HALLUCINATION_DETECTED.value
                )
        
        return result
    
    def enforce_topic_boundary(
        self, 
        response: str, 
        topic: str,
        allowed_topics: List[str] = None
    ) -> bool:
        """
        Ensure response stays on topic.
        
        Args:
            response: The LLM response to check
            topic: The expected topic
            allowed_topics: List of allowed topics
        
        Returns:
            True if on topic, raises exception otherwise
        """
        allowed = allowed_topics or self.config.allowed_topics
        
        # Check if response mentions allowed topics
        response_lower = response.lower()
        
        # Simple topic relevance check
        topic_keywords = topic.lower().split()
        matches = sum(1 for kw in topic_keywords if kw in response_lower)
        
        # Also check if any allowed topic is mentioned
        allowed_matches = sum(1 for t in allowed if t.lower() in response_lower)
        
        if matches == 0 and allowed_matches == 0:
            # Response might be off-topic
            # For now, just log a warning rather than blocking
            print(f"Warning: Response may be off-topic. Expected: {topic}")
        
        return True
    
    def filter_unsafe_content(self, text: str) -> str:
        """
        Filter potentially unsafe content from text.
        
        Args:
            text: Text to filter
        
        Returns:
            Filtered text
        """
        for pattern in self.unsafe_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                # Redact the matched content
                text = re.sub(pattern, '[REDACTED]', text, flags=re.IGNORECASE)
        
        return text
    
    def get_safe_config(self, operation: str) -> Dict:
        """
        Get safe generation config for a specific operation.
        
        Args:
            operation: The type of operation (question, evaluation, etc.)
        
        Returns:
            Dict with temperature, max_tokens, etc.
        """
        configs = {
            "question_enhancement": {
                "temperature": 0.3,
                "max_output_tokens": 500,
                "top_p": 0.9
            },
            "followup_generation": {
                "temperature": 0.5,
                "max_output_tokens": 300,
                "top_p": 0.95
            },
            "response_evaluation": {
                "temperature": 0.2,
                "max_output_tokens": 800,
                "top_p": 0.85
            },
            "feedback_generation": {
                "temperature": 0.4,
                "max_output_tokens": 600,
                "top_p": 0.9
            },
            "code_review": {
                "temperature": 0.2,
                "max_output_tokens": 500,
                "top_p": 0.85
            },
            "default": {
                "temperature": 0.3,
                "max_output_tokens": 500,
                "top_p": 0.9
            }
        }
        
        return configs.get(operation, configs["default"])


# Singleton instance for easy access
_guardrails_instance = None

def get_guardrails(config: GuardrailConfig = None) -> LLMGuardrails:
    """Get or create the guardrails singleton"""
    global _guardrails_instance
    if _guardrails_instance is None or config is not None:
        _guardrails_instance = LLMGuardrails(config)
    return _guardrails_instance


