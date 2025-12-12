"""Test with new API key directly"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import google.generativeai as genai

# New API key
NEW_API_KEY = "AIzaSyAhMC13D-v4DcX1pMJ1JvtaZHO7gJOmmI4"

print("=" * 80)
print("TESTING WITH NEW API KEY")
print("=" * 80)

print(f"\nAPI Key: {NEW_API_KEY[:20]}...")

genai.configure(api_key=NEW_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')

# Simple test
print("\n📤 Test 1: Simple call...")
try:
    response = model.generate_content(
        "Say hello in one word.",
        generation_config=genai.types.GenerationConfig(
            max_output_tokens=50
        )
    )
    
    print(f"✅ SUCCESS!")
    print(f"Response: {response.text}")
    print(f"Finish reason: {response.candidates[0].finish_reason if response.candidates else 'N/A'}")
    
except Exception as e:
    print(f"❌ ERROR: {type(e).__name__}: {e}")
    if "quota" in str(e).lower() or "429" in str(e):
        print(f"\n⚠️  Quota exceeded. Wait for quota reset or check billing.")
    else:
        import traceback
        traceback.print_exc()

# Follow-up generation test
print("\n📤 Test 2: Follow-up generation...")
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

try:
    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=0.8,
            max_output_tokens=1024,
            top_p=0.95
        )
    )
    
    print(f"✅ SUCCESS!")
    
    # Check finish reason
    if response.candidates:
        candidate = response.candidates[0]
        finish_reason = candidate.finish_reason
        finish_map = {1: "STOP", 2: "MAX_TOKENS", 3: "SAFETY", 4: "RECITATION"}
        print(f"Finish reason: {finish_reason} ({finish_map.get(finish_reason, 'UNKNOWN')})")
        
        # Extract text
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
                    print(f"\n✅ Generated Follow-up: '{text}'")
                    print(f"   Length: {len(text)} characters")
                    print(f"   ✅ LLM IS WORKING! We're getting responses!")
                else:
                    print(f"\n❌ Parts exist but no text found")
            else:
                print(f"\n❌ Parts array is empty")
        else:
            print(f"\n❌ No content.parts found")
    else:
        print(f"\n❌ No candidates in response")
        
except Exception as e:
    print(f"❌ ERROR: {type(e).__name__}: {e}")
    if "quota" in str(e).lower() or "429" in str(e):
        print(f"\n⚠️  Quota exceeded. This API key has also hit quota limits.")
        print(f"   Wait for quota reset (usually 24 hours) or upgrade plan.")
    else:
        import traceback
        traceback.print_exc()

print("\n" + "=" * 80)
print("CONCLUSION")
print("=" * 80)
print("If we see '✅ LLM IS WORKING!' above, the LLM is returning responses.")
print("If we see quota errors, the API key is valid but quota is exhausted.")

