# Planner Agent Design (Planner Agent MD)

## 1. Overview & Real-World Context

**Purpose:** Generate round-appropriate interview plans based on job description, candidate resume, interview configuration, and **interview round type**.

**Phase:** Planning (pre-execution)

**Inspiration:** EPAM interview lifecycle - Round-agnostic planning supporting TI(-1), TI0, TI1, and beyond.

**Key Principle:** Plan is a **guideline, not a script**. Execution can deviate based on conversational flow while respecting configuration boundaries.

---

## 2. Interview Rounds as a Continuum

### Round Types (Stored in Session SSOT)

| Round | Purpose | Nature | Question Types |
|-------|---------|--------|----------------|
| **TI(-1)** | Recruiter pre-screening | Resume validation, intent check | Non-coding, conversational, exploratory |
| **TI0** | Basic technical screening | Entry-level assessment | Simple coding, flexible questioning |
| **TI1** | Structured technical interview | Deep technical evaluation | Structured template, deeper assessment |
| **TI2+** | Advanced/domain/system design | Expert-level assessment | Complex coding, system design, architecture |

**Critical:** Round definitions and rules are **static** and stored in Session SSOT. LLM must **read** them, not guess.

---

## 3. Session SSOT (Available from Beginning)

### What's in Session SSOT at Planning Start

```json
{
  "session_metadata": {
    "session_id": "uuid",
    "created_at": "timestamp",
    "interviewer_id": "expert/recruiter ID",
    "candidate_id": "candidate ID"
  },
  "interview_round": {
    "round_type": "TI(-1) | TI0 | TI1 | TI2+",
    "round_number": 1,
    "previous_rounds": [],
    "round_rules": {
      "allows_coding": true/false,
      "question_style": "conversational | structured | mixed",
      "depth_expectation": "surface | moderate | deep",
      "evaluation_rigor": "screening | standard | rigorous"
    }
  },
  "job_description": {
    "position_title": "...",
    "required_skills": [...],
    "experience_level": "...",
    "key_responsibilities": [...],
    "technical_stack": [...]
  },
  "candidate_resume": {
    "parsed_data": {
      "skills": [...],
      "experience": [...],
      "education": [...],
      "projects": [...]
    },
    "raw_text": "..."
  },
  "interview_config": {
    "duration_minutes": 60,
    "question_distribution": {
      "coding": 40,
      "system_design": 30,
      "behavioral": 20,
      "technical_conceptual": 10
    },
    "difficulty_distribution": {
      "easy": 20,
      "medium": 50,
      "hard": 30
    },
    "focus_areas": ["backend", "scalability", "leadership"]
  },
  "static_round_rules": {
    "TI(-1)": {
      "no_coding": true,
      "resume_first": true,
      "conversational": true,
      "exploratory_not_evaluative": true
    },
    "TI0": {
      "simple_coding": true,
      "flexible_questioning": true,
      "basic_assessment": true
    },
    "TI1": {
      "structured_template": true,
      "deeper_evaluation": true,
      "comprehensive_coverage": true
    }
  }
}
```

---

## 4. Planner Agent Inputs

### Required (from Session SSOT)
- `job_description`
- `candidate_resume`
- `interview_config`
- **`interview_round`** (TI-1, TI0, TI1, etc.)
- **`static_round_rules`**

### Optional
- `company_context`
- `interviewer_notes`
- `previous_round_data` (if multi-round)

---

## 5. Planner Agent Outputs

### Interview Template (What to Assess)

**Purpose:** Define broad assessment categories and expected depth.

