"""Debug script to see actual response structure from Gemini"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import google.generativeai as genai
from backend.config import Config

def debug_response_structure():
    """Debug the actual response structure from Gemini"""
    
    print("=" * 80)
    print("DEBUGGING GEMINI RESPONSE STRUCTURE")
    print("=" * 80)
    
    genai.configure(api_key=Config.GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    prompt = "Generate a single, natural follow-up question for a technical interview. The original question was about Python dictionaries. The candidate said: 'I iterate using .items()'. Generate ONLY the question, nothing else."
    
    print(f"\n📤 Sending prompt...")
    print(f"Prompt: {prompt[:100]}...\n")
    
    try:
        response = model.generate_content(prompt)
        
        print("=" * 80)
        print("RESPONSE OBJECT STRUCTURE")
        print("=" * 80)
        
        print(f"\nType: {type(response)}")
        print(f"Dir: {[attr for attr in dir(response) if not attr.startswith('_')]}")
        
        # Try different access methods
        print("\n" + "-" * 80)
        print("ATTEMPTING TO EXTRACT TEXT")
        print("-" * 80)
        
        # Method 1: Direct text
        try:
            text1 = response.text
            print(f"✅ Method 1 (response.text): {text1}")
        except Exception as e:
            print(f"❌ Method 1 failed: {e}")
        
        # Method 2: Parts
        try:
            if hasattr(response, 'parts'):
                parts = response.parts
                print(f"✅ Method 2 (response.parts): {parts}")
                if parts:
                    for i, part in enumerate(parts):
                        print(f"   Part {i}: {type(part)}, dir: {[attr for attr in dir(part) if not attr.startswith('_')]}")
                        if hasattr(part, 'text'):
                            print(f"   Part {i} text: {part.text}")
        except Exception as e:
            print(f"❌ Method 2 failed: {e}")
        
        # Method 3: Candidates
        try:
            if hasattr(response, 'candidates'):
                candidates = response.candidates
                print(f"✅ Method 3 (response.candidates): {len(candidates) if candidates else 0} candidates")
                if candidates:
                    for i, candidate in enumerate(candidates):
                        print(f"   Candidate {i}: {type(candidate)}")
                        print(f"   Candidate {i} dir: {[attr for attr in dir(candidate) if not attr.startswith('_')]}")
                        if hasattr(candidate, 'content'):
                            content = candidate.content
                            print(f"   Content: {type(content)}")
                            print(f"   Content dir: {[attr for attr in dir(content) if not attr.startswith('_')]}")
                            if hasattr(content, 'parts'):
                                content_parts = content.parts
                                print(f"   Content parts: {content_parts}")
                                for j, part in enumerate(content_parts):
                                    print(f"     Part {j}: {type(part)}")
                                    if hasattr(part, 'text'):
                                        print(f"     Part {j} text: {part.text}")
        except Exception as e:
            print(f"❌ Method 3 failed: {e}")
        
        # Method 4: Try to convert to string
        try:
            str_response = str(response)
            print(f"✅ Method 4 (str(response)): {str_response[:200]}...")
        except Exception as e:
            print(f"❌ Method 4 failed: {e}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_response_structure()

