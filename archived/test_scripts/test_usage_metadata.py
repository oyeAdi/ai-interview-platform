"""Check usage metadata to see thinking tokens"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import google.generativeai as genai

NEW_API_KEY = "AIzaSyAhMC13D-v4DcX1pMJ1JvtaZHO7gJOmmI4"

genai.configure(api_key=NEW_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')

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
print("ANALYZING USAGE METADATA FOR THINKING TOKENS")
print("=" * 80)

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
    
    # Check usage metadata
    if hasattr(response, 'usage_metadata'):
        usage = response.usage_metadata
        print(f"\n📊 USAGE METADATA:")
        print(f"   Type: {type(usage)}")
        print(f"   Attributes: {[attr for attr in dir(usage) if not attr.startswith('_')]}")
        
        # Try to access all possible token counts
        token_counts = {}
        for attr in dir(usage):
            if 'token' in attr.lower() and not attr.startswith('_'):
                try:
                    value = getattr(usage, attr)
                    token_counts[attr] = value
                    print(f"   {attr}: {value}")
                except:
                    pass
        
        # Check specifically for thinking tokens
        if hasattr(usage, 'thoughts_token_count'):
            thinking_tokens = usage.thoughts_token_count
            print(f"\n⚠️  THINKING TOKENS FOUND: {thinking_tokens}")
            print(f"   This confirms thinking is enabled!")
            print(f"   Thinking tokens count toward total budget!")
            
            if thinking_tokens > 0:
                print(f"\n🔍 ROOT CAUSE:")
                print(f"   Thinking tokens: {thinking_tokens}")
                print(f"   These tokens are used BEFORE output generation")
                print(f"   If thinking tokens exhaust budget, we get MAX_TOKENS with empty parts")
        else:
            print(f"\n✅ No thinking tokens attribute found")
            print(f"   This might mean thinking is not enabled for this model/API")
    
    # Check finish reason
    if response.candidates:
        candidate = response.candidates[0]
        finish_reason = candidate.finish_reason
        finish_map = {1: "STOP", 2: "MAX_TOKENS", 3: "SAFETY", 4: "RECITATION"}
        
        print(f"\n📋 RESPONSE STATUS:")
        print(f"   Finish reason: {finish_reason} ({finish_map.get(finish_reason, 'UNKNOWN')})")
        
        if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
            parts = candidate.content.parts
            print(f"   Parts count: {len(parts) if parts else 0}")
            
            if parts and len(parts) > 0:
                text_parts = []
                for part in parts:
                    if hasattr(part, 'text') and part.text:
                        text_parts.append(part.text)
                if text_parts:
                    text = ''.join(text_parts).strip()
                    print(f"   ✅ Text extracted: '{text[:60]}...'")
                    print(f"   Length: {len(text)} characters")
                    
                    if finish_reason == 2:
                        print(f"\n⚠️  Note: finish_reason = MAX_TOKENS but we got text")
                        print(f"   This means response was truncated but still has content")
                else:
                    print(f"   ❌ Parts exist but no text")
            else:
                print(f"   ❌ Parts array is empty")
                if finish_reason == 2:
                    print(f"\n🔍 THIS IS THE PROBLEM:")
                    print(f"   finish_reason = MAX_TOKENS")
                    print(f"   parts = [] (empty)")
                    print(f"   This happens when thinking tokens exhaust budget")
                    print(f"   BEFORE any output tokens are generated!")
        
except Exception as e:
    print(f"\n❌ ERROR: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)
print("CONCLUSION")
print("=" * 80)
print("According to Google Cloud docs:")
print("- Thinking tokens count toward total token budget")
print("- For Gemini 2.5 Pro/Flash, thinking may be enabled by default")
print("- When thinking tokens exhaust budget before output, we get:")
print("  finish_reason = MAX_TOKENS, parts = [] (empty)")
print("\nSolution: Increase max_output_tokens to account for thinking tokens")

