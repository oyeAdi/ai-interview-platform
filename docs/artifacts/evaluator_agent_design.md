# Evaluator Agent Design (Eval Agent MD)

## 1. Binary Classification: Coding vs Non-Coding

### CODING Questions
```
├── pure_coding (e.g., "Implement a function to reverse a string")
├── debugging (e.g., "Fix this buggy code")
├── system_design_with_code (e.g., "Design and implement a rate limiter")
└── algorithmic_problem_solving (e.g., "Solve two-sum problem")
```

### NON-CODING Questions
```
├── behavioral (e.g., "Tell me about a time you faced conflict")
├── technical_conceptual (e.g., "Explain how HTTP works")
├── situational (e.g., "How would you handle a tight deadline?")
├── hr_cultural_fit (e.g., "Why do you want to work here?")
└── management_leadership (e.g., "How do you motivate a team?")
```

---

## 2. Current Implementation Analysis

### Session-Level Aggregation (Line 814)
```python
avg_score = sum(all_scores) / len(all_scores) if all_scores else 0
```
**Current:** Simple average of all question scores
**Decision:** ✅ **KEEP SIMPLE AVERAGE** - Each question is already evaluated with trend, importance, and difficulty considered. Session-level complexity is unnecessary.

### Scoring Strategy (CHANGED)
**Old (v1.0):** Adaptive weighting (70% LLM, 30% deterministic)
**New (v2.0):** 100% LLM scoring - NO deterministic scoring
- Each question evaluation already considers trend and weighted importance
- LLM frameworks handle all scoring logic
- Deterministic scoring removed entirely

---

## 3. Design Solutions

### A. Model Configuration

**Proposal:**
```json
{
  "evaluator_agent": {
    "model_config": {
      "default_model": "gemma-3-27b-it",
      "models_to_try": ["gemma-3-27b-it", "gemini-2.5-flash-lite", "gemini-flash-latest"],
      "fallback_to_parent": true
    },
    "llm_scoring": {
      "model": "runtime_configurable",
      "inherits_from": "evaluator_agent.model_config"
    }
  }
}
```

---

### B. Inputs Specification

**From Session SSOT:**
Session SSOT will contain rich data enabling high-confidence LLM scoring:
```json
{
  "inputs": {
    "required": [
      "question.text",
      "question.type",
      "question.category",
      "question.difficulty",
      "candidate_response.text",
      "candidate_response.submitted_at"
    ],
    "optional": [
      "question.expected_keywords",
      "question.evaluation_hints",
      "candidate_response.typing_duration",
      "candidate_response.edit_count",
      "previous_scores",
      "interview_context.current_round",
      "interview_context.score_trend",
      "candidate_profile",
      "position_requirements"
    ],
    "source": "session_ssot"
  }
}
```

---

### C. Fallback Mechanism (UPDATED)

**Scenario:** LLM scoring fails (timeout, API error, quota exceeded)

**Proposed Fallback Chain:**
```
1. Primary: LLM Scoring (gemma-3-27b-it)
   ↓ (fails)
2. Retry: Try next model (gemini-2.5-flash-lite)
   ↓ (fails)
3. Retry: Try last model (gemini-flash-latest)
   ↓ (fails)
4. HITL Required: Flag for manual scoring (both expert & admin)
   - Expert: Detailed evaluation with reasons
   - Admin: Quick score with preset reasons
   - Observer: Learns from both
```

**NO DETERMINISTIC SCORING FALLBACK**

**Configuration:**
```json
{
  "fallback_strategy": {
    "on_llm_failure": {
      "retry_count": 2,
      "retry_models": ["gemini-2.5-flash-lite", "gemini-flash-latest"],
      "fallback_to_deterministic": false,
      "require_hitl_on_fallback": true,
      "hitl_mode": {
        "expert": {
          "detailed_evaluation": true,
          "reason_required": true,
          "observer_learns": true
        },
        "admin": {
          "quick_score": true,
          "preset_reasons": true,
          "observer_learns": true
        }
      },
      "flag_for_review": true,
      "failure_reasons_to_log": [
        "timeout",
        "api_error",
        "quota_exceeded",
        "invalid_response",
        "model_unavailable"
      ]
    }
  }
}
```

