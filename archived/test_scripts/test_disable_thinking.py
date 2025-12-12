"""Test if we can disable thinking or control thinking budget"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import google.generativeai as genai

NEW_API_KEY = "AIzaSyAhMC13D-v4DcX1pMJ1JvtaZHO7gJOmmI4"

genai.configure(api_key=NEW_API_KEY)

# Try different models that might not have thinking enabled
models_to_test = [
    ("gemini-2.5-flash", {}),
    ("gemini-2.5-flash", {"thinking_tokens_budget": 0}),  # Try to disable thinking
    ("gemini-2.0-flash", {}),  # Older model, might not have thinking
    ("gemini-pro-latest", {}),  # Latest stable
]

prompt = """Generate a natural follow-up question for a technical interview.

Question: How do you iterate over a dictionary in Python?
Response: I use .items() to iterate.
Score: 75/100

Focus: The candidate should provide a specific real-world example.

Rules:
- Generate ONLY a natural question (like a real interviewer)
- DO NOT include "Ask about", "Explore", or meta-instructions
- Be specific and reference what the candidate said

Generate ONLY the question text, nothing else.
"""

print("=" * 80)
print("TESTING THINKING TOKENS CONTROL")
print("=" * 80)

for model_name, extra_config in models_to_test:
    print(f"\n{'=' * 80}")
    print(f"Testing: {model_name}")
    if extra_config:
        print(f"Extra config: {extra_config}")
    print(f"{'=' * 80}")
    
    try:
        model = genai.GenerativeModel(model_name)
        
        # Build generation config
        gen_config = {
            "temperature": 0.8,
            "max_output_tokens": 1024,
            "top_p": 0.95
        }
        gen_config.update(extra_config)
        
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(**gen_config)
        )
        
        # Check usage metadata
        if hasattr(response, 'usage_metadata'):
            usage = response.usage_metadata
            print(f"Token Usage:")
            print(f"   Prompt: {usage.prompt_token_count if hasattr(usage, 'prompt_token_count') else 'N/A'}")
            print(f"   Candidates: {usage.candidates_token_count if hasattr(usage, 'candidates_token_count') else 'N/A'}")
            print(f"   Total: {usage.total_token_count if hasattr(usage, 'total_token_count') else 'N/A'}")
            
            if hasattr(usage, 'thoughts_token_count'):
                print(f"   ⚠️  THINKING TOKENS: {usage.thoughts_token_count}")
                if usage.thoughts_token_count > 0:
                    print(f"   ⚠️  Thinking is ENABLED and using tokens!")
        
        if response.candidates:
            candidate = response.candidates[0]
            finish_reason = candidate.finish_reason
            finish_map = {1: "STOP", 2: "MAX_TOKENS", 3: "SAFETY", 4: "RECITATION"}
            
            print(f"Finish reason: {finish_reason} ({finish_map.get(finish_reason, 'UNKNOWN')})")
            
            if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                parts = candidate.content.parts
                print(f"Parts count: {len(parts) if parts else 0}")
                
                if parts and len(parts) > 0:
                    text_parts = []
                    for part in parts:
                        if hasattr(part, 'text') and part.text:
                            text_parts.append(part.text)
                    if text_parts:
                        text = ''.join(text_parts).strip()
                        print(f"✅ SUCCESS! Generated: '{text[:80]}...'")
                        print(f"   This model/config works!")
                        break
                else:
                    print(f"❌ Parts array is empty")
                    if finish_reason == 2:
                        print(f"   MAX_TOKENS with empty parts - thinking tokens exhausted budget")
        
    except Exception as e:
        print(f"❌ ERROR: {type(e).__name__}: {e}")
        if "not found" not in str(e).lower() and "not supported" not in str(e).lower():
            import traceback
            traceback.print_exc()

print("\n" + "=" * 80)
print("SOLUTION OPTIONS")
print("=" * 80)
print("Based on Google Cloud docs and test results:")
print("1. Use a model without thinking enabled (gemini-2.0-flash, gemini-pro-latest)")
print("2. Increase max_output_tokens to account for thinking tokens (e.g., 2048)")
print("3. Make prompt even shorter to leave more room for thinking + output")
print("4. Check if thinking_tokens_budget parameter is available in SDK")

