# Evaluation Service v2.0 - Design Document

## Overview

**Purpose**: HITL-centric evaluation system that replaces deterministic scoring with LLM + Critique Agent + Expert approval.

**Key Change**: Removed deterministic scoring entirely. Expert approval is the safety net for LLM evaluation.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                  EvaluationService v2                    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────┐     │
│  │  1. LLM Scoring Agent                          │     │
│  │     - Evaluates response using 3 frameworks    │     │
│  │     - Returns: score, reasoning, strengths,    │     │
│  │       improvements                             │     │
│  └────────────────────────────────────────────────┘     │
│                        ↓                                 │
│  ┌────────────────────────────────────────────────┐     │
│  │  2. Critique Agent                             │     │
│  │     - Reviews LLM score for accuracy           │     │
│  │     - Identifies biases/edge cases             │     │
│  │     - Suggests adjustments                     │     │
│  │     - Returns: critique, confidence, flags     │     │
│  └────────────────────────────────────────────────┘     │
│                        ↓                                 │
│  ┌────────────────────────────────────────────────┐     │
│  │  3. HITL Approval Handler                      │     │
│  │     - Presents to Expert/Admin                 │     │
│  │     - Handles: Approve / Edit / Override       │     │
│  │     - Triggers learning on Edit/Override       │     │
│  └────────────────────────────────────────────────┘     │
│                        ↓                                 │
│  ┌────────────────────────────────────────────────┐     │
│  │  4. Learning System                            │     │
│  │     - Stores HITL feedback                     │     │
│  │     - Analyzes patterns                        │     │
│  │     - Improves LLM prompts                     │     │
│  │     - Builds knowledge base                    │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## API Design

### 1. Evaluate Response

```python
async def evaluate_response(
    question: Dict,
    response: str,
    context: Dict
) -> Dict:
    """
    Evaluate candidate response using LLM + Critique.
    
    Args:
        question: Question dict with type, category, etc.
        response: Candidate's response text
        context: Interview context (session, history, etc.)
    
    Returns:
        {
            "llm_evaluation": {
                "score": 85,
                "reasoning": "Strong technical understanding with clear explanation",
                "strengths": ["Accurate concepts", "Good examples"],
                "improvements": ["Could add more depth", "Mention edge cases"],
                "framework_used": "technical_conceptual",
                "confidence": 0.85
            },
            "critique": {
                "feedback": "LLM score appears accurate. Response shows solid understanding.",
                "score_adjustment_suggestion": null,
                "confidence": 0.90,
                "flags": []
            },
            "awaiting_hitl": true,
            "hitl_actions": ["approve", "edit_score", "override"]
        }
    """
```

### 2. HITL Approve

```python
async def hitl_approve(
    evaluation_id: str,
    expert_id: str
) -> Dict:
    """
    Expert approves LLM score + critique as-is.
    
    Returns:
        {
            "final_score": 85,
            "approved_by": "expert_001",
            "approved_at": "2025-12-15T19:55:00Z",
            "learning_triggered": false
        }
    """
```

### 3. HITL Edit Score

```python
async def hitl_edit_score(
    evaluation_id: str,
    expert_id: str,
    new_score: int,
    reason: str,
    agrees_with_critique: bool
) -> Dict:
    """
    Expert modifies the LLM score.
    
    Returns:
        {
            "original_score": 85,
            "final_score": 78,
            "edited_by": "expert_001",
            "edit_reason": "Missed edge case handling",
            "agrees_with_critique": true,
            "learning_triggered": true,
            "learning_id": "learn_20251215195500"
        }
    """
```

### 4. HITL Override

```python
async def hitl_override(
    evaluation_id: str,
    expert_id: str,
    new_score: int,
    new_reasoning: str,
    new_strengths: List[str],
    new_improvements: List[str],
    override_reason: str
) -> Dict:
    """
    Expert completely rewrites evaluation.
    
    Returns:
        {
            "original_evaluation": {...},
            "final_evaluation": {
                "score": 65,
                "reasoning": "Response lacks depth in core concepts",
                "strengths": ["Basic understanding"],
                "improvements": ["Study fundamentals", "Practice more"]
            },
            "overridden_by": "expert_001",
            "override_reason": "LLM missed fundamental gaps",
            "learning_triggered": true,
            "learning_id": "learn_20251215195501"
        }
    """
```

---

## LLM Frameworks

### 1. Coding Framework
**Use**: `question.category == "coding"` or `question.type in ["coding", "code_review"]`

**Criteria**:
- **Coding Ability (40%)**: Code quality, correctness, efficiency, clean practices, edge cases
- **Technical Depth (30%)**: Understanding of concepts, trade-offs, complexity awareness
- **Problem Solving (20%)**: Approach, logical reasoning, optimization thinking
- **Explanation Quality (5%)**: Code explanation clarity
- **Professionalism (5%)**: Basic courtesy