```json
{
  "template_metadata": {
    "round_type": "TI1",
    "created_for": "Java Backend Engineer",
    "self_confidence_score": 88,
    "confidence_reasoning": "Strong JD-resume alignment, clear round rules"
  },
  "assessment_categories": [
    {
      "category": "Core Java & OOPS",
      "depth": "deep",
      "rationale": "JD requires strong Java fundamentals",
      "time_allocation_minutes": 15
    },
    {
      "category": "Java 8 Features",
      "depth": "moderate",
      "rationale": "Resume shows Java 8 experience",
      "time_allocation_minutes": 10
    },
    {
      "category": "Data Structures",
      "depth": "deep",
      "rationale": "Core requirement for backend role",
      "time_allocation_minutes": 20
    },
    {
      "category": "SQL & Database Design",
      "depth": "moderate",
      "rationale": "JD mentions database work",
      "time_allocation_minutes": 10
    },
    {
      "category": "Behavioral - Team Collaboration",
      "depth": "surface",
      "rationale": "Resume shows team lead experience",
      "time_allocation_minutes": 5
    }
  ],
  "evaluation_intent": "Deep technical assessment for mid-level backend role"
}
```

### Interview Plan (How to Assess)

**Purpose:** Map topics to guiding questions with justifications.

**Characteristics:**
- High-level guiding questions (not rigid scripts)
- Explains WHY each topic is included
- Allows deviation during execution
- Adapts difficulty based on candidate experience and round type

```json
{
  "plan_metadata": {
    "plan_id": "uuid",
    "template_id": "uuid",
    "created_at": "timestamp",
    "planner_model": "gemma-3-27b-it",
    "self_confidence_score": 85,
    "confidence_reasoning": "Plan aligns with round rules and JD requirements"
  },
  "conversation_flow": {
    "opening": {
      "type": "warm_greeting",
      "first_question_rule": "MUST reference resume",
      "example": "I see you've worked with Spring Boot at XYZ Corp. Can you walk me through your most challenging project there?"
    },
    "main_assessment": [
      {
        "topic": "Core Java & OOPS",
        "guiding_questions": [
          "Explain the difference between abstract classes and interfaces in Java",
          "How would you design a class hierarchy for [resume-specific domain]?"
        ],
        "rationale": "Assess OOP fundamentals relevant to candidate's experience",
        "difficulty": "medium",
        "expected_duration_minutes": 15,
        "followup_potential": true
      },
      {
        "topic": "Data Structures - Practical Application",
        "guiding_questions": [
          "Implement a LRU cache with O(1) operations",
          "Discuss time/space complexity trade-offs"
        ],
        "rationale": "JD requires optimization skills, resume shows caching experience",
        "difficulty": "hard",
        "expected_duration_minutes": 20,
        "followup_potential": true
      }
    ],
    "closing": {
      "type": "graceful_sendoff",
      "candidate_questions": true,
      "time_allocation_minutes": 5
    }
  },
  "personalization": {
    "resume_highlights": ["5 years Java", "Led team of 4", "Built scalable APIs"],
    "jd_alignment": ["Strong backend match", "Leadership experience present"],
    "focus_areas": ["System design depth", "Team collaboration"],
    "gaps_to_probe": ["Limited distributed systems experience"]
  },
  "flexibility_notes": "Plan is a guideline. Executioner can deviate based on conversation flow while respecting time and category boundaries."
}
```

---

## 6. Question Generation Strategy

### ✅ Fully Dynamic LLM Generation (NO Question Bank)

**Rationale:**
- HITL can correct any issues
- Critique agent validates quality
- Observer learns from corrections
- More personalized and adaptive

**Generation Approach:**

```json
{
  "generation_strategy": {
    "resume_driven": {
      "weight": 0.4,
      "description": "Generate questions based on candidate's background"
    },
    "jd_driven": {
      "weight": 0.4,
      "description": "Generate questions based on job requirements"
    },
    "gap_analysis": {
      "weight": 0.2,
      "description": "Probe gaps between resume and JD"
    }
  },
  "round_adaptation": {
    "TI(-1)": "Conversational, resume-validation focused",
    "TI0": "Simple coding, basic problem-solving",
    "TI1": "Structured, comprehensive technical assessment",
    "TI2+": "Advanced, system design, architecture"
  }
}
```

---

## 7. Plan Validation (Critique Agent)

### Critique Agent Responsibilities

**Validates plan against:**

1. **Round Rules Compliance**
   - TI(-1): No coding questions?
   - TI0: Simple coding only?
   - TI1: Structured template followed?

