"""
Constrained Prompt Templates for LLM Operations

All LLM calls should use these pre-defined templates to ensure
consistent, bounded behavior and minimize hallucinations.
"""

from typing import Dict, List, Optional
from dataclasses import dataclass


@dataclass
class PromptTemplate:
    """A constrained prompt template with metadata"""
    name: str
    template: str
    temperature: float
    max_tokens: int
    required_vars: List[str]
    description: str = ""
    

# ============================================================================
# QUESTION GENERATION TEMPLATES
# ============================================================================

QUESTION_ENHANCEMENT = PromptTemplate(
    name="question_enhancement",
    template="""You are enhancing an interview question based on context.

SEED QUESTION:
"{seed_question}"
Topic: {topic}
Category: {category}

CONTEXT:
- Experience Level: {experience_level}
- Previous Topics: {previous_topics}
- Question Number: {question_number}

TASK:
1. Keep the core concept from the seed question
2. Adapt phrasing to feel natural in the interview flow
3. Adjust complexity for {experience_level} level
4. Make it conversational

Generate ONLY the enhanced question text (1-3 sentences).""",
    temperature=0.3,
    max_tokens=500,
    required_vars=["seed_question", "topic", "category", "experience_level", "previous_topics", "question_number"],
    description="Enhance a bank question for interview context"
)


FIRST_QUESTION_PERSONALIZED = PromptTemplate(
    name="first_question_personalized",
    template="""You are a {position_title} interviewer ({experience_level} level).

SEED QUESTION (structural template):
"{seed_question}"
Topic: {topic}

CANDIDATE RESUME:
{resume_excerpt}

REQUIRED SKILLS: {required_skills}

TASK:
1. Start with a warm acknowledgment of their background
2. Connect the seed topic to something from their resume
3. Adjust for {experience_level}: junior=direct, mid=practical, senior=probing
4. Keep it conversational

Generate ONLY the personalized question.""",
    temperature=0.4,
    max_tokens=400,
    required_vars=["position_title", "experience_level", "seed_question", "topic", "resume_excerpt", "required_skills"],
    description="Generate personalized first question from resume + seed"
)


# ============================================================================
# FOLLOW-UP GENERATION TEMPLATES
# ============================================================================

FOLLOWUP_GENERATION = PromptTemplate(
    name="followup_generation",
    template="""You are a friendly technical interviewer generating a follow-up.

ORIGINAL QUESTION: {original_question}
CANDIDATE'S RESPONSE: {candidate_response}
SCORE: {score}/100

STRATEGY: {strategy_guidance}

RULES:
1. Start with brief acknowledgment (e.g., "That's a good point...")
2. Reference something specific they said
3. Probe deeper on the focus area
4. Keep it conversational

Generate ONLY the follow-up question.""",
    temperature=0.5,
    max_tokens=300,
    required_vars=["original_question", "candidate_response", "score", "strategy_guidance"],
    description="Generate natural follow-up question"
)


FOLLOWUP_DECISION = PromptTemplate(
    name="followup_decision",
    template="""Assess whether to continue follow-up questions.

QUESTION: {question}
RESPONSE: {response}
SCORE: {score}/100
EXPERIENCE LEVEL: {experience_level}
FOLLOWUPS SO FAR: {followup_count}

STOP if:
- Score >= 80% with depth
- "I don't know" or incoherent
- Repetitive answers

CONTINUE if:
- Partial understanding (40-79%)
- Surface knowledge needing probing

Respond:
DECISION: STOP or CONTINUE
REASON: [one of: sufficient_skill, no_knowledge, partial_understanding, needs_probing]
CONFIDENCE: [0.0 to 1.0]""",
    temperature=0.2,
    max_tokens=100,
    required_vars=["question", "response", "score", "experience_level", "followup_count"],
    description="Decide whether to continue follow-up questions"
)


# ============================================================================
# EVALUATION TEMPLATES
# ============================================================================

RESPONSE_EVALUATION = PromptTemplate(
    name="response_evaluation",
    template="""Evaluate this interview response.

QUESTION: {question}
CANDIDATE'S ANSWER: {answer}
EXPECTED KEYWORDS: {expected_keywords}
EXPERIENCE LEVEL: {experience_level}

Evaluate (0-100 each):
- ACCURACY: Technical correctness
- COMPLETENESS: Coverage of key points
- DEPTH: Understanding beyond surface
- CLARITY: Communication quality

Format:
ACCURACY: [score]
COMPLETENESS: [score]
DEPTH: [score]
CLARITY: [score]
OVERALL: [weighted average]
SUMMARY: [1-2 sentence summary]""",
    temperature=0.2,
    max_tokens=800,
    required_vars=["question", "answer", "expected_keywords", "experience_level"],
    description="Evaluate candidate response"
)


