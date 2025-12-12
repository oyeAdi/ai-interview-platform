"""Compare SDK behavior vs REST API to validate exception hypothesis"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import google.generativeai as genai
from backend.config import Config

# Use new API key
NEW_API_KEY = "AIzaSyAhMC13D-v4DcX1pMJ1JvtaZHO7gJOmmI4"

def test_sdk_call():
    """Test SDK call and see what we actually receive"""
    print("=" * 80)
    print("Testing Gemini SDK Call")
    print("=" * 80)
    
    genai.configure(api_key=NEW_API_KEY)
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    prompt = "Say hello in one word."
    
    print(f"\n📤 Making SDK call...")
    print(f"Prompt: {prompt}")
    
    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                max_output_tokens=50
            )
        )
        
        print(f"\n✅ SDK call succeeded!")
        print(f"Response type: {type(response)}")
        print(f"Response object: {response}")
        
        # Try to extract text
        print(f"\n📥 Attempting to extract text...")
        
        # Method 1: response.text
        try:
            text1 = response.text
            print(f"✅ Method 1 (response.text): '{text1}'")
        except Exception as e1:
            print(f"❌ Method 1 failed: {type(e1).__name__}: {e1}")
        
        # Method 2: response.parts
        try:
            if hasattr(response, 'parts'):
                print(f"✅ Has 'parts' attribute: {response.parts}")
                if response.parts:
                    for i, part in enumerate(response.parts):
                        print(f"   Part {i}: {part}")
                        if hasattr(part, 'text'):
                            print(f"   Part {i} text: '{part.text}'")
                else:
                    print(f"   Parts is empty: {response.parts}")
        except Exception as e2:
            print(f"❌ Method 2 failed: {type(e2).__name__}: {e2}")
        
        # Method 3: response.candidates
        try:
            if hasattr(response, 'candidates'):
                print(f"✅ Has 'candidates' attribute: {len(response.candidates) if response.candidates else 0} candidates")
                if response.candidates:
                    candidate = response.candidates[0]
                    print(f"   Candidate: {candidate}")
                    if hasattr(candidate, 'content'):
                        print(f"   Candidate has content: {candidate.content}")
                        if hasattr(candidate.content, 'parts'):
                            parts = candidate.content.parts
                            print(f"   Content has {len(parts) if parts else 0} parts")
                            if parts:
                                for i, part in enumerate(parts):
                                    print(f"     Part {i}: {part}")
                                    if hasattr(part, 'text'):
                                        print(f"     Part {i} text: '{part.text}'")
        except Exception as e3:
            print(f"❌ Method 3 failed: {type(e3).__name__}: {e3}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ SDK call raised exception!")
        print(f"Exception type: {type(e).__name__}")
        print(f"Exception message: {e}")
        print(f"\nThis confirms: We ARE receiving exceptions, not successful responses!")
        import traceback
        traceback.print_exc()
        return False

def test_followup_with_sdk():
    """Test follow-up generation with SDK"""
    print("\n" + "=" * 80)
    print("Testing Follow-up Generation with SDK")
    print("=" * 80)
    
    genai.configure(api_key=NEW_API_KEY)
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    prompt = """You are an AI interviewer. Generate a SINGLE, natural follow-up question.

ORIGINAL QUESTION: How do you iterate over a dictionary in Python?
CANDIDATE'S RESPONSE: I use .items() to iterate.

Generate ONLY the question text. No prefixes, no explanations."""
    
    print(f"\n📤 Making SDK call for follow-up...")
    
    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.8,
                max_output_tokens=200,
                top_p=0.95
            )
        )
        
        print(f"\n✅ SDK call succeeded!")
        
        # Check finish reason
        if hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
            if hasattr(candidate, 'finish_reason'):
                print(f"Finish reason: {candidate.finish_reason}")
                if candidate.finish_reason != "STOP":
                    print(f"⚠️  WARNING: Finish reason is {candidate.finish_reason}, not STOP!")
                    print(f"This means the response was truncated or blocked!")
        
        # Extract text
        try:
            if hasattr(response, 'candidates') and response.candidates:
                candidate = response.candidates[0]
                print(f"   Candidate finish_reason: {candidate.finish_reason}")
                if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                    parts = candidate.content.parts
                    print(f"   Parts count: {len(parts) if parts else 0}")
                    if parts:
                        text_parts = []
                        for i, part in enumerate(parts):
                            print(f"     Part {i}: {part}")
                            if hasattr(part, 'text'):
                                print(f"     Part {i} has text: {part.text}")
                                if part.text:
                                    text_parts.append(part.text)
                        if text_parts:
                            text = ''.join(text_parts).strip()
                            print(f"\n✅ Extracted text: '{text}'")
                            print(f"   Text length: {len(text)}")
                            return True, text
                        else:
                            print(f"\n❌ No text in parts!")
                            print(f"Parts: {parts}")
                            return False, None
                    else:
                        print(f"\n❌ Parts is empty!")
                        return False, None
        except Exception as e:
            print(f"\n❌ Error extracting text: {e}")
            return False, None
        
        return False, None
        
    except Exception as e:
        print(f"\n❌ SDK call raised exception!")
        print(f"Exception type: {type(e).__name__}")
        print(f"Exception message: {e}")
        import traceback
        traceback.print_exc()
        return False, None

if __name__ == "__main__":
    print("\n🧪 Validating Exception Hypothesis\n")
    
    # Test 1: Simple SDK call
    success = test_sdk_call()
    
    # Test 2: Follow-up generation
    if success:
        test_followup_with_sdk()
    
    print("\n" + "=" * 80)
    print("CONCLUSION")
    print("=" * 80)
    print("If we see exceptions above, it confirms:")
    print("1. SDK is raising exceptions instead of returning error responses")
    print("2. We need to catch and handle these exceptions properly")
    print("3. We should check finish_reason to see if response was truncated")