2. **Coverage Check**
   - All required categories from config covered?
   - Difficulty distribution as requested?

3. **Time Feasibility**
   - Questions fit within allocated duration?
   - Realistic time estimates?

4. **Personalization Quality**
   - Questions relevant to candidate background?
   - JD-resume alignment addressed?

5. **Question Quality**
   - Questions clear and well-formed?
   - Appropriate for round type?

6. **Progression Logic**
   - Logical flow (warm-up → deep dive → closing)?
   - Difficulty progression makes sense?

### Critique Output

```json
{
  "critique_metadata": {
    "critique_model": "gemma-3-27b-it",
    "self_confidence_score": 82,
    "confidence_reasoning": "Plan is solid but time estimates may be tight"
  },
  "validation_results": {
    "round_rules_compliance": {
      "passed": true,
      "notes": "Correctly follows TI1 structured template"
    },
    "coverage_check": {
      "passed": true,
      "notes": "All categories covered as per config"
    },
    "time_feasibility": {
      "passed": false,
      "notes": "Data structures question may need 25 mins, not 20",
      "suggested_adjustment": "Reduce SQL time to 8 mins, add 2 to DS"
    },
    "personalization_quality": {
      "passed": true,
      "notes": "Strong resume-JD alignment in questions"
    }
  },
  "overall_assessment": "Plan is strong with minor time adjustment needed",
  "suggested_improvements": [
    "Adjust time allocation for Data Structures",
    "Consider adding one more behavioral question"
  ],
  "flags": []
}
```

---

## 8. HITL Review & Approval

### Interviewer Actions

**Can perform:**
- ✅ Approve plan as-is
- ✅ Edit specific questions
- ✅ Add/remove/reorder questions
- ✅ Adjust time allocations
- ✅ Change difficulty levels
- ✅ Modify focus areas
- ✅ Request plan regeneration with feedback

### HITL Workflow

```
Planner generates plan
  ↓
Critique agent validates
  ↓
Interviewer reviews (plan + critique)
  ↓
Interviewer takes action:
  - Approve → Plan locked, execution can begin
  - Edit → Modify plan, re-critique, re-review
  - Regenerate → Planner creates new plan with feedback
  ↓
Observer learns from interviewer edits
```

### Observer Learning from Planning

```json
{
  "observer_learning": {
    "what_to_observe": [
      "Which questions did interviewer edit/remove?",
      "What new questions did interviewer add?",
      "Were time estimates accurate?",
      "Did interviewer change difficulty levels?",
      "What feedback triggered regeneration?"
    ],
    "learning_insights": [
      "Better question selection for this round type",
      "More accurate time estimation",
      "Improved personalization",
      "Better difficulty calibration"
    ],
    "stores_in": "session_ssot.planning_history"
  }
}
```

---

## 9. Admin vs Expert - Role Clarification

### Current Understanding

**From Grand Plan:**
- **Expert** = Technical Interviewer (original design)
- **Admin** = Added later for dashboard monitoring

**From EPAM Story:**
- **Recruiter** = TI(-1) pre-screening
- **Technical Interviewer** = TI0, TI1+ technical rounds

### Proposed Consolidation

**Option 1: Single "Interviewer" Role with Round Types**
```json
{
  "interviewer": {
    "role": "interviewer",
    "permissions": ["plan", "execute", "evaluate"],
    "round_access": ["TI(-1)", "TI0", "TI1", "TI2+"]
  }
}
```

**Option 2: Keep Separate Roles**
```json
{
  "recruiter": {
    "role": "recruiter",
    "permissions": ["plan_TI(-1)", "execute_TI(-1)", "basic_eval"],
    "round_access": ["TI(-1)"]
  },
  "technical_interviewer": {
    "role": "technical_interviewer",
    "permissions": ["plan", "execute", "evaluate", "hitl_detailed"],
    "round_access": ["TI0", "TI1", "TI2+"]
  }
}
```

**Recommendation:** **Option 1** - Simpler, more flexible. Round type determines behavior, not role.

---

