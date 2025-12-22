"""Hugging Face API client for LLM operations"""
import os
from typing import Dict, Optional, List
from huggingface_hub import InferenceClient
from dotenv import load_dotenv

load_dotenv()

class HuggingFaceClient:
    """Client for interacting with Hugging Face Inference API"""
    
    def __init__(self, model_name: str = "Qwen/Qwen2.5-7B-Instruct"):
        """
        Initialize Hugging Face client
        
        Args:
            model_name: Hugging Face model ID (e.g., "Qwen/Qwen2.5-7B-Instruct")
        """
        self.api_key = os.getenv("HUGGINGFACE_API_KEY")
        if not self.api_key:
            raise ValueError("HUGGINGFACE_API_KEY not found in environment variables")
        
        self.model_name = model_name
        self.client = InferenceClient(token=self.api_key)
        print(f"HuggingFaceClient initialized with model: {model_name}")
    
    def generate_content(self, prompt: str, generation_config: Optional[Dict] = None) -> 'HFResponse':
        """
        Generate content using Hugging Face model
        
        Args:
            prompt: The input prompt
            generation_config: Optional generation configuration
                - temperature: float (0.0-1.0)
                - max_output_tokens: int
                - top_p: float (0.0-1.0)
        
        Returns:
            HFResponse object with .text property
        """
        # Extract config parameters
        config_dict = {}
        if generation_config:
            # Check for to_dict method (our own Prompt models)
            if hasattr(generation_config, 'to_dict') and callable(generation_config.to_dict):
                config_dict = generation_config.to_dict()
            # Check for members/attributes (Google/Other)
            elif hasattr(generation_config, 'temperature'):
                config_dict = {
                    'temperature': generation_config.temperature,
                    'max_output_tokens': getattr(generation_config, 'max_output_tokens', 512),
                    'top_p': getattr(generation_config, 'top_p', 0.95)
                }
            elif isinstance(generation_config, dict):
                config_dict = generation_config
            
        temperature = config_dict.get('temperature', 0.7)
        max_tokens = config_dict.get('max_output_tokens', 512)
        top_p = config_dict.get('top_p', 0.95)
        
        try:
            # Use chat completion API for instruction-tuned models
            messages = [{"role": "user", "content": prompt}]
            
            completion = self.client.chat_completion(
                messages=messages,
                model=self.model_name,
                max_tokens=max_tokens,
                temperature=temperature,
                top_p=top_p
            )
            
            response_text = completion.choices[0].message.content
            return HFResponse(response_text)
            
        except Exception as e:
            # Fallback to text generation if chat completion fails
            try:
                response_text = self.client.text_generation(
                    prompt,
                    model=self.model_name,
                    max_new_tokens=max_tokens,
                    temperature=temperature,
                    top_p=top_p
                )
                return HFResponse(response_text)
            except Exception as e2:
                raise Exception(f"Both chat_completion and text_generation failed: {e}, {e2}")


class HFResponse:
    """Response wrapper to match Gemini API interface"""
    
    def __init__(self, text: str):
        self._text = text
        # Create candidates structure to match Gemini API
        self.candidates = [HFCandidate(text)]
    
    @property
    def text(self) -> str:
        """Get response text"""
        return self._text


class HFCandidate:
    """Candidate wrapper to match Gemini API interface"""
    
    def __init__(self, text: str):
        self.content = HFContent(text)
        self.finish_reason = 1  # STOP


class HFContent:
    """Content wrapper to match Gemini API interface"""
    
    def __init__(self, text: str):
        self.parts = [HFPart(text)]


class HFPart:
    """Part wrapper to match Gemini API interface"""
    
    def __init__(self, text: str):
        self.text = text
