"""Weak candidate response templates - struggles with concepts"""
from typing import Dict
import random

def generate_response(question: Dict, response_type: str, followup_number: int = 0) -> str:
    """Generate weak candidate response - incorrect answers, vague explanations"""
    question_type = question.get("type", "")
    
    if "true_false" in question_type or "yes_no" in question_type:
        # Often gets the answer wrong
        correct_value = question.get("deterministic_answer", {}).get("correct_value", True)
        # 70% chance of wrong answer
        answer = "False" if (correct_value and random.random() < 0.7) else "True"
        return f"{answer}. I think this is because... well, I'm not entirely sure."
    
    elif "multiple_choice" in question_type:
        # Picks wrong or incomplete options
        all_options = ["A", "B", "C", "D"]
        correct_options = question.get("deterministic_answer", {}).get("correct_options", [])
        # Pick 1-2 random options, likely missing some correct ones
        wrong_options = [o for o in all_options if o not in correct_options]
        picked = random.sample(wrong_options, min(1, len(wrong_options))) if wrong_options else ["A"]
        return f"{', '.join(picked)}. I'm not completely sure about this one."
    
    else:
        return get_vague_explanation(question)

def get_vague_explanation(question: Dict) -> str:
    """Get vague, incomplete explanation"""
    topic = question.get("topic", "programming")
    
    vague_responses = [
        f"I've heard about {topic} but I'm not very familiar with the details.",
        f"I think {topic} is used for... something related to programming.",
        f"I'm still learning about {topic}. I know it's important but can't explain it well.",
        f"I've seen {topic} mentioned before but haven't used it much myself.",
        f"That's a good question. I would need to look that up to give a proper answer."
    ]
    
    return random.choice(vague_responses)

