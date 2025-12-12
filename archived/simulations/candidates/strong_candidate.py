"""Strong candidate response templates - excellent on all topics"""
from typing import Dict
import random

def generate_response(question: Dict, response_type: str, followup_number: int = 0) -> str:
    """Generate strong candidate response - correct answers, detailed explanations"""
    question_type = question.get("type", "")
    
    if "true_false" in question_type or "yes_no" in question_type:
        correct_value = question.get("deterministic_answer", {}).get("correct_value", True)
        answer = "True" if correct_value else "False"
        if answer == "True":
            answer = "Yes" if "yes_no" in question_type else "True"
        else:
            answer = "No" if "yes_no" in question_type else "False"
        return f"{answer}. {get_detailed_explanation(question)}"
    
    elif "multiple_choice" in question_type:
        correct_options = question.get("deterministic_answer", {}).get("correct_options", [])
        options_str = ", ".join(correct_options) if correct_options else "A"
        return f"{options_str}. {get_detailed_explanation(question)}"
    
    else:
        return get_detailed_explanation(question)

def get_detailed_explanation(question: Dict) -> str:
    """Get detailed, comprehensive explanation for question"""
    topic = question.get("topic", "programming")
    keywords = question.get("expected_keywords", [])
    
    # Build explanation using expected keywords
    if keywords:
        keyword_part = f"The key concepts here are {', '.join(keywords[:3])}. "
    else:
        keyword_part = ""
    
    explanations = [
        f"{keyword_part}I've worked extensively with this in production systems and understand the underlying principles well.",
        f"{keyword_part}This is a fundamental concept that I've applied in several projects. The important thing to understand is the behavior and edge cases.",
        f"{keyword_part}From my experience, this is crucial for writing clean, maintainable code. I can provide specific examples if helpful.",
        f"{keyword_part}I'm very familiar with this pattern. It's commonly used because of its efficiency and readability benefits.",
    ]
    
    base = random.choice(explanations)
    
    # Add extra detail for follow-ups
    if question.get("response_type") == "followup":
        base += " To elaborate further, I would implement this by considering all edge cases and ensuring proper error handling."
    
    return base
