"""Improving candidate - starts weak but gets better with follow-ups"""
from typing import Dict
import random

# Track improvement across the interview
_response_count = 0

def reset_state():
    """Reset the response counter for a new simulation"""
    global _response_count
    _response_count = 0

def generate_response(question: Dict, response_type: str, followup_number: int = 0) -> str:
    """Generate improving candidate response - gets better over time"""
    global _response_count
    _response_count += 1
    
    question_type = question.get("type", "")
    
    # Improvement factor: starts at 0.3, improves to 0.9 over responses
    improvement = min(0.3 + (_response_count * 0.1), 0.9)
    
    if response_type == "initial":
        # Initial responses are weak
        return generate_initial_response(question, question_type)
    else:
        # Follow-up responses improve
        if random.random() < improvement:
            return generate_improved_response(question, question_type, followup_number)
        else:
            return generate_partial_response(question, question_type)

def generate_initial_response(question: Dict, question_type: str) -> str:
    """Generate weak initial response"""
    if "true_false" in question_type or "yes_no" in question_type:
        correct_value = question.get("deterministic_answer", {}).get("correct_value", True)
        # Often wrong initially
        answer = "False" if correct_value else "True"
        return f"{answer}. Actually, let me think about this more..."
    
    elif "multiple_choice" in question_type:
        return "I would say A... but I'm not entirely confident."
    
    else:
        return "I know this concept but let me gather my thoughts to explain it properly."

def generate_improved_response(question: Dict, question_type: str, followup_number: int) -> str:
    """Generate improved follow-up response"""
    keywords = question.get("expected_keywords", [])
    
    if "true_false" in question_type or "yes_no" in question_type:
        correct_value = question.get("deterministic_answer", {}).get("correct_value", True)
        answer = "True" if correct_value else "False"
        return f"Actually, I realize the answer is {answer}. {', '.join(keywords[:2]) if keywords else 'The key concept'} makes this clear now."
    
    elif "multiple_choice" in question_type:
        correct_options = question.get("deterministic_answer", {}).get("correct_options", [])
        return f"After thinking about it, {', '.join(correct_options)} are correct. I understand better now."
    
    else:
        return f"I see now. This involves {', '.join(keywords[:3]) if keywords else 'important concepts'}. Thank you for the clarifying questions - it helped me think through this more clearly."

def generate_partial_response(question: Dict, question_type: str) -> str:
    """Generate partially improved response"""
    keywords = question.get("expected_keywords", [])
    return f"I think I understand better now. It relates to {keywords[0] if keywords else 'the core concept'}. Am I on the right track?"