## 10. Fallback & Error Handling

### Planning Failures

```json
{
  "fallback_strategy": {
    "on_llm_failure": {
      "retry_count": 2,
      "retry_models": ["gemini-2.5-flash-lite", "gemini-flash-latest"],
      "fallback_to_template": false,
      "require_hitl": true,
      "notify_interviewer": "LLM planning failed, manual plan required"
    },
    "on_invalid_plan": {
      "validation_errors": [
        "missing_categories",
        "time_overflow",
        "no_questions",
        "round_rules_violation"
      ],
      "auto_fix_attempt": true,
      "max_auto_fix_attempts": 2,
      "notify_interviewer_if_unfixable": true
    }
  }
}
```

---

## 11. Session SSOT Integration

### What Planner Writes to Session SSOT

```json
{
  "planning_phase_output": {
    "interview_template": {...},
    "interview_plan": {...},
    "critique_feedback": {...},
    "interviewer_edits": [...],
    "approved_plan": {...},
    "question_queue": [...],
    "personalization_context": {...},
    "planning_history": {
      "original_plan": {...},
      "critique_iterations": [...],
      "hitl_edits": [...],
      "final_approved_plan": {...}
    }
  }
}
```

---

## 12. Proposed Planner Agent Configuration

```json
{
  "planner_agent": {
    "phase": "planning",
    "enabled": true,
    "description": "Generates round-appropriate interview plans using fully dynamic LLM generation",
    "session_ssot_access": true,
    
    "model_config": {
      "default_model": "gemma-3-27b-it",
      "models_to_try": ["gemma-3-27b-it", "gemini-2.5-flash-lite", "gemini-flash-latest"],
      "fallback_to_parent": true
    },
    
    "inputs": {
      "required": [
        "job_description",
        "candidate_resume",
        "interview_config",
        "interview_round",
        "static_round_rules"
      ],
      "optional": [
        "company_context",
        "interviewer_notes",
        "previous_round_data"
      ],
      "source": "session_ssot"
    },
    
    "responsibilities": [
      "Read round type and rules from Session SSOT",
      "Analyze JD and resume for alignment",
      "Generate Interview Template (what to assess)",
      "Generate Interview Plan (how to assess)",
      "Ensure round-appropriate question generation",
      "Provide self-confidence score and reasoning",
      "Respect configuration boundaries"
    ],
    
    "outputs": {
      "interview_template": "Assessment categories with depth and rationale",
      "interview_plan": "Guiding questions with personalization",
      "personalization_insights": "Resume-JD alignment analysis",
      "self_confidence_score": "0-100",
      "confidence_reasoning": "Why this confidence level"
    },
    
    "planning_config": {
      "question_generation": "fully_dynamic_llm",
      "no_question_bank": true,
      "strategies": {
        "resume_driven": 0.4,
        "jd_driven": 0.4,
        "gap_analysis": 0.2
      },
      "round_adaptation": {
        "TI(-1)": "conversational_resume_validation",
        "TI0": "simple_coding_basic_assessment",
        "TI1": "structured_comprehensive_technical",
        "TI2+": "advanced_system_design_architecture"
      },
      "plan_flexibility": "guideline_not_script",
      "allows_execution_deviation": true,
      "must_respect_config_boundaries": true
    },
    
    "validation": {
      "critique_agent_validates": true,
      "validation_criteria": [
        "round_rules_compliance",
        "coverage_check",
        "time_feasibility",
        "personalization_quality",
        "question_quality",
        "progression_logic"
      ]
    },
    
    "hitl_approval": {
      "enabled": true,
      "interviewer_can": [
        "approve",
        "edit_questions",
        "add_remove_reorder",
        "adjust_time",
        "change_difficulty",
        "modify_focus",
        "request_regeneration"
      ],
      "observer_learns_from_edits": true
    },
    
    "fallback_strategy": {
      "on_llm_failure": "retry → require_hitl",
      "on_invalid_plan": "auto_fix → notify_interviewer"
    }
  }
}
```

---

## 13. Key Decisions Summary

