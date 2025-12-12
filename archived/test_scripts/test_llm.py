"""Test script to verify LLM connectivity and follow-up generation"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.llm.gemini_client import GeminiClient
from backend.config import Config

def test_llm_connection():
    """Test basic LLM connectivity"""
    print("=" * 60)
    print("TEST 1: Basic LLM Connection")
    print("=" * 60)
    
    try:
        client = GeminiClient()
        print("✅ GeminiClient initialized successfully")
        print(f"✅ API Key configured: {Config.GEMINI_API_KEY[:10]}...")
        return client
    except Exception as e:
        print(f"❌ Error initializing GeminiClient: {e}")
        return None

def test_simple_generation(client):
    """Test simple text generation"""
    print("\n" + "=" * 60)
    print("TEST 2: Simple Text Generation")
    print("=" * 60)
    
    try:
        prompt = "Generate a single, natural follow-up question for a technical interview. The original question was about Python dictionaries. The candidate said: 'I iterate using .items()'. Generate ONLY the question, nothing else."
        
        print(f"\n📤 Sending prompt to LLM...")
        print(f"Prompt: {prompt[:100]}...")
        
        response = client.model.generate_content(prompt)
        result = response.text.strip()
        
        print(f"\n✅ LLM Response received:")
        print(f"Response: {result}")
        print(f"Response length: {len(result)} characters")
        
        return result
    except Exception as e:
        print(f"❌ Error generating content: {e}")
        import traceback
        traceback.print_exc()
        return None

def test_followup_generation(client):
    """Test actual follow-up generation with real data"""
    print("\n" + "=" * 60)
    print("TEST 3: Follow-up Generation (Real Method)")
    print("=" * 60)
    
    # Simulate a real scenario
    question = {
        "id": "q1",
        "text": "How do you iterate over a dictionary in Python?",
        "type": "theoretical",
        "topic": "dictionaries"
    }
    
    response = "I use .items() to iterate over both keys and values."
    
    evaluation = {
        "overall_score": 75,
        "deterministic_scores": {
            "completeness": 70,
            "depth": 65,
            "clarity": 80
        }
    }
    
    strategy_guidance = {
        "reason": "Response shows good understanding but could benefit from deeper exploration.",
        "focus_areas": ["advanced applications"],
        "approach": "Ask a follow-up that builds on the candidate's answer",
        "tone": "encouraging",
        "strategy_guidance": "The candidate should provide a specific real-world example or practical application where the candidate has used this concept. They should give concrete code examples."
    }
    
    context = {
        "interview_context": {
            "round_summaries": []
        }
    }
    
    print(f"\n📤 Question: {question['text']}")
    print(f"📤 Candidate Response: {response}")
    print(f"📤 Strategy Guidance: {strategy_guidance['strategy_guidance']}")
    
    try:
        result = client.generate_followup(
            question,
            response,
            evaluation,
            strategy_guidance,
            context
        )
        
        print(f"\n✅ Generated Follow-up:")
        print(f"Result: {result}")
        print(f"Length: {len(result)} characters")
        
        # Check for problematic patterns
        problematic_patterns = [
            "Ask about",
            "Ask for",
            "Ask specifically",
            "Explore",
            "Assess",
            "Request",
            "Can you elaborate on that? Ask"
        ]
        
        found_issues = []
        for pattern in problematic_patterns:
            if pattern.lower() in result.lower():
                found_issues.append(pattern)
        
        if found_issues:
            print(f"\n⚠️  WARNING: Found problematic patterns: {found_issues}")
        else:
            print(f"\n✅ No problematic patterns found!")
        
        return result
    except Exception as e:
        print(f"❌ Error generating follow-up: {e}")
        import traceback
        traceback.print_exc()
        return None

def test_prompt_construction(client):
    """Test what prompt is actually being constructed"""
    print("\n" + "=" * 60)
    print("TEST 4: Prompt Construction Analysis")
    print("=" * 60)
    
    question = {
        "text": "How do you iterate over a dictionary in Python?"
    }
    
    response = "I use .items() to iterate."
    
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
    
    # Manually construct the prompt as the method does
    strategy_instruction = strategy_guidance.get("strategy_guidance", "")
    reason = strategy_guidance.get("reason", "")
    focus_areas = strategy_guidance.get("focus_areas", [])
    approach = strategy_guidance.get("approach", "")
    
    # Extract key information from strategy guidance
    strategy_intent = strategy_instruction
    strategy_intent = strategy_intent.replace("Ask about", "").replace("Ask for", "").replace("Explore", "").replace("Assess", "")
    strategy_intent = strategy_intent.replace("Ask specifically about", "").replace("Request", "").replace("Focus on", "")
    strategy_intent = strategy_intent.strip()
    
    prompt = f"""You are an AI interviewer conducting a technical interview. Generate a SINGLE, natural, conversational follow-up question.

