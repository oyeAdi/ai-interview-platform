"""Simulate complete follow-up question generation using backend API"""
import sys
import os
import json
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.interview_controller import InterviewController
from backend.core.question_manager import QuestionManager
from backend.evaluation.evaluator import Evaluator
from backend.strategies.strategy_factory import StrategyFactory
from backend.llm.gemini_client import GeminiClient

def simulate_followup_generation():
    """Simulate the complete flow for generating a follow-up question"""
    
    print("=" * 80)
    print("SIMULATING FOLLOW-UP QUESTION GENERATION")
    print("=" * 80)
    
    # Step 1: Initialize Interview Controller (Python language)
    print("\n📋 Step 1: Initializing Interview Controller (Python)")
    print("-" * 80)
    controller = InterviewController(language="python")
    print(f"✅ Controller initialized")
    print(f"   Language: {controller.language}")
    print(f"   Session ID: {controller.context_manager.session_id}")
    
    # Step 2: Get a random question
    print("\n📋 Step 2: Selecting a Random Question")
    print("-" * 80)
    question_data = controller.get_next_question()
    if not question_data:
        print("❌ No question available")
        return
    
    # Extract the actual question object
    question_id = question_data.get("question_id")
    question_manager = QuestionManager("python")
    question = question_manager.get_question_by_id(question_id)
    
    print(f"✅ Question Selected:")
    print(f"   ID: {question.get('id')}")
    print(f"   Type: {question.get('type')}")
    print(f"   Topic: {question.get('topic', 'N/A')}")
    print(f"   Question: {question.get('text')}")
    
    # Step 3: Simulate candidate response
    print("\n📋 Step 3: Simulating Candidate Response")
    print("-" * 80)
    
    # Generate a realistic response based on question type
    if question.get('type') == 'theoretical':
        candidate_response = "I iterate over dictionaries using the .items() method, which returns key-value pairs. I can also use .keys() for just keys or .values() for just values. The .items() method is useful when I need both the key and value in my iteration."
    elif question.get('type') == 'multiple_choice':
        candidate_response = "I think options A and C are correct because dictionaries are mutable and support key-value pairs. Option A is correct because you can add new items, and option C is correct because keys must be hashable."
    else:
        candidate_response = "I would use a dictionary comprehension to create a new dictionary. For example, I can filter items or transform values during the creation process."
    
    print(f"✅ Candidate Response:")
    print(f"   {candidate_response}")
    
    # Step 4: Process the response (this includes evaluation, strategy selection, and follow-up generation)
    print("\n📋 Step 4: Processing Response (Evaluation → Strategy → Follow-up)")
    print("-" * 80)
    
    try:
        result = controller.process_response(candidate_response, response_type="initial")
        
        # Display evaluation
        print(f"\n📊 Evaluation Results:")
        evaluation = result.get("evaluation", {})
        print(f"   Overall Score: {evaluation.get('overall_score', 0)}/100")
        deterministic_scores = evaluation.get("deterministic_scores", {})
        print(f"   Completeness: {deterministic_scores.get('completeness', 0)}/100")
        print(f"   Depth: {deterministic_scores.get('depth', 0)}/100")
        print(f"   Clarity: {deterministic_scores.get('clarity', 0)}/100")
        
        # Display strategy
        print(f"\n🎯 Strategy Selected:")
        strategy = result.get("strategy", {})
        print(f"   Strategy ID: {strategy.get('id')}")
        print(f"   Strategy Name: {strategy.get('name')}")
        print(f"   Parameters: {strategy.get('parameters', {})}")
        
        # Display follow-up
        print(f"\n💬 Generated Follow-up Question:")
        followup = result.get("followup")
        if followup:
            print(f"   Follow-up #{followup.get('followup_number', 1)}")
            print(f"   Question: {followup.get('text')}")
            print(f"   Strategy: {followup.get('strategy_id')}")
            print(f"   Reason: {followup.get('generation_reason', 'N/A')}")
            
            # Check for problematic patterns
            followup_text = followup.get('text', '')
            problematic_patterns = [
                "Ask about", "Ask for", "Ask specifically", 
                "Explore", "Assess", "Can you elaborate on that? Ask"
            ]
            
            found_issues = []
            for pattern in problematic_patterns:
                if pattern.lower() in followup_text.lower():
                    found_issues.append(pattern)
            
            if found_issues:
                print(f"\n⚠️  WARNING: Found problematic patterns: {found_issues}")
            else:
                print(f"\n✅ Follow-up looks natural and conversational!")
        else:
            print("   ❌ No follow-up generated")
        
        # Display progress
        print(f"\n📈 Interview Progress:")
        progress = controller.get_progress()
        print(f"   Rounds Completed: {progress.get('rounds_completed', 0)}/{progress.get('total_rounds', 0)}")
        print(f"   Progress: {progress.get('percentage', 0)}%")
        print(f"   Current Follow-up: {progress.get('current_followup', 0)}")
        
        return result
        
    except Exception as e:
        print(f"❌ Error processing response: {e}")
        import traceback
        traceback.print_exc()
        return None

def test_multiple_responses():
    """Test follow-up generation with different response qualities"""
    
    print("\n" + "=" * 80)
    print("TESTING MULTIPLE RESPONSE SCENARIOS")
    print("=" * 80)
    
    scenarios = [
        {
            "name": "Strong Response",
            "response": "I iterate over dictionaries using .items() which returns an iterable of (key, value) tuples. This is efficient and Pythonic. I can also use .keys() or .values() for specific needs. In Python 3, these return dictionary view objects which are dynamic and reflect changes to the dictionary. I've used this extensively in my projects for data processing and transformation."
        },
        {
            "name": "Weak Response",
            "response": "I use a for loop with .items()"
        },
        {
            "name": "Partial Response",
            "response": "Dictionaries can be iterated using .items() method. It gives you key and value pairs."
        }
    ]
    
    for scenario in scenarios:
        print(f"\n{'=' * 80}")
        print(f"Scenario: {scenario['name']}")
        print(f"{'=' * 80}")
        
        controller = InterviewController(language="python")
        question_data = controller.get_next_question()
        
        if question_data:
            question_id = question_data.get("question_id")
            question_manager = QuestionManager("python")
            question = question_manager.get_question_by_id(question_id)
            
            print(f"\nQuestion: {question.get('text')}")
            print(f"Response: {scenario['response']}")
            
            try:
                result = controller.process_response(scenario['response'], response_type="initial")
                
                evaluation = result.get("evaluation", {})
                followup = result.get("followup")
                
                print(f"\nScore: {evaluation.get('overall_score', 0)}/100")
                print(f"Strategy: {result.get('strategy', {}).get('name')}")
                
                if followup:
                    print(f"Follow-up: {followup.get('text')}")
                else:
                    print("No follow-up generated")
                    
            except Exception as e:
                print(f"Error: {e}")

if __name__ == "__main__":
    print("\nTesting Follow-up Question Generation Simulation\n")
    
    # Main simulation
    result = simulate_followup_generation()
    
    # Test multiple scenarios
    test_multiple_responses()
    
    print("\n" + "=" * 80)
    print("SIMULATION COMPLETE")
    print("=" * 80)