| Aspect | Decision |
|--------|----------|
| **Question Generation** | Fully dynamic LLM (NO question bank) |
| **Round Support** | TI(-1), TI0, TI1, TI2+ (round-agnostic) |
| **Round Rules** | Static, stored in Session SSOT |
| **Plan Nature** | Guideline, not script (allows deviation) |
| **Validation** | Critique agent + HITL approval |
| **Personalization** | 40% resume + 40% JD + 20% gap analysis |
| **Observer Learning** | From interviewer edits and plan effectiveness |
| **Fallback** | Retry models → HITL manual plan |
| **Session SSOT** | Available from beginning, writes approved plan |
| **Admin vs Expert** | **Recommend consolidation to "Interviewer" role** |

---

## 14. Open Questions for Discussion

1. **Admin vs Expert Consolidation:** Should we merge into single "Interviewer" role with round-based permissions?

2. **Interview Phases:** You asked about "warm-up, technical, behavioral, Q&A" - Should we keep this structure or simplify?

3. **Over-fitting:** You asked "what is over-fitting?" - It means generating questions TOO specific to resume, missing general JD requirements. How to balance?

4. **Time Estimation:** How to improve accuracy? Use historical data from previous interviews?

5. **Multi-Round Context:** How much previous round data should influence current round planning?


## 1. Overview

**Purpose:** Generate comprehensive interview plans based on job description, candidate resume, and interview configuration.

**Phase:** Planning (pre-execution)

**Key Responsibility:** Create structured, personalized interview roadmap that guides the entire interview session.

---

## 2. Current Implementation Analysis

### Existing Planning Logic
Let me check what currently exists...

**Current State:** Need to analyze existing planning service and interview plan generation.

---

## 3. Planner Agent Inputs

### Required Inputs (from Session SSOT)
```json
{
  "required": {
    "job_description": {
      "position_title": "Senior Software Engineer",
      "required_skills": ["Python", "System Design", "Leadership"],
      "experience_level": "5-8 years",
      "key_responsibilities": ["..."],
      "technical_stack": ["..."]
    },
    "candidate_resume": {
      "parsed_data": {
        "skills": ["..."],
        "experience": ["..."],
        "education": ["..."],
        "projects": ["..."]
      },
      "raw_text": "..."
    },
    "interview_config": {
      "mode": "expert | admin",
      "duration_minutes": 60,
      "question_distribution": {
        "coding": 40,
        "system_design": 30,
        "behavioral": 20,
        "technical_conceptual": 10
      },
      "difficulty_distribution": {
        "easy": 20,
        "medium": 50,
        "hard": 30
      },
      "focus_areas": ["backend", "scalability", "leadership"]
    }
  },
  "optional": {
    "company_context": "Startup/Enterprise/etc",
    "interviewer_notes": "Focus on X, Y, Z",
    "previous_interview_data": "If re-interview"
  }
}
```

---

## 4. Planner Agent Outputs

### Interview Plan Structure
```json
{
  "plan_metadata": {
    "plan_id": "uuid",
    "created_at": "timestamp",
    "planner_model": "gemma-3-27b-it",
    "self_confidence_score": 85,
    "confidence_reasoning": "Strong alignment between JD and resume"
  },
  "interview_structure": {
    "total_duration_minutes": 60,
    "phases": [
      {
        "phase_name": "Warm-up & Introduction",
        "duration_minutes": 5,
        "questions": [...]
      },
      {
        "phase_name": "Technical Deep Dive",
        "duration_minutes": 35,
        "questions": [...]
      },
      {
        "phase_name": "Behavioral Assessment",
        "duration_minutes": 15,
        "questions": [...]
      },
      {
        "phase_name": "Candidate Questions",
        "duration_minutes": 5,
        "questions": []
      }
    ]
  },
  "question_bank": [
    {
      "question_id": "q1",
      "type": "coding.pure_coding",
      "difficulty": "medium",
      "text": "Implement a LRU cache with O(1) operations",
      "rationale": "Resume shows caching experience, JD requires optimization skills",
      "expected_duration_minutes": 15,
      "evaluation_hints": ["Check edge cases", "Discuss time/space complexity"],
      "followup_potential": true,
      "priority": "high"
    }
  ],
  "personalization": {
    "resume_highlights": ["5 years Python", "Led team of 4", "Built scalable APIs"],
    "jd_alignment": ["Strong backend match", "Leadership experience present"],
    "focus_areas": ["System design depth", "Team collaboration"],
    "red_flags": ["Limited distributed systems experience"]
  }
}
```

