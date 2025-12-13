"""Declining candidate - starts okay but gets worse under pressure"""
from typing import Dict
import random

# Track fatigue/decline across the interview
_response_count = 0

def reset_state():
    """Reset the response counter for a new simulation"""
    global _response_count
    _response_count = 0

def generate_response(question: Dict, response_type: str, followup_number: int = 0) -> str:
    """Generate declining candidate response - gets worse over time"""
    global _response_count
    _response_count += 1
    
    question_type = question.get("type", "")
    
    # Decline factor: starts at 0.8, drops to 0.2 over responses
    quality = max(0.8 - (_response_count * 0.08), 0.2)
    
    if random.random() < quality:
        return generate_good_response(question, question_type)
    else:
        return generate_fatigued_response(question, question_type, _response_count)

def generate_good_response(question: Dict, question_type: str) -> str:
    """Generate good response (early in interview)"""
    if "true_false" in question_type or "yes_no" in question_type:
        correct_value = question.get("deterministic_answer", {}).get("correct_value", True)
        answer = "True" if correct_value else "False"
        keywords = question.get("expected_keywords", [])[:2]
        return f"{answer}. This is because {', '.join(keywords) if keywords else 'of the underlying principles'}."
    
    elif "multiple_choice" in question_type:
        correct_options = question.get("deterministic_answer", {}).get("correct_options", [])
        return f"{', '.join(correct_options)}. These options are correct based on the standard behavior."
    
    else:
        keywords = question.get("expected_keywords", [])
        return f"This involves {', '.join(keywords[:2]) if keywords else 'key concepts'} which I'm familiar with from my experience."

def generate_fatigued_response(question: Dict, question_type: str, count: int) -> str:
    """Generate fatigued/declining response"""
    fatigue_responses = [
        "I... I'm not sure anymore. Can you repeat the question?",
        "Sorry, I'm blanking on this. I knew it earlier but I'm losing focus.",
        "Um... I think... actually I'm not confident about this anymore.",
        "This is getting difficult. I may have overthought my previous answer.",
        "I'm second-guessing myself now. Let me just say I'm not sure.",
        "I had this a minute ago but now I can't recall the details.",
    ]
    
    if count > 8:
        return "I'm sorry, I'm finding it hard to concentrate. Can we take a short break?"
    
    return random.choice(fatigue_responses)





