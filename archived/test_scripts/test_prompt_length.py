"""Test prompt length and see what's happening"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import google.generativeai as genai

NEW_API_KEY = "AIzaSyAhMC13D-v4DcX1pMJ1JvtaZHO7gJOmmI4"

genai.configure(api_key=NEW_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')

# Test with different prompt lengths
prompts = [
    {
        "name": "Ultra Short",
        "text": "Generate a follow-up question for: 'How do you iterate over a dictionary?' Response: 'I use .items()'. Generate ONLY the question."
    },
    {
        "name": "Short",
        "text": """Generate a natural follow-up question.

Question: How do you iterate over a dictionary in Python?
Response: I use .items() to iterate.
Focus: Ask for a specific example.

Generate ONLY the question text."""
    },
    {
        "name": "Current (from code)",
        "text": """Generate a natural follow-up question for a technical interview.

Question: How do you iterate over a dictionary in Python?
Response: I use .items() to iterate over both keys and values.
Score: 75/100

Focus: The candidate should provide a specific real-world example or practical application where the candidate has used this concept. They should give concrete code examples.

Rules:
- Generate ONLY a natural question (like a real interviewer)
- DO NOT include "Ask about", "Explore", or meta-instructions
- Be specific and reference what the candidate said

Examples of good questions:
- "Can you walk me through a specific example where you've used this?"
- "What would happen if you modified the dictionary while iterating?"
- "How does this compare to using list comprehensions?"

Generate ONLY the question text, nothing else."""
    }
]

print("=" * 80)
print("TESTING PROMPT LENGTHS")
print("=" * 80)

for prompt_info in prompts:
    print(f"\n{'=' * 80}")
    print(f"Testing: {prompt_info['name']}")
    print(f"{'=' * 80}")
    print(f"Prompt length: {len(prompt_info['text'])} characters")
    
    try:
        response = model.generate_content(
            prompt_info['text'],
            generation_config=genai.types.GenerationConfig(
                temperature=0.8,
                max_output_tokens=1024,
                top_p=0.95
            )
        )
        
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
                        print(f"✅ SUCCESS! Generated: '{text}'")
                        print(f"   Length: {len(text)} characters")
                    else:
                        print(f"❌ Parts exist but no text")
                else:
                    print(f"❌ Parts array is empty")
        else:
            print(f"❌ No candidates")
            
    except Exception as e:
        print(f"❌ ERROR: {type(e).__name__}: {e}")
        if "quota" not in str(e).lower() and "429" not in str(e):
            import traceback
            traceback.print_exc()

print("\n" + "=" * 80)
print("RECOMMENDATION")
print("=" * 80)
print("Use the shortest prompt that still generates good questions.")

