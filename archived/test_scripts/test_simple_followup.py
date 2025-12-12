"""Simple test for follow-up generation"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.interview_controller import InterviewController

# Test with a simple scenario
print("=" * 80)
print("SIMPLE FOLLOW-UP GENERATION TEST")
print("=" * 80)

controller = InterviewController(language="python")
question_data = controller.get_next_question()

if question_data:
    question_id = question_data.get("question_id")
    print(f"\nQuestion ID: {question_id}")
    print(f"Question: {question_data.get('text')[:100]}...")
    
    # Simple response
    response = "I iterate over dictionaries using .items() which returns key-value pairs. This is the most common way to iterate."
    
    print(f"\nCandidate Response: {response}")
    print("\nProcessing response...")
    
    try:
        result = controller.process_response(response, response_type="initial")
        
        followup = result.get("followup")
        if followup:
            print(f"\nSUCCESS! Generated Follow-up:")
            print(f"  {followup.get('text')}")
            print(f"\nStrategy: {result.get('strategy', {}).get('name')}")
            print(f"Score: {result.get('evaluation', {}).get('overall_score', 0)}/100")
        else:
            print("\nNo follow-up generated")
            
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()