**HITL Feedback Structure:**
```json
{
  "hitl_feedback": {
    "action": "approve | edit | override",
    "score": "0-100",
    "reason": {
      "type": "text | preset",
      "text": "User-provided reason",
      "preset_options": [
        "Agree with LLM score",
        "LLM overscored - keyword stuffing detected",
        "LLM underscored - missed depth",
        "Response quality better than LLM assessed",
        "Response quality worse than LLM assessed",
        "Edge case not handled by LLM"
      ]
    },
    "mode": "expert | admin",
    "observer_learns": true
  }
}
```

---

### D. Timeout & Retry Configuration (UPDATED)

**Question:** How long is too long?

**Answer:** Timeout varies based on:
- Candidate circumstances (network issues, thinking time)
- Server state (load, API latency)
- Question complexity (varies within category)
- Runtime conditions

**Solution: Dynamic Timeout Strategy**
```json
{
  "timeout_config": {
    "base_timeout_ms": 20000,
    "dynamic_adjustment": {
      "enabled": true,
      "factors": {
        "server_load": {
          "high_load_multiplier": 1.5,
          "threshold": 0.8
        },
        "api_latency": {
          "slow_api_multiplier": 1.3,
          "threshold_ms": 5000
        },
        "question_complexity": {
          "complex_multiplier": 1.4,
          "indicators": ["multi_part", "requires_code", "system_design"]
        }
      }
    },
    "absolute_max_timeout_ms": 60000,
    "absolute_min_timeout_ms": 10000
  },
  "retry_config": {
    "max_retries": 2,
    "retry_delay_ms": 1000,
    "exponential_backoff": true,
    "backoff_multiplier": 2,
    "retry_on_errors": [
      "timeout",
      "rate_limit",
      "server_error_5xx"
    ],
    "no_retry_on_errors": [
      "invalid_api_key",
      "quota_permanently_exceeded",
      "model_not_found"
    ]
  }
}
```

---

### E. Session-Level Aggregation (SIMPLIFIED)

**Decision:** ✅ **Simple Average**

**Rationale:**
- Each question already evaluated with trend consideration
- Weighted by importance and difficulty during evaluation
- No need for additional session-level complexity

```json
{
  "session_aggregation": {
    "method": "simple_average",
    "formula": "sum(question_scores) / count(questions)",
    "description": "Simple average since per-question evaluation already accounts for difficulty, importance, and trends"
  }
}
```

---

### F. Confidence Thresholds (UPDATED)

**Critique Agent:** ✅ **ALWAYS TRIGGERED**

**Rationale:**
- Even with high-confidence LLM scores, critique provides improvement suggestions
- Critique agent gives its own score and reasoning
- HITL (expert/admin) makes final decision using LLM score + Critique feedback

```json
{
  "critique_agent_triggers": {
    "always_trigger": true,
    "description": "Critique always provides feedback, even for high-confidence scores",
    "responsibilities": [
      "Review LLM score",
      "Provide own score",
      "Suggest improvements (even if agreeing with LLM)",
      "Flag potential issues",
      "Give confidence in LLM assessment"
    ]
  }
}
```

**LLM Self-Confidence:**
Every LLM score includes self-evaluation confidence:
```json
{
  "llm_output": {
    "score": 75,
    "reasoning": "Good understanding but lacks examples",
    "strengths": ["Clear explanation", "Correct syntax"],
    "improvements": ["Add practical examples", "Discuss edge cases"],
    "self_confidence": 0.85,
    "self_confidence_reasoning": "Response clearly demonstrates understanding, but missing depth indicators"
  }
}
```

**HITL Requirements (BOTH MODES):**
```json
{
  "hitl_requirements": {
    "expert_mode": {
      "enabled": true,
      "feedback_type": "detailed",
      "reason_required": true,
      "reason_format": "text_box_with_presets",
      "observer_learns": true,
      "triggers": {
        "critique_flags_issue": true,
        "llm_self_confidence_below": 0.6,
        "llm_fallback_used": true,
        "always_for_first_question": true
      }
    },
    "admin_mode": {
      "enabled": true,
      "feedback_type": "quick",
      "reason_required": true,
      "reason_format": "preset_with_optional_text",
      "observer_learns": true,
      "triggers": {
        "critique_flags_issue": true,
        "llm_self_confidence_below": 0.5,
        "llm_fallback_used": true
      }
    }
  }
}
```

**Observer Learning:**
Observer learns from HITL feedback in BOTH expert and admin modes:
- Expert: Detailed reasons → deeper learning insights
- Admin: Preset reasons → pattern recognition
- Both contribute to LLM improvement

---

## 4. Proposed Evaluator Agent Structure

