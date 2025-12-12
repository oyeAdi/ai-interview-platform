"""Test if thinking tokens are causing MAX_TOKENS issue"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import google.generativeai as genai
from backend.config import Config

# Use new API key
NEW_API_KEY = "AIzaSyAhMC13D-v4DcX1pMJ1JvtaZHO7gJOmmI4"

genai.configure(api_key=NEW_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')

print("=" * 80)
print("TESTING THINKING TOKENS HYPOTHESIS")
print("=" * 80)

# According to Google Cloud docs, thinking tokens count toward total budget
# For Gemini 2.5 Pro/Flash, thinking might be enabled by default
# This could explain why we get MAX_TOKENS even with high max_output_tokens

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

print(f"\nPrompt length: {len(prompt)} characters")
print(f"max_output_tokens: 1024")

try:
    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=0.8,
            max_output_tokens=1024,
            top_p=0.95
        )
    )
    
    print(f"\n✅ Response received")
    
    # Check usage metadata for thinking tokens
    if hasattr(response, 'usage_metadata'):
        usage = response.usage_metadata
        print(f"\n📊 Token Usage:")
        print(f"   Prompt tokens: {usage.prompt_token_count if hasattr(usage, 'prompt_token_count') else 'N/A'}")
        print(f"   Candidates tokens: {usage.candidates_token_count if hasattr(usage, 'candidates_token_count') else 'N/A'}")
        print(f"   Total tokens: {usage.total_token_count if hasattr(usage, 'total_token_count') else 'N/A'}")
        
        # Check for thinking tokens
        if hasattr(usage, 'thoughts_token_count'):
            print(f"   ⚠️  THINKING TOKENS: {usage.thoughts_token_count}")
            print(f"   This explains MAX_TOKENS! Thinking tokens count toward budget!")
        
        # Check prompt tokens details
        if hasattr(usage, 'prompt_tokens_details'):
            print(f"   Prompt tokens details: {usage.prompt_tokens_details}")
    
    if response.candidates:
        candidate = response.candidates[0]
        finish_reason = candidate.finish_reason
        finish_map = {1: "STOP", 2: "MAX_TOKENS", 3: "SAFETY", 4: "RECITATION"}
        
        print(f"\nFinish reason: {finish_reason} ({finish_map.get(finish_reason, 'UNKNOWN')})")
        
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
                    print(f"\n✅ Generated: '{text}'")
                else:
                    print(f"\n❌ Parts exist but no text")
            else:
                print(f"\n❌ Parts array is empty")
                
                if finish_reason == 2:
                    print(f"\n🔍 ROOT CAUSE IDENTIFIED:")
                    print(f"   finish_reason = MAX_TOKENS (2)")
                    print(f"   parts = [] (empty)")
                    print(f"   This happens when thinking tokens exhaust the budget")
                    print(f"   before any output tokens are generated!")
        
except Exception as e:
    print(f"\n❌ ERROR: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)
print("SOLUTION")
print("=" * 80)
print("According to Google Cloud docs:")
print("1. Thinking tokens count toward total token budget")
print("2. For Gemini 2.5 Pro/Flash, thinking may be enabled by default")
print("3. We need to either:")
print("   - Increase max_output_tokens significantly (to account for thinking)")
print("   - Disable thinking if possible")
print("   - Use a model without thinking enabled")