CODE_REVIEW = PromptTemplate(
    name="code_review",
    template="""Review this code submission.

PROBLEM: {problem}

CODE:
```{language}
{code}
```

TEST CASES: {test_cases}

Evaluate (0-100 each):
1. CORRECTNESS: Solves the problem?
2. EFFICIENCY: Optimal complexity?
3. CODE_QUALITY: Clean, readable?
4. EDGE_CASES: Handles edge cases?

Format:
CORRECTNESS: [score]
EFFICIENCY: [score]
CODE_QUALITY: [score]
EDGE_CASES: [score]
FEEDBACK: [2-3 sentences]
APPROACH: [1 sentence]""",
    temperature=0.2,
    max_tokens=500,
    required_vars=["problem", "language", "code", "test_cases"],
    description="Review and score code submission"
)


# ============================================================================
# FEEDBACK GENERATION TEMPLATES
# ============================================================================

FEEDBACK_GENERATION = PromptTemplate(
    name="feedback_generation",
    template="""Generate interview feedback for the candidate.

QUESTION: {question}
ANSWER: {answer}
SCORES: {scores}

Generate feedback with:
1. SUMMARY: Brief assessment (1-2 sentences)
2. STRENGTHS: 2-3 bullet points
3. WEAKNESSES: 2-3 bullet points
4. SUGGESTION: One actionable improvement

Keep tone professional but encouraging.""",
    temperature=0.4,
    max_tokens=600,
    required_vars=["question", "answer", "scores"],
    description="Generate constructive feedback"
)


INTERVIEW_SUMMARY = PromptTemplate(
    name="interview_summary",
    template="""Summarize this interview session.

POSITION: {position}
CANDIDATE: {candidate_name}
EXPERIENCE LEVEL: {experience_level}

QUESTIONS AND SCORES:
{questions_summary}

Generate:
1. OVERALL ASSESSMENT (2-3 sentences)
2. KEY STRENGTHS (3 bullet points)
3. AREAS FOR IMPROVEMENT (3 bullet points)
4. RECOMMENDATION: STRONG HIRE / HIRE / HOLD / NO HIRE
5. CONFIDENCE: High/Medium/Low

Keep it factual and actionable.""",
    temperature=0.3,
    max_tokens=800,
    required_vars=["position", "candidate_name", "experience_level", "questions_summary"],
    description="Generate interview summary"
)


# ============================================================================
# TRANSITION TEMPLATES
# ============================================================================

TRANSITION_MESSAGE = PromptTemplate(
    name="transition_message",
    template="""Generate a brief transition to the next question.

PREVIOUS TOPIC: {previous_topic}
PREVIOUS SCORE: {previous_score}
TONE: {tone}

Generate 1-2 sentences that:
- Acknowledge the previous response warmly
- Naturally introduce moving to a new topic
- Avoid generic phrases like "Let's move on"

Generate ONLY the transition.""",
    temperature=0.5,
    max_tokens=100,
    required_vars=["previous_topic", "previous_score", "tone"],
    description="Generate natural transition between questions"
)


# ============================================================================
# TEMPLATE REGISTRY
# ============================================================================

TEMPLATES = {
    "question_enhancement": QUESTION_ENHANCEMENT,
    "first_question_personalized": FIRST_QUESTION_PERSONALIZED,
    "followup_generation": FOLLOWUP_GENERATION,
    "followup_decision": FOLLOWUP_DECISION,
    "response_evaluation": RESPONSE_EVALUATION,
    "code_review": CODE_REVIEW,
    "feedback_generation": FEEDBACK_GENERATION,
    "interview_summary": INTERVIEW_SUMMARY,
    "transition_message": TRANSITION_MESSAGE,
}


def get_template(name: str) -> Optional[PromptTemplate]:
    """Get a prompt template by name"""
    return TEMPLATES.get(name)


def render_template(name: str, **kwargs) -> str:
    """
    Render a template with provided variables.
    
    Args:
        name: Template name
        **kwargs: Variables to fill in the template
    
    Returns:
        Rendered prompt string
    
    Raises:
        ValueError: If template not found or missing required vars
    """
    template = TEMPLATES.get(name)
    if not template:
        raise ValueError(f"Template not found: {name}")
    
    # Check required variables
    missing = [v for v in template.required_vars if v not in kwargs]
    if missing:
        raise ValueError(f"Missing required variables: {missing}")
    
    return template.template.format(**kwargs)


def get_config(name: str) -> Dict:
    """Get generation config for a template"""
    template = TEMPLATES.get(name)
    if not template:
        return {"temperature": 0.3, "max_output_tokens": 500}
    
    return {
        "temperature": template.temperature,
        "max_output_tokens": template.max_tokens
    }

