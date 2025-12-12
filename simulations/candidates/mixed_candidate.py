"""Mixed candidate response templates - good on some topics, weak on others"""
from typing import Dict
import random

# Topics this candidate is strong in
STRONG_TOPICS = ["loops", "lists", "strings", "variables", "functions"]
WEAK_TOPICS = ["decorators", "generators", "context managers", "metaclasses", "async"]

def generate_response(question: Dict, response_type: str, followup_number: int = 0) -> str:
    """Generate mixed candidate response - varies by topic"""
    question_type = question.get("type", "")
    topic = question.get("topic", "").lower()
    
    # Determine if this is a strong or weak topic for this candidate
    is_strong_topic = any(t in topic for t in STRONG_TOPICS)
    is_weak_topic = any(t in topic for t in WEAK_TOPICS)
    
    if is_strong_topic and not is_weak_topic:
        return generate_strong_response(question, question_type)
    elif is_weak_topic:
        return generate_weak_response(question, question_type)
    else:
        # 50/50 for unknown topics
        if random.random() > 0.5:
            return generate_strong_response(question, question_type)
        else:
            return generate_weak_response(question, question_type)

def generate_strong_response(question: Dict, question_type: str) -> str:
    """Generate a strong response"""
    if "true_false" in question_type or "yes_no" in question_type:
        correct_value = question.get("deterministic_answer", {}).get("correct_value", True)
        answer = "True" if correct_value else "False"
        keywords = question.get("expected_keywords", [])[:2]
        return f"{answer}. This is because {', '.join(keywords) if keywords else 'of the fundamental principles involved'}. I've used this pattern extensively in my projects."
    
    elif "multiple_choice" in question_type:
        correct_options = question.get("deterministic_answer", {}).get("correct_options", [])
        return f"{', '.join(correct_options)}. These are correct because they follow the standard conventions and best practices."
    
    else:
        keywords = question.get("expected_keywords", [])
        return f"This involves {', '.join(keywords[:3]) if keywords else 'several key concepts'}. I have practical experience implementing this and can explain the details."

def generate_weak_response(question: Dict, question_type: str) -> str:
    """Generate a weak response"""
    if "true_false" in question_type or "yes_no" in question_type:
        correct_value = question.get("deterministic_answer", {}).get("correct_value", True)
        # 60% chance wrong
        answer = "False" if (correct_value and random.random() < 0.6) else "True"
        return f"{answer}. I believe this is the case, but I'm not 100% certain."
    
    elif "multiple_choice" in question_type:
        return "A. I think this is the answer but I haven't worked with this much."
    
    else:
        return "I'm familiar with the concept but haven't had much hands-on experience with it."