---

## 5. Key Design Questions

### A. Question Generation Strategy

**How should Planner generate questions?**

**Option 1: Template-Based**
- Pre-defined question templates
- Fill in context from JD/resume
- Pros: Predictable, fast
- Cons: Less personalized

**Option 2: Fully LLM-Generated**
- LLM creates custom questions
- Pros: Highly personalized
- Cons: Unpredictable, may need validation

**Option 3: Hybrid (RECOMMENDED)**
- Question bank with templates
- LLM personalizes and adapts
- LLM generates custom questions for specific gaps
- Pros: Balance of quality and personalization

### B. Plan Validation

**What makes a good interview plan?**

1. **Coverage:** All required categories covered
2. **Balance:** Appropriate difficulty distribution
3. **Relevance:** Questions aligned with JD and resume
4. **Time Management:** Questions fit within duration
5. **Flow:** Logical progression (easy → hard)
6. **Personalization:** Tailored to candidate background

### C. Critique Agent Review

**What should Critique Agent check in the plan?**

```json
{
  "critique_checks": {
    "coverage_check": "Are all question categories from config covered?",
    "difficulty_balance": "Is difficulty distribution as requested?",
    "time_feasibility": "Can all questions fit in allocated time?",
    "personalization_quality": "Are questions relevant to candidate?",
    "question_quality": "Are questions clear and well-formed?",
    "progression_logic": "Does difficulty/topic flow make sense?"
  }
}
```

### D. HITL Review & Approval

**What can Expert/Admin edit in the plan?**

```json
{
  "editable_fields": {
    "add_questions": true,
    "remove_questions": true,
    "reorder_questions": true,
    "edit_question_text": true,
    "adjust_duration": true,
    "change_difficulty": true,
    "modify_focus_areas": true
  },
  "approval_actions": {
    "approve": "Use plan as-is",
    "edit": "Modify specific parts",
    "regenerate": "Ask planner to create new plan with feedback"
  }
}
```

---

## 6. Planner Agent Configuration

### Model Configuration
```json
{
  "model_config": {
    "default_model": "gemma-3-27b-it",
    "models_to_try": ["gemma-3-27b-it", "gemini-2.5-flash-lite", "gemini-flash-latest"],
    "fallback_to_parent": true
  }
}
```

### Planning Strategies
```json
{
  "planning_strategies": {
    "resume_driven": {
      "description": "Generate questions based on candidate's resume highlights",
      "weight": 0.4
    },
    "jd_driven": {
      "description": "Generate questions based on job requirements",
      "weight": 0.4
    },
    "gap_analysis": {
      "description": "Identify and probe gaps between resume and JD",
      "weight": 0.2
    }
  }
}
```

### Question Bank Integration
```json
{
  "question_bank": {
    "use_existing_questions": true,
    "question_sources": [
      "platform_question_bank",
      "position_specific_questions",
      "llm_generated_custom_questions"
    ],
    "selection_criteria": {
      "relevance_score": 0.5,
      "difficulty_match": 0.3,
      "diversity": 0.2
    }
  }
}
```

---

## 7. Fallback & Error Handling

### Planning Failures
```json
{
  "fallback_strategy": {
    "on_llm_failure": {
      "retry_count": 2,
      "retry_models": ["gemini-2.5-flash-lite", "gemini-flash-latest"],
      "fallback_to_template": true,
      "require_hitl": true
    },
    "on_invalid_plan": {
      "validation_errors": ["missing_categories", "time_overflow", "no_questions"],
      "auto_fix": true,
      "notify_admin": true
    }
  }
}
```