```json
{
  "evaluator_agent": {
    "phase": "execution",
    "enabled": true,
    "description": "Evaluates candidate responses per question using LLM frameworks only",
    "applies_to": "per_question_response",
    
    "model_config": {
      "default_model": "gemma-3-27b-it",
      "models_to_try": ["gemma-3-27b-it", "gemini-2.5-flash-lite", "gemini-flash-latest"],
      "fallback_to_parent": true
    },
    
    "inputs": {
      "required": ["question", "response"],
      "optional": ["context", "previous_scores", "score_trend", "candidate_profile"],
      "source": "session_ssot"
    },
    
    "responsibilities": [
      "Score responses using LLM frameworks (100% LLM, no deterministic)",
      "Provide reasoning and feedback with self-confidence",
      "Identify strengths and improvements",
      "Trigger critique agent (always)",
      "Trigger observer agent (on HITL feedback)"
    ],
    
    "outputs": {
      "score": "0-100",
      "reasoning": "One sentence assessment",
      "strengths": "1-2 strengths",
      "improvements": "1-2 improvements",
      "self_confidence": "0.0-1.0",
      "self_confidence_reasoning": "Why this confidence level"
    },
    
    "evaluation_config": {
      "llm_scoring": {
        "frameworks": {
          "coding": {
            "pure_coding": {},
            "debugging": {},
            "system_design_with_code": {},
            "algorithmic_problem_solving": {}
          },
          "non_coding": {
            "behavioral": {},
            "technical_conceptual": {},
            "situational": {},
            "hr_cultural_fit": {},
            "management_leadership": {}
          }
        }
      },
      "critique_agent": {
        "always_trigger": true
      },
      "observer_agent": {
        "learns_from_both_modes": true
      },
      "hitl_approval": {
        "expert_mode": { "enabled": true, "detailed": true },
        "admin_mode": { "enabled": true, "quick": true }
      }
    },
    
    "fallback_strategy": {
      "no_deterministic_fallback": true,
      "hitl_required_on_llm_failure": true
    },
    
    "timeout_config": {
      "dynamic": true,
      "base_timeout_ms": 20000
    },
    
    "retry_config": {
      "max_retries": 2,
      "exponential_backoff": true
    },
    
    "session_aggregation": {
      "method": "simple_average"
    },
    
    "confidence_thresholds": {
      "critique_always_triggered": true,
      "hitl_both_modes_enabled": true
    }
  }
}
```

---

## 5. Key Decisions Summary (UPDATED)

| Aspect | Decision |
|--------|----------|
| **Classification** | Binary: Coding vs Non-Coding |
| **Scoring** | 100% LLM (NO deterministic) |
| **Model Config** | Per-agent with parent fallback |
| **Inputs** | From session SSOT (rich data) |
| **Fallback** | Retry models → HITL (no deterministic) |
| **Timeout** | Dynamic (20s base, adjusted by runtime conditions) |
| **Retries** | Max 2 with exponential backoff |
| **Aggregation** | Simple average (complexity in per-question eval) |
| **Critique Trigger** | Always (even for high confidence) |
| **HITL** | Enabled for BOTH expert and admin modes |
| **Observer Learning** | From both expert and admin feedback |
| **Self-Confidence** | Every LLM score includes self-evaluation |

---

## 6. Open Questions for Brainstorming

1. **Timeout Calculation:** What specific factors should influence dynamic timeout?
2. **HITL UI:** How to design preset reason dropdown + text box combo?
3. **Observer Insights:** How to differentiate learning from expert vs admin feedback?
4. **Confidence Calibration:** How to ensure LLM self-confidence is accurate?


## 1. Binary Classification: Coding vs Non-Coding

### CODING Questions
```
├── pure_coding (e.g., "Implement a function to reverse a string")
├── debugging (e.g., "Fix this buggy code")
├── system_design_with_code (e.g., "Design and implement a rate limiter")
└── algorithmic_problem_solving (e.g., "Solve two-sum problem")
```

### NON-CODING Questions
```
├── behavioral (e.g., "Tell me about a time you faced conflict")
├── technical_conceptual (e.g., "Explain how HTTP works")
├── situational (e.g., "How would you handle a tight deadline?")
├── hr_cultural_fit (e.g., "Why do you want to work here?")
└── management_leadership (e.g., "How do you motivate a team?")
```

---

## 2. Current Implementation Analysis

### Session-Level Aggregation (Line 814)
```python
avg_score = sum(all_scores) / len(all_scores) if all_scores else 0
```
**Current:** Simple average of all question scores
**Issues:** 
- No weighting by difficulty
- No weighting by question importance
- No trend consideration

