"""LLM Router with intelligent fallback logic"""
import os
from typing import Dict, Optional, List, Any
from dotenv import load_dotenv

load_dotenv()

class LLMRouter:
    """
    Intelligent LLM router that tries multiple models with fallback logic.
    
    Priority order:
    1. Qwen 2.5 7B (Hugging Face) - Fastest, best performance
    2. LLaMA 3.2 3B (Hugging Face) - Reliable fallback
    3. Gemma 3 27B IT (Google) - Higher quota fallback
    """
    
    def __init__(self):
        """Initialize LLM router with available clients"""
        self.clients = []
        self.active_client = None
        self.active_model_name = None
        
        # Try to initialize Hugging Face models first
        try:
            from llm.huggingface_client import HuggingFaceClient
            
            # Primary: Qwen 2.5 7B
            try:
                qwen_client = HuggingFaceClient("Qwen/Qwen2.5-7B-Instruct")
                self.clients.append({
                    "client": qwen_client,
                    "name": "Qwen 2.5 7B",
                    "provider": "Hugging Face",
                    "priority": 1
                })
                print("✓ Qwen 2.5 7B available")
            except Exception as e:
                print(f"✗ Qwen 2.5 7B unavailable: {e}")
            
            # Secondary: LLaMA 3.2 3B
            try:
                llama_client = HuggingFaceClient("meta-llama/Llama-3.2-3B-Instruct")
                self.clients.append({
                    "client": llama_client,
                    "name": "LLaMA 3.2 3B",
                    "provider": "Hugging Face",
                    "priority": 2
                })
                print("✓ LLaMA 3.2 3B available")
            except Exception as e:
                print(f"✗ LLaMA 3.2 3B unavailable: {e}")
                
        except ImportError:
            print("⚠ HuggingFaceClient not available, skipping HF models")
        
        # Tertiary: Gemma 3 27B IT (always available as fallback)
        try:
            from llm.gemini_client import GeminiClient
            gemini_client = GeminiClient(use_router=False)
            self.clients.append({
                "client": gemini_client,
                "name": "Gemma 3 27B IT",
                "provider": "Google Gemini",
                "priority": 3
            })
            print("✓ Gemma 3 27B IT available (fallback)")
        except Exception as e:
            print(f"✗ Gemma 3 27B IT unavailable: {e}")
        
        if not self.clients:
            raise ValueError("No LLM clients available! Check API keys.")
        
        # Sort by priority
        self.clients.sort(key=lambda x: x["priority"])
        
        # Set active client to highest priority
        self.active_client = self.clients[0]["client"]
        self.active_model_name = self.clients[0]["name"]
        
        print(f"\n🚀 LLMRouter initialized with {len(self.clients)} model(s)")
        print(f"   Primary: {self.active_model_name} ({self.clients[0]['provider']})")
    
    def generate_content(self, prompt: str, generation_config: Optional[Dict] = None) -> Any:
        """
        Generate content with automatic fallback
        
        Args:
            prompt: Input prompt
            generation_config: Generation configuration
        
        Returns:
            Response object (compatible with Gemini API)
        """
        last_error = None
        
        for client_info in self.clients:
            client = client_info["client"]
            model_name = client_info["name"]
            
            try:
                # Try to generate content
                response = client.generate_content(prompt, generation_config)
                
                # Update active client if different
                if self.active_model_name != model_name:
                    print(f"⚠ Switched to {model_name}")
                    self.active_client = client
                    self.active_model_name = model_name
                
                return response
                
            except Exception as e:
                last_error = e
                print(f"✗ {model_name} failed: {str(e)[:100]}")
                continue
        
        # All clients failed
        raise Exception(f"All LLM clients failed. Last error: {last_error}")
    
    def get_active_model(self) -> str:
        """Get the name of the currently active model"""
        return self.active_model_name
    
    def get_available_models(self) -> List[str]:
        """Get list of all available models"""
        return [c["name"] for c in self.clients]


# Singleton instance
_router_instance = None

def get_llm_router() -> LLMRouter:
    """Get or create singleton LLM router instance"""
    global _router_instance
    if _router_instance is None:
        _router_instance = LLMRouter()
    return _router_instance
