"""
LLM Model Comparison Test Script
Tests multiple FREE LLM models for AI Interview Platform

Models tested:
1. Google Gemini (Free tier): gemini-2.0-flash-exp, gemini-1.5-flash, gemma-3-27b-it
2. Hugging Face Inference API: Qwen, Mistral, Meta-Llama
3. Open-source alternatives via Hugging Face

Requirements:
- pip install google-generativeai huggingface-hub requests python-dotenv
- GEMINI_API_KEY in .env
- HUGGINGFACE_API_KEY in .env (get free from https://huggingface.co/settings/tokens)
"""

import os
import time
import json
from typing import Dict, List, Optional
from datetime import datetime
import google.generativeai as genai
from huggingface_hub import InferenceClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class ModelTester:
    """Test and compare different LLM models"""
    
    def __init__(self):
        self.gemini_api_key = os.getenv("GEMINI_API_KEY")
        self.hf_api_key = os.getenv("HUGGINGFACE_API_KEY")
        
        if self.gemini_api_key:
            genai.configure(api_key=self.gemini_api_key)
        
        self.results = []
        
        # Test prompts for AI interview scenarios
        self.test_prompts = [
            {
                "name": "Code Generation",
                "prompt": "Write a Python function to find the longest palindromic substring in a given string. Include time complexity analysis.",
                "category": "coding"
            },
            {
                "name": "Technical Reasoning",
                "prompt": "Explain the difference between deep copy and shallow copy in Python with examples. When would you use each?",
                "category": "reasoning"
            },
            {
                "name": "Follow-up Question",
                "prompt": "A candidate just explained: 'I use try-except blocks for error handling.' Generate a natural, conversational follow-up question to probe deeper into their understanding.",
                "category": "conversation"
            },
            {
                "name": "Code Review",
                "prompt": "Review this code and suggest improvements:\n\ndef process_data(data):\n    result = []\n    for i in range(len(data)):\n        if data[i] > 0:\n            result.append(data[i] * 2)\n    return result",
                "category": "analysis"
            }
        ]
    
    def test_gemini_model(self, model_name: str) -> Dict:
        """Test a Google Gemini model"""
        if not self.gemini_api_key:
            return {"error": "GEMINI_API_KEY not found in .env"}
        
        try:
            model = genai.GenerativeModel(model_name)
            results = []
            
            for test in self.test_prompts:
                start_time = time.time()
                try:
                    response = model.generate_content(
                        test["prompt"],
                        generation_config=genai.types.GenerationConfig(
                            max_output_tokens=512,
                            temperature=0.7
                        )
                    )
                    
                    # Extract text
                    response_text = ""
                    if hasattr(response, 'candidates') and response.candidates:
                        candidate = response.candidates[0]
                        if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                            parts = candidate.content.parts
                            if parts:
                                response_text = ''.join([part.text for part in parts if hasattr(part, 'text')]).strip()
                    
                    if not response_text and hasattr(response, 'text'):
                        response_text = response.text.strip()
                    
                    elapsed = time.time() - start_time
                    
                    results.append({
                        "test": test["name"],
                        "category": test["category"],
                        "success": True,
                        "response_length": len(response_text),
                        "response_preview": response_text[:200] + "..." if len(response_text) > 200 else response_text,
                        "time_seconds": round(elapsed, 2),
                        "tokens_per_second": round(len(response_text.split()) / elapsed, 2) if elapsed > 0 else 0
                    })
                except Exception as e:
                    results.append({
                        "test": test["name"],
                        "category": test["category"],
                        "success": False,
                        "error": str(e)
                    })
            
            return {
                "model": model_name,
                "provider": "Google Gemini",
                "cost": "FREE (with limits)",
                "results": results,
                "avg_time": round(sum(r.get("time_seconds", 0) for r in results) / len(results), 2) if results else 0,
                "success_rate": f"{sum(1 for r in results if r.get('success')) / len(results) * 100:.0f}%" if results else "0%"
            }
        except Exception as e:
            return {
                "model": model_name,
                "provider": "Google Gemini",
                "error": f"Failed to initialize: {str(e)}"
            }
    
    def test_huggingface_model(self, model_name: str, display_name: str = None) -> Dict:
        """Test a Hugging Face model via Inference API"""
        if not self.hf_api_key:
            return {"error": "HUGGINGFACE_API_KEY not found in .env"}
        
        try:
            client = InferenceClient(token=self.hf_api_key)
            results = []
            
            for test in self.test_prompts:
                start_time = time.time()
                try:
                    # Use text generation with streaming disabled for simplicity
                    response_text = ""
                    
                    # Try chat completion first (preferred for instruction-tuned models)
                    try:
                        messages = [{"role": "user", "content": test["prompt"]}]
                        completion = client.chat_completion(
                            messages=messages,
                            model=model_name,
                            max_tokens=512,
                            temperature=0.7
                        )
                        response_text = completion.choices[0].message.content
                    except:
                        # Fallback to text generation
                        response_text = client.text_generation(
                            test["prompt"],
                            model=model_name,
                            max_new_tokens=512,
                            temperature=0.7
                        )
                    
                    elapsed = time.time() - start_time
                    
                    results.append({
                        "test": test["name"],
                        "category": test["category"],
                        "success": True,
                        "response_length": len(response_text),
                        "response_preview": response_text[:200] + "..." if len(response_text) > 200 else response_text,
                        "time_seconds": round(elapsed, 2),
                        "tokens_per_second": round(len(response_text.split()) / elapsed, 2) if elapsed > 0 else 0
                    })
                except Exception as e:
                    results.append({
                        "test": test["name"],
                        "category": test["category"],
                        "success": False,
                        "error": str(e)
                    })
                    # Add delay to avoid rate limiting
                    time.sleep(2)
            
            return {
                "model": display_name or model_name,
                "provider": "Hugging Face",
                "cost": "FREE (300 req/hour)",
                "results": results,
                "avg_time": round(sum(r.get("time_seconds", 0) for r in results) / len(results), 2) if results else 0,
                "success_rate": f"{sum(1 for r in results if r.get('success')) / len(results) * 100:.0f}%" if results else "0%"
            }
        except Exception as e:
            return {
                "model": display_name or model_name,
                "provider": "Hugging Face",
                "error": f"Failed to initialize: {str(e)}"
            }
    
    def run_all_tests(self):
        """Run tests on all available free models"""
        print("=" * 80)
        print("LLM MODEL COMPARISON TEST")
        print("Testing FREE models for AI Interview Platform")
        print("=" * 80)
        print()
        
        # Google Gemini Models (Free tier)
        gemini_models = [
            "gemini-2.0-flash-exp",      # Latest experimental
            "gemini-1.5-flash",          # Stable free tier
            "gemini-1.5-flash-8b",       # Smaller, faster
            "gemma-3-27b-it",            # Current model (open-source)
            "gemma-2-9b-it",             # Smaller Gemma
        ]
        
        print("\n🔵 Testing Google Gemini Models (Free Tier)")
        print("-" * 80)
        for model in gemini_models:
            print(f"\nTesting: {model}...")
            result = self.test_gemini_model(model)
            self.results.append(result)
            self._print_result(result)
            time.sleep(1)  # Rate limiting
        
        # Hugging Face Models (Free Inference API)
        hf_models = [
            ("Qwen/Qwen2.5-1.5B-Instruct", "Qwen 2.5 1.5B"),
            ("Qwen/Qwen2.5-7B-Instruct", "Qwen 2.5 7B"),
            ("mistralai/Mistral-7B-Instruct-v0.3", "Mistral 7B Instruct"),
            ("meta-llama/Llama-3.2-3B-Instruct", "LLaMA 3.2 3B"),
            ("HuggingFaceH4/zephyr-7b-beta", "Zephyr 7B"),
            ("microsoft/Phi-3-mini-4k-instruct", "Phi-3 Mini"),
        ]
        
        print("\n\n🟠 Testing Hugging Face Models (Free Inference API)")
        print("-" * 80)
        for model_id, display_name in hf_models:
            print(f"\nTesting: {display_name}...")
            result = self.test_huggingface_model(model_id, display_name)
            self.results.append(result)
            self._print_result(result)
            time.sleep(2)  # Rate limiting for HF
        
        # Generate summary report
        self._generate_report()
    
    def _print_result(self, result: Dict):
        """Print individual test result"""
        if "error" in result:
            print(f"  ❌ ERROR: {result['error']}")
            return
        
        print(f"  Provider: {result.get('provider', 'Unknown')}")
        print(f"  Cost: {result.get('cost', 'Unknown')}")
        print(f"  Success Rate: {result.get('success_rate', '0%')}")
        print(f"  Avg Response Time: {result.get('avg_time', 0)}s")
        
        if result.get('results'):
            successful = [r for r in result['results'] if r.get('success')]
            if successful:
                avg_tokens_per_sec = sum(r.get('tokens_per_second', 0) for r in successful) / len(successful)
                print(f"  Avg Speed: {avg_tokens_per_sec:.1f} tokens/sec")
    
    def _generate_report(self):
        """Generate comprehensive comparison report"""
        print("\n\n" + "=" * 80)
        print("COMPARISON REPORT")
        print("=" * 80)
        
        # Filter successful models
        successful_models = [r for r in self.results if "error" not in r and r.get("results")]
        
        if not successful_models:
            print("\n❌ No models completed successfully!")
            return
        
        # Sort by success rate and speed
        successful_models.sort(
            key=lambda x: (
                float(x.get('success_rate', '0%').rstrip('%')),
                -x.get('avg_time', 999)
            ),
            reverse=True
        )
        
        print("\n🏆 TOP PERFORMERS (by success rate and speed):\n")
        for i, model in enumerate(successful_models[:5], 1):
            print(f"{i}. {model['model']}")
            print(f"   Provider: {model['provider']}")
            print(f"   Success: {model['success_rate']} | Avg Time: {model['avg_time']}s")
            
            # Calculate average speed
            successful_results = [r for r in model['results'] if r.get('success')]
            if successful_results:
                avg_speed = sum(r.get('tokens_per_second', 0) for r in successful_results) / len(successful_results)
                print(f"   Speed: {avg_speed:.1f} tokens/sec")
            print()
        
        # Category-specific recommendations
        print("\n📊 RECOMMENDATIONS BY USE CASE:\n")
        
        # Best for coding
        coding_scores = {}
        for model in successful_models:
            coding_results = [r for r in model['results'] if r.get('category') == 'coding' and r.get('success')]
            if coding_results:
                avg_time = sum(r['time_seconds'] for r in coding_results) / len(coding_results)
                coding_scores[model['model']] = avg_time
        
        if coding_scores:
            best_coding = min(coding_scores.items(), key=lambda x: x[1])
            print(f"🔧 Best for Code Generation: {best_coding[0]} ({best_coding[1]:.2f}s avg)")
        
        # Best for conversation
        conv_scores = {}
        for model in successful_models:
            conv_results = [r for r in model['results'] if r.get('category') == 'conversation' and r.get('success')]
            if conv_results:
                avg_time = sum(r['time_seconds'] for r in conv_results) / len(conv_results)
                conv_scores[model['model']] = avg_time
        
        if conv_scores:
            best_conv = min(conv_scores.items(), key=lambda x: x[1])
            print(f"💬 Best for Conversational AI: {best_conv[0]} ({best_conv[1]:.2f}s avg)")
        
        # Overall recommendation
        print("\n\n✅ RECOMMENDATION FOR AI INTERVIEW PLATFORM:")
        if successful_models:
            top_model = successful_models[0]
            print(f"\nPrimary Model: {top_model['model']}")
            print(f"Reason: {top_model['success_rate']} success rate, {top_model['avg_time']}s avg response time")
            print(f"Cost: {top_model['cost']}")
            
            if len(successful_models) > 1:
                fallback = successful_models[1]
                print(f"\nFallback Model: {fallback['model']}")
                print(f"Reason: Good alternative with {fallback['success_rate']} success rate")
        
        # Save detailed results to JSON
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f"llm_comparison_results_{timestamp}.json"
        
        with open(output_file, 'w') as f:
            json.dump({
                "timestamp": timestamp,
                "total_models_tested": len(self.results),
                "successful_models": len(successful_models),
                "results": self.results
            }, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: {output_file}")
        print("\n" + "=" * 80)


def main():
    """Main entry point"""
    print("\n🚀 Starting LLM Model Comparison Test\n")
    
    # Check for API keys
    if not os.getenv("GEMINI_API_KEY"):
        print("⚠️  WARNING: GEMINI_API_KEY not found in .env")
        print("   Get your free key from: https://aistudio.google.com/apikey")
    
    if not os.getenv("HUGGINGFACE_API_KEY"):
        print("⚠️  WARNING: HUGGINGFACE_API_KEY not found in .env")
        print("   Get your free key from: https://huggingface.co/settings/tokens")
    
    if not os.getenv("GEMINI_API_KEY") and not os.getenv("HUGGINGFACE_API_KEY"):
        print("\n❌ No API keys found! Please add them to your .env file.")
        return
    
    print()
    
    tester = ModelTester()
    tester.run_all_tests()


if __name__ == "__main__":
    main()
