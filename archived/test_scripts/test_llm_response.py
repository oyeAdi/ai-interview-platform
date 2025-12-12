"""Test if we're getting responses from LLM"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.llm.gemini_client import GeminiClient
from backend.config import Config

def test_llm_response():
    """Test if LLM returns responses"""
    print("=" * 80)
    print("TESTING LLM RESPONSE")
    print("=" * 80)
    
    print(f"\nAPI Key: {Config.GEMINI_API_KEY[:20]}...")
    print(f"Model: gemini-2.5-flash")
    
    try:
        client = GeminiClient()
        print("✅ GeminiClient initialized")
        
        # Test 1: Simple call
        print("\n" + "-" * 80)
        print("TEST 1: Simple LLM Call")
        print("-" * 80)
        
        question = {
            "id": "test1",
            "text": "How do you iterate over a dictionary in Python?",
            "type": "theoretical"
        }
        
        response = "I use .items() to iterate over both keys and values."
        
        evaluation = {
            "overall_score": 75,
            "deterministic_scores": {
                "completeness": 70,
                "depth": 65
            }
        }
        
        strategy_guidance = {
            "strategy_guidance": "The candidate should provide a specific real-world example or practical application where the candidate has used this concept. They should give concrete code examples.",
            "reason": "Response needs deeper exploration",
            "focus_areas": ["examples"],
            "approach": "Ask for examples"
        }
        
        context = {}
        
        print(f"\n📤 Calling LLM to generate follow-up...")
        print(f"Question: {question['text']}")
        print(f"Response: {response}")
        
        try:
            followup = client.generate_followup(
                question,
                response,
                evaluation,
                strategy_guidance,
                context
            )
            
            print(f"\n✅ SUCCESS! LLM returned response:")
            print(f"   Follow-up: '{followup}'")
            print(f"   Length: {len(followup)} characters")
            
            # Check if it's a fallback or LLM-generated
            fallback_patterns = [
                "Can you elaborate on that with a specific example?",
                "How does this concept relate to other Python features",
                "Can you explain this in more detail with a practical example",
                "Can you provide an example of an edge case"
            ]
            
            is_fallback = any(pattern in followup for pattern in fallback_patterns)
            
            if is_fallback:
                print(f"\n⚠️  This appears to be a FALLBACK question (generic pattern)")
                print(f"   This means LLM call failed or returned empty parts")
            else:
                print(f"\n✅ This appears to be an LLM-GENERATED question (unique and specific)")
            
            return True, followup
            
        except Exception as e:
            print(f"\n❌ ERROR calling LLM:")
            print(f"   Exception: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            return False, None
            
    except Exception as e:
        print(f"\n❌ ERROR initializing GeminiClient:")
        print(f"   Exception: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False, None

def test_direct_sdk_call():
    """Test direct SDK call to see raw response"""
    print("\n" + "=" * 80)
    print("TEST 2: Direct SDK Call (Raw Response)")
    print("=" * 80)
    
    import google.generativeai as genai
    
    genai.configure(api_key=Config.GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    prompt = "Generate a natural follow-up question for a technical interview.\n\nQuestion: How do you iterate over a dictionary in Python?\nResponse: I use .items() to iterate.\n\nGenerate ONLY the question text, nothing else."
    
    print(f"\n📤 Making direct SDK call...")
    print(f"Prompt length: {len(prompt)} characters")
    
    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.8,
                max_output_tokens=1024,
                top_p=0.95
            )
        )
        
        print(f"\n✅ SDK call succeeded!")
        print(f"Response type: {type(response)}")
        
        # Check finish reason
        if hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
            if hasattr(candidate, 'finish_reason'):
                finish_reason = candidate.finish_reason
                finish_reason_map = {1: "STOP", 2: "MAX_TOKENS", 3: "SAFETY", 4: "RECITATION"}
                print(f"Finish reason: {finish_reason} ({finish_reason_map.get(finish_reason, 'UNKNOWN')})")
                
                if finish_reason == 2:
                    print(f"⚠️  WARNING: Response was truncated (MAX_TOKENS)")
                elif finish_reason == 1:
                    print(f"✅ Response completed successfully (STOP)")
        
        # Extract text
        if hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
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
                        print(f"\n✅ Extracted text: '{text}'")
                        print(f"   Length: {len(text)} characters")
                        return True, text
                    else:
                        print(f"\n❌ Parts exist but no text found")
                        return False, None
                else:
                    print(f"\n❌ Parts array is empty!")
                    return False, None
        
        return False, None
        
    except Exception as e:
        print(f"\n❌ ERROR in SDK call:")
        print(f"   Exception: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False, None

if __name__ == "__main__":
    print("\n🧪 Testing LLM Response Generation\n")
    
    # Test 1: Using our wrapper
    success1, followup1 = test_llm_response()
    
    # Test 2: Direct SDK call
    success2, followup2 = test_direct_sdk_call()
    
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Test 1 (Wrapper): {'✅ SUCCESS' if success1 else '❌ FAILED'}")
    if success1:
        print(f"   Response: '{followup1[:80]}...'")
    
    print(f"Test 2 (Direct SDK): {'✅ SUCCESS' if success2 else '❌ FAILED'}")
    if success2:
        print(f"   Response: '{followup2[:80]}...'")
    
    if success1 and success2:
        print("\n✅ LLM is working! We're getting responses.")
    elif success2:
        print("\n⚠️  Direct SDK works, but wrapper might have issues.")
    else:
        print("\n❌ LLM is not returning responses. Check API key and quota.")