ORIGINAL QUESTION:
{question.get("text", "")}

CANDIDATE'S RESPONSE:
{response[:500]}

EVALUATION SCORES:
- Overall: {evaluation.get("overall_score", 0)}/100
- Completeness: {evaluation.get("deterministic_scores", {}).get("completeness", 0)}/100
- Depth: {evaluation.get("deterministic_scores", {}).get("depth", 0)}/100

WHAT TO EXPLORE (based on evaluation):
{strategy_intent}

CRITICAL RULES:
1. Generate ONLY a natural, conversational question - like a real human interviewer would ask
2. DO NOT include phrases like "Ask about", "Can you elaborate on that? Ask about", "Explore", etc.
3. DO NOT repeat the strategy instruction text
4. DO NOT include meta-instructions in your question
5. The question should feel natural and flow from the candidate's response
6. Be specific and concrete - reference what the candidate said

GOOD EXAMPLES:
- "Can you walk me through a specific example where you've used this in a real project?"
- "What would happen if you tried to modify the dictionary while iterating over it?"
- "How does this approach compare to using list comprehensions?"
- "Can you explain how you would handle an edge case where the input is empty?"

BAD EXAMPLES (DO NOT DO THIS):
- "Can you elaborate on that? Ask about related topics"
- "Can you elaborate on that? Ask specifically about for loop or related concepts"
- "Can you elaborate on that? Present an edge case"
- "Ask about how this relates to other Python features"
- Any question that includes instructional text

Generate ONLY the question text. No quotes, no prefixes, no explanations, no meta-instructions. Just a natural question that a human interviewer would ask.
"""
    
    print("\n📋 Constructed Prompt:")
    print("-" * 60)
    print(prompt)
    print("-" * 60)
    
    print(f"\n📊 Prompt Analysis:")
    print(f"Total length: {len(prompt)} characters")
    print(f"Strategy intent (after cleaning): {strategy_intent[:100]}...")
    
    # Check if problematic patterns exist in prompt
    if "Ask about" in prompt or "Ask for" in prompt:
        print("⚠️  WARNING: Prompt still contains 'Ask about' or 'Ask for' patterns")
    
    return prompt

if __name__ == "__main__":
    print("\n🧪 Testing LLM Connectivity and Follow-up Generation\n")
    
    # Test 1: Basic connection
    client = test_llm_connection()
    if not client:
        print("\n❌ Cannot proceed - LLM connection failed")
        sys.exit(1)
    
    # Test 2: Simple generation
    simple_result = test_simple_generation(client)
    
    # Test 3: Actual follow-up generation
    followup_result = test_followup_generation(client)
    
    # Test 4: Prompt analysis
    prompt = test_prompt_construction(client)
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"✅ LLM Connection: {'Working' if client else 'Failed'}")
    print(f"✅ Simple Generation: {'Working' if simple_result else 'Failed'}")
    print(f"✅ Follow-up Generation: {'Working' if followup_result else 'Failed'}")
    
    if followup_result:
        print(f"\n📝 Generated Follow-up: {followup_result}")
        if any(pattern in followup_result for pattern in ["Ask about", "Ask for", "Ask specifically"]):
            print("⚠️  ISSUE: Follow-up still contains problematic patterns!")
        else:
            print("✅ Follow-up looks good!")