**Prompt Template**:
```
Evaluate this CODING interview response. Focus on TECHNICAL COMPETENCE.
BE OBJECTIVE. Do not inflate scores, but recognize valid partial solutions.

Question: {question_text}
Response: {response_text}

EVALUATION CRITERIA (Total: 100%):
1. CODING ABILITY (40%) - Code quality, correctness, efficiency, clean practices, edge cases
2. TECHNICAL DEPTH (30%) - Understanding of concepts, trade-offs, complexity awareness
3. PROBLEM-SOLVING (20%) - Approach, logical reasoning, optimization thinking
4. EXPLANATION QUALITY (5%) - Code explanation clarity
5. PROFESSIONALISM (5%) - Basic courtesy ONLY

IMPORTANT:
- Prioritize code quality and technical correctness over communication style
- Focus on: practical coding skills, algorithm efficiency, clean code
- Ignore: tone, pleasantries, conversational awareness

Provide JSON response:
- score: 0-100
- reasoning: Focus on TECHNICAL assessment (one sentence)
- strengths: 1-2 TECHNICAL strengths (short phrases)
- improvements: 1-2 TECHNICAL improvements (short phrases)

Reply with ONLY valid JSON, no markdown.
```

### 2. Behavioral Framework
**Use**: `question.category == "behavioral"` or `question.type == "behavioral"`

**Criteria**:
- **Communication Clarity (35%)**: Structure, conciseness, articulation
- **STAR Method (25%)**: Clear progression (Situation, Task, Action, Result)
- **Relevance (20%)**: Directly addressing the question
- **Reflection/Impact (15%)**: Lesson learned or result achieved
- **Professionalism (5%)**: Tone and maturity

### 3. Technical Conceptual Framework
**Use**: Default for non-coding, non-behavioral questions

**Criteria**:
- **Technical Accuracy (40%)**: Correctness of facts and concepts
- **Explanation Quality (25%)**: Clarity, analogies, ability to teach/explain
- **Problem Solving (20%)**: Application of knowledge
- **Practical Context (10%)**: Real-world usage mention
- **Professionalism (5%)**: Confidence and tone

---

## Critique Agent

**Purpose**: Quality check on LLM evaluation

**Prompt Template**:
```
You are a Critique Agent reviewing an LLM's evaluation of a candidate response.

Question: {question_text}
Candidate Response: {response_text}
LLM Evaluation: {llm_evaluation}

Your job:
1. Review the LLM score for accuracy
2. Identify any potential biases (too harsh/lenient)
3. Flag edge cases or ambiguous responses
4. Suggest score adjustments if needed

Provide JSON response:
- critique_feedback: Detailed critique (2-3 sentences)
- score_adjustment_suggestion: null or suggested new score
- confidence: 0.0-1.0 (how confident you are in LLM score)
- flags: List of concerns (empty if none)

Reply with ONLY valid JSON, no markdown.
```

---

## Learning System

### Data Stored
```python
{
    "learning_id": "learn_20251215195500",
    "timestamp": "2025-12-15T19:55:00Z",
    "question": {
        "id": "q_123",
        "type": "coding",
        "category": "coding",
        "difficulty": "medium",
        "text": "..."
    },
    "response": "...",
    "llm_evaluation": {...},
    "critique": {...},
    "hitl_action": "edit_score",  # or "override"
    "hitl_feedback": {
        "expert_id": "expert_001",
        "original_score": 85,
        "final_score": 78,
        "reason": "Missed edge case handling",
        "agrees_with_critique": true
    },
    "context": {
        "session_id": "...",
        "interview_mode": "quick_start",
        "candidate_experience": "senior"
    }
}
```

### Learning Uses
1. **Prompt Improvement**: Analyze patterns in HITL edits to refine LLM prompts
2. **Bias Detection**: Identify systematic over/under-scoring patterns
3. **Edge Case Library**: Build database of tricky cases
4. **Framework Tuning**: Adjust weights in evaluation frameworks
5. **Critique Agent Training**: Improve critique accuracy

---

## Migration from Old System

### Phase 1: Parallel Run (Week 1-2)
- Run both old (deterministic + LLM) and new (LLM + Critique) systems
- Compare results
- Collect HITL feedback on both
- Identify discrepancies

### Phase 2: Gradual Cutover (Week 3-4)
- New sessions use new system
- Old sessions continue with old system
- UI shows both systems for comparison

### Phase 3: Full Migration (Week 5+)
- All sessions use new system
- Old deterministic code marked as deprecated
- UI updated to show only LLM + Critique

---

## Testing Strategy

### Unit Tests
- LLM framework selection logic
- Critique agent prompt generation
- HITL action handlers
- Learning data storage

### Integration Tests
- Full evaluation flow (LLM → Critique → HITL)
- Learning system triggers
- Session data updates

### E2E Tests
- Expert approves evaluation
- Expert edits score
- Expert overrides evaluation
- Learning data persisted correctly

---

## Success Metrics

1. **HITL Approval Rate**: % of evaluations approved without changes (target: >80%)
2. **Critique Accuracy**: % of critiques that align with HITL feedback (target: >75%)
3. **Learning Impact**: Reduction in HITL edits over time (target: -20% per month)
4. **Expert Satisfaction**: Survey rating on evaluation quality (target: 4.5/5)
5. **System Simplicity**: Lines of code reduction vs old system (target: -30%)

---

## Implementation Checklist

- [ ] Create `EvaluationServiceV2` class
- [ ] Implement LLM framework selection
- [ ] Create LLM prompt templates (3 frameworks)
- [ ] Implement Critique Agent
- [ ] Create HITL approval handlers (approve/edit/override)
- [ ] Build learning system storage
- [ ] Write unit tests (TDD)
- [ ] Write integration tests
- [ ] Update session schema for new evaluation data
- [ ] Create UI components for HITL actions
- [ ] Migrate existing evaluations (parallel run)
- [ ] Deprecate old deterministic scoring
- [ ] Update documentation