---

## 8. Observer Learning from Planning

### What Observer Learns
```json
{
  "observer_learning": {
    "plan_quality_feedback": {
      "expert_edits": "What did expert change and why?",
      "question_effectiveness": "Which planned questions worked well in execution?",
      "time_accuracy": "Were time estimates accurate?",
      "difficulty_accuracy": "Were difficulty levels appropriate?"
    },
    "improvement_areas": [
      "Better question selection",
      "More accurate time estimation",
      "Improved personalization",
      "Better difficulty calibration"
    ]
  }
}
```

---

## 9. Session SSOT Integration

### What Planner Writes to Session SSOT
```json
{
  "session_ssot_writes": {
    "approved_plan": "Final interview plan after HITL approval",
    "plan_metadata": "Planner model, confidence, timestamp",
    "question_queue": "Ordered list of questions to ask",
    "personalization_context": "Resume highlights, JD alignment",
    "planning_history": "Original plan, critique feedback, HITL edits"
  }
}
```

---

## 10. Open Questions for Brainstorming

1. **Question Bank:** Should we maintain a centralized question bank or generate all questions dynamically?

2. **Personalization Depth:** How much should we personalize? Risk of over-fitting to resume?

3. **Plan Flexibility:** Should plan be rigid or allow dynamic adjustments during execution?

4. **Time Estimation:** How to accurately estimate question duration? Use historical data?

5. **Multi-Round Interviews:** How to handle planning for multiple interview rounds?

6. **Difficulty Calibration:** How to ensure difficulty levels are accurate across different domains?

7. **Question Diversity:** How to ensure variety while maintaining relevance?

8. **Resume Parsing:** What if resume parsing fails or is incomplete?

---

## 11. Proposed Planner Agent Structure

```json
{
  "planner_agent": {
    "phase": "planning",
    "enabled": true,
    "description": "Generates comprehensive interview plans based on JD, resume, and config",
    
    "model_config": {
      "default_model": "gemma-3-27b-it",
      "models_to_try": ["gemma-3-27b-it", "gemini-2.5-flash-lite", "gemini-flash-latest"],
      "fallback_to_parent": true
    },
    
    "inputs": {
      "required": ["job_description", "candidate_resume", "interview_config"],
      "optional": ["company_context", "interviewer_notes", "previous_interview_data"],
      "source": "session_ssot"
    },
    
    "responsibilities": [
      "Analyze job description and candidate resume",
      "Generate personalized interview plan",
      "Select/create relevant questions",
      "Estimate question durations",
      "Ensure coverage and balance",
      "Provide self-confidence score"
    ],
    
    "outputs": {
      "interview_plan": "Structured plan with questions and phases",
      "question_bank": "Ordered list of questions with metadata",
      "personalization_insights": "Resume-JD alignment analysis",
      "self_confidence_score": "0-100",
      "confidence_reasoning": "Why this confidence level"
    },
    
    "planning_config": {
      "strategies": {
        "resume_driven": 0.4,
        "jd_driven": 0.4,
        "gap_analysis": 0.2
      },
      "question_sources": ["question_bank", "llm_generated"],
      "validation_rules": ["coverage", "time_feasibility", "difficulty_balance"]
    },
    
    "fallback_strategy": {
      "on_llm_failure": "retry → template → HITL",
      "on_invalid_plan": "auto_fix → notify_admin"
    },
    
    "session_ssot_access": true
  }
}
```

---

## 12. Key Decisions Summary

| Aspect | Decision |
|--------|----------|
| **Question Generation** | Hybrid: Question bank + LLM personalization |
| **Model** | gemma-3-27b-it with fallbacks |
| **Inputs** | JD, Resume, Config from Session SSOT |
| **Validation** | Critique agent + HITL approval |
| **Fallback** | Retry → Template → HITL |
| **Personalization** | Resume-driven (40%) + JD-driven (40%) + Gap analysis (20%) |
| **Observer Learning** | Plan quality, question effectiveness, time accuracy |
| **Session SSOT** | Writes approved plan and question queue |