### Scoring Strategy (Line 55-95)
```python
# Adaptive weighting based on discrepancy
weight_llm = 0.70  # Default
weight_det = 0.30

if diff > 45: weight_llm = 0.95, weight_det = 0.05
elif diff > 20: weight_llm = 0.85, weight_det = 0.15
```
**Current:** Adaptive weighting when deterministic >> LLM (keyword stuffing detection)

### Confidence Handling
**Current:** No explicit confidence threshold - always uses LLM if available

---

## 3. Brainstorming Solutions

### A. Model Configuration

**Proposal:**
```json
{
  "evaluator_agent": {
    "model_config": {
      "default_model": "gemma-3-27b-it",
      "models_to_try": ["gemma-3-27b-it", "gemini-2.5-flash-lite", "gemini-flash-latest"],
      "fallback_to_parent": true
    },
    "llm_scoring": {
      "model": "runtime_configurable",
      "inherits_from": "evaluator_agent.model_config"
    }
  }
}
```

---

### B. Inputs Specification

**From Session SSOT:**
```json
{
  "inputs": {
    "required": [
      "question.text",
      "question.type",
      "question.category",
      "question.difficulty",
      "candidate_response.text",
      "candidate_response.submitted_at"
    ],
    "optional": [
      "question.expected_keywords",
      "question.evaluation_hints",
      "candidate_response.typing_duration",
      "candidate_response.edit_count",
      "previous_scores",
      "interview_context.current_round",
      "interview_context.score_trend"
    ],
    "source": "session_ssot"
  }
}
```

---

### C. Fallback Mechanism

**Scenario:** LLM scoring fails (timeout, API error, quota exceeded)

**Proposed Fallback Chain:**
```
1. Primary: LLM Scoring (gemma-3-27b-it)
   ↓ (fails)
2. Retry: Try next model (gemini-2.5-flash-lite)
   ↓ (fails)
3. Retry: Try last model (gemini-flash-latest)
   ↓ (fails)
4. Fallback: Deterministic scoring ONLY
   ↓ (if expert mode)
5. HITL Required: Flag for manual scoring
   ↓ (if admin mode)
6. Admin Scores: Admin provides score (not expert-level evaluation)
```

**Configuration:**
```json
{
  "fallback_strategy": {
    "on_llm_failure": {
      "retry_count": 2,
      "retry_models": ["gemini-2.5-flash-lite", "gemini-flash-latest"],
      "fallback_to_deterministic": true,
      "require_hitl_on_fallback": {
        "expert_mode": true,
        "admin_mode": false
      },
      "admin_scoring_allowed": true,
      "flag_for_review": true,
      "failure_reasons_to_log": [
        "timeout",
        "api_error",
        "quota_exceeded",
        "invalid_response",
        "model_unavailable"
      ]
    }
  }
}
```

**HITL Distinction:**
- **Expert Mode:** HITL = Expert evaluation (detailed, learning-enabled)
- **Admin Mode:** HITL = Admin scoring (basic score only, no learning)

---

### D. Timeout & Retry Configuration

**How long is too long?**
- Quick questions (behavioral): 10s
- Medium questions (conceptual): 15s
- Complex questions (coding/system design): 30s

**Proposed:**
```json
{
  "timeout_config": {
    "per_question_type": {
      "coding": 30000,
      "system_design": 30000,
      "debugging": 25000,
      "behavioral": 10000,
      "conceptual": 15000,
      "situational": 10000,
      "hr": 10000,
      "management": 15000
    },
    "default_timeout_ms": 20000
  },
  "retry_config": {
    "max_retries": 2,
    "retry_delay_ms": 1000,
    "exponential_backoff": true,
    "backoff_multiplier": 2,
    "retry_on_errors": [
      "timeout",
      "rate_limit",
      "server_error_5xx"
    ],
    "no_retry_on_errors": [
      "invalid_api_key",
      "quota_permanently_exceeded",
      "model_not_found"
    ]
  }
}
```

---

### E. Session-Level Aggregation

**Current:** Simple average
**Problems:** Doesn't account for difficulty, importance, or trends

