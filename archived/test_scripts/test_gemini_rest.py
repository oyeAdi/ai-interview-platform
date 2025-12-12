"""Simple REST API test for Gemini 3"""
import requests
import json

# New API key
API_KEY = "AIzaSyAhMC13D-v4DcX1pMJ1JvtaZHO7gJOmmI4"

# Gemini API endpoint
# Try Gemini 3 models first
MODELS_TO_TEST = [
    "gemini-3-pro-preview",
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-pro-latest"
]

def test_gemini_rest_api(model_name):
    """Test Gemini API via REST"""
    print("=" * 80)
    print(f"Testing Gemini Model: {model_name}")
    print("=" * 80)
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={API_KEY}"
    
    headers = {
        "Content-Type": "application/json"
    }
    
    payload = {
        "contents": [{
            "parts": [{
                "text": "Say hello in one word."
            }]
        }],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 50
        }
    }
    
    print(f"\n📤 Making REST API call...")
    print(f"URL: {url[:80]}...")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        
        print(f"\n📥 Response Status Code: {response.status_code}")
        print(f"📥 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("\n✅ SUCCESS! Response received:")
            response_data = response.json()
            print(json.dumps(response_data, indent=2))
            
            # Extract text from response
            try:
                if "candidates" in response_data and response_data["candidates"]:
                    candidate = response_data["candidates"][0]
                    if "content" in candidate and "parts" in candidate["content"]:
                        parts = candidate["content"]["parts"]
                        if parts and "text" in parts[0]:
                            text = parts[0]["text"]
                            print(f"\n✅ Extracted Text: '{text}'")
                            return True, text
                
                print("\n⚠️  Response structure different than expected")
                print(f"Full response: {json.dumps(response_data, indent=2)}")
                return True, None
                
            except Exception as e:
                print(f"\n❌ Error extracting text: {e}")
                return True, None
                
        else:
            print(f"\n❌ ERROR: Status {response.status_code}")
            print(f"Response: {response.text}")
            return False, None
            
    except requests.exceptions.RequestException as e:
        print(f"\n❌ Request Exception: {e}")
        return False, None
    except Exception as e:
        print(f"\n❌ Unexpected Error: {e}")
        import traceback
        traceback.print_exc()
        return False, None

def test_followup_generation_rest():
    """Test follow-up question generation via REST"""
    print("\n" + "=" * 80)
    print("Testing Follow-up Question Generation via REST")
    print("=" * 80)
    
    model_name = "gemini-2.5-flash"  # Start with this one
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={API_KEY}"
    
    headers = {
        "Content-Type": "application/json"
    }
    
    prompt = """You are an AI interviewer conducting a technical interview. Generate a SINGLE, natural, conversational follow-up question.

ORIGINAL QUESTION:
How do you iterate over a dictionary in Python?

CANDIDATE'S RESPONSE:
I use .items() to iterate over both keys and values.

EVALUATION SCORES:
- Overall: 75/100
- Completeness: 70/100
- Depth: 65/100

WHAT TO EXPLORE (based on evaluation):
The candidate should provide a specific real-world example or practical application where the candidate has used this concept. They should give concrete code examples.

CRITICAL RULES:
1. Generate ONLY a natural, conversational question - like a real human interviewer would ask
2. DO NOT include phrases like "Ask about", "Can you elaborate on that? Ask about", "Explore", etc.
3. DO NOT repeat the strategy instruction text
4. DO NOT include meta-instructions in your question
5. The question should feel natural and flow from the candidate's response
6. Be specific and concrete - reference what the candidate said

Generate ONLY the question text. No quotes, no prefixes, no explanations, no meta-instructions. Just a natural question that a human interviewer would ask.
"""
    
    payload = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }],
        "generationConfig": {
            "temperature": 0.8,
            "maxOutputTokens": 200,
            "topP": 0.95
        }
    }
    
    print(f"\n📤 Making REST API call for follow-up generation...")
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        
        print(f"\n📥 Response Status Code: {response.status_code}")
        
        if response.status_code == 200:
            response_data = response.json()
            
            # Extract text
            if "candidates" in response_data and response_data["candidates"]:
                candidate = response_data["candidates"][0]
                if "content" in candidate and "parts" in candidate["content"]:
                    parts = candidate["content"]["parts"]
                    if parts and "text" in parts[0]:
                        text = parts[0]["text"].strip()
                        print(f"\n✅ Generated Follow-up: '{text}'")
                        return True, text
            
            print(f"\n⚠️  Unexpected response structure:")
            print(json.dumps(response_data, indent=2))
            return False, None
        else:
            print(f"\n❌ ERROR: Status {response.status_code}")
            print(f"Response: {response.text}")
            return False, None
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False, None

if __name__ == "__main__":
    print("\n🧪 Testing Gemini API via REST\n")
    
    # Test 1: Try different models
    success = False
    for model in MODELS_TO_TEST:
        success, text = test_gemini_rest_api(model)
        if success:
            print(f"\n✅ Model {model} works!")
            break
        else:
            print(f"\n❌ Model {model} failed, trying next...")
    
    if not success:
        print("\n❌ All models failed!")
    else:
        # Test 2: Test follow-up generation
        test_followup_generation_rest()

