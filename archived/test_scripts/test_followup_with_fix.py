"""Test follow-up generation with increased max_output_tokens and refined prompt"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.interview_controller import InterviewController

print("=" * 80)
print("Testing Follow-up Generation with Fixes Applied")
print("=" * 80)

controller = InterviewController(language="python")
question_data = controller.get_next_question()

if question_data:
    question_id = question_data.get("question_id")
    print(f"\nQuestion ID: {question_id}")
    print(f"Question: {question_data.get('text')[:100]}...")
    
    # Realistic response
    response = "I iterate over dictionaries using .items() which returns an iterable of (key, value) tuples. This is efficient and Pythonic. I can also use .keys() or .values() for specific needs."
    
    print(f"\nCandidate Response: {response}")
    print("\nProcessing response...")
    
    try:
        result = controller.process_response(response, response_type="initial")
        
        followup = result.get("followup")
        if followup:
            print(f"\n✅ SUCCESS! Generated Follow-up:")
            print(f"  {followup.get('text')}")
            print(f"\nStrategy: {result.get('strategy', {}).get('name')}")
            print(f"Score: {result.get('evaluation', {}).get('overall_score', 0)}/100")
            
            # Check if it's from LLM or fallback
            followup_text = followup.get('text', '')
            if any(phrase in followup_text for phrase in ["Can you elaborate on that with a specific example", "How does this concept relate", "Can you explain this in more detail"]):
                print(f"\n⚠️  This appears to be a fallback question (generic pattern detected)")
            else:
                print(f"\n✅ This appears to be an LLM-generated question (unique and specific)")
        else:
            print("\n❌ No follow-up generated")
            
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