**Proposed Weighted Aggregation:**
```json
{
  "session_aggregation": {
    "method": "weighted_average",
    "weights": {
      "by_difficulty": {
        "easy": 0.2,
        "medium": 0.3,
        "hard": 0.5
      },
      "by_category": {
        "coding": 0.4,
        "system_design": 0.3,
        "conceptual": 0.2,
        "behavioral": 0.1
      }
    },
    "trend_bonus": {
      "enabled": true,
      "improving_bonus": 5,
      "declining_penalty": -3
    },
    "consistency_factor": {
      "enabled": true,
      "high_variance_penalty": -2,
      "description": "Penalize inconsistent performance"
    }
  }
}
```

**Formula:**
```python
# Weighted by difficulty and category
weighted_scores = []
for q in questions:
    difficulty_weight = weights["by_difficulty"][q.difficulty]
    category_weight = weights["by_category"][q.category]
    combined_weight = (difficulty_weight + category_weight) / 2
    weighted_scores.append(q.score * combined_weight)

base_score = sum(weighted_scores) / sum(weights)

# Apply trend bonus
if score_trend == "improving":
    base_score += 5
elif score_trend == "declining":
    base_score -= 3

# Apply consistency factor
variance = calculate_variance(scores)
if variance > threshold:
    base_score -= 2

final_session_score = min(100, max(0, base_score))
```

---

### F. Confidence Thresholds

**When to trigger Critique Agent?**
```json
{
  "critique_agent_triggers": {
    "always_trigger": true,
    "conditional_triggers": {
      "low_llm_confidence": {
        "threshold": 0.6,
        "description": "LLM itself reports low confidence"
      },
      "high_score_discrepancy": {
        "threshold": 20,
        "description": "Deterministic vs LLM score diff > 20"
      },
      "edge_case_detected": {
        "keywords": ["ambiguous", "unclear", "partial"],
        "description": "Response contains edge case indicators"
      },
      "first_question": {
        "enabled": true,
        "description": "Always critique first question for calibration"
      }
    }
  }
}
```

**When is HITL required vs optional?**
```json
{
  "hitl_requirements": {
    "expert_mode": {
      "always_required": false,
      "required_when": {
        "critique_flags_issue": true,
        "llm_confidence_below": 0.5,
        "score_discrepancy_above": 30,
        "candidate_score_below": 40,
        "fallback_scoring_used": true
      },
      "optional_when": {
        "llm_confidence_above": 0.8,
        "critique_agrees": true,
        "score_discrepancy_below": 10
      }
    },
    "admin_mode": {
      "hitl_disabled": true,
      "description": "Admin mode uses LLM scoring without expert review"
    }
  }
}
```

---

## 4. Proposed Evaluator Agent Structure

```json
{
  "evaluator_agent": {
    "phase": "execution",
    "enabled": true,
    "description": "Evaluates candidate responses per question",
    "applies_to": "per_question_response",
    
    "model_config": {
      "default_model": "gemma-3-27b-it",
      "models_to_try": ["gemma-3-27b-it", "gemini-2.5-flash-lite", "gemini-flash-latest"],
      "fallback_to_parent": true
    },
    
    "inputs": {
      "required": ["question", "response"],
      "optional": ["context", "previous_scores", "score_trend"],
      "source": "session_ssot"
    },
    
    "responsibilities": [
      "Score responses using LLM frameworks",
      "Provide reasoning and feedback",
      "Identify strengths and improvements",
      "Trigger critique and observer agents"
    ],
    
    "outputs": {
      "score": "0-100",
      "reasoning": "One sentence assessment",
      "strengths": "1-2 strengths",
      "improvements": "1-2 improvements",
      "confidence": "0.0-1.0"
    },
    
    "evaluation_config": {
      "llm_scoring": {
        "frameworks": {
          "coding": { ... },
          "non_coding": { ... }
        }
      },
      "critique_agent": { ... },
      "observer_agent": { ... },
      "hitl_approval": { ... }
    },
    
    "fallback_strategy": { ... },
    "timeout_config": { ... },
    "retry_config": { ... },
    "session_aggregation": { ... },
    "confidence_thresholds": { ... }
  }
}
```

---

## 5. Key Decisions Summary

| Aspect | Decision |
|--------|----------|
| **Classification** | Binary: Coding vs Non-Coding |
| **Model Config** | Per-agent with parent fallback |
| **Inputs** | From session SSOT |
| **Fallback** | Retry → Deterministic → HITL (expert only) |
| **Timeout** | 10-30s based on question type |
| **Retries** | Max 2 with exponential backoff |
| **Aggregation** | Weighted by difficulty + category + trend |
| **Critique Trigger** | Always + conditional (low confidence, discrepancy) |
| **HITL** | Required in expert mode (conditional), disabled in admin mode |

