# Session SSOT v3.0 - Complete Exhaustive Schema

**Version**: 3.0.0  
**Last Updated**: 2025-12-16  
**Purpose**: Single Source of Truth for ALL interview session data  
**Storage**: JSON files (5-10 users), MongoDB (production scale)  
**Based On**: Perfected Planning, Execution, and Evaluation phase configurations

---

## Storage Strategy Discussion

### JSON File-Based (Current - 5-10 Concurrent Users)

**Pros**:
- ✅ Simple, no database setup
- ✅ Easy debugging (human-readable)
- ✅ Version control friendly
- ✅ No connection pooling needed
- ✅ Fast for small scale (5-10 users)
- ✅ Can use in-memory HashMap cache for O(1) lookups

**Cons**:
- ❌ No concurrent write safety (file locking issues)
- ❌ No transactions
- ❌ No query capabilities
- ❌ Full file read/write for updates
- ❌ No indexing

**Recommendation for 5-10 Users**: **JSON files with in-memory caching**
```python
# Load all sessions into HashMap at startup
session_cache = {}  # {session_id: session_data}

# Read from cache (O(1))
session = session_cache[session_id]

# Write to cache + async file write
session_cache[session_id] = updated_session
background_task(write_to_file, session_id, updated_session)
```

**Performance**:
- Read: O(1) from HashMap
- Write: O(1) to HashMap + async file I/O
- Memory: ~100KB per session × 10 = 1MB (negligible)
- Startup: Load all sessions once (~100ms for 10 sessions)

**When to Migrate to MongoDB**: When concurrent users > 20 OR need query capabilities

---

## Schema Overview

This schema captures **EVERY** data point needed by:
1. **Planning Phase** - To generate intelligent interview plans
2. **Execution Phase** - To ask adaptive questions with context
3. **Evaluation Phase** - To provide comprehensive assessment
4. **Observer Agent** - To learn and improve over time
5. **Critique Agent** - To validate quality at each step
6. **LLM Prompts** - To generate super correct, context-aware outputs

---

## Complete Schema Structure

```json
{
  // ============================================
  // SECTION 1: CORE IDENTITY & METADATA
  // ============================================
  "id": "session_20251216_065500",
  "version": "3.0.0",
  "created_at": "2025-12-16T06:55:00.000Z",
  "updated_at": "2025-12-16T07:30:00.000Z",
  
  // ============================================
  // SECTION 2: STATE MANAGEMENT
  // Reason: Track interview lifecycle
  // Source: System state machine
  // Provider: SessionManager
  // ============================================
  "state": {
    "current": "in_progress",  // planning | plan_review | invitation_sent | in_progress | paused | completed | cancelled
    "phase": "execution",       // planning | execution | evaluation
    "status": "active",         // active | archived | deleted
    "state_history": [
      {
        "state": "planning",
        "entered_at": "2025-12-16T06:55:00.000Z",
        "exited_at": "2025-12-16T06:58:00.000Z",
        "duration_seconds": 180
      },
      {
        "state": "in_progress",
        "entered_at": "2025-12-16T07:00:00.000Z",
        "exited_at": null,
        "duration_seconds": null
      }
    ],
    "reason_needed": "To track interview progress, enable pause/resume, and ensure phase transitions are valid"
  },
  
  // ============================================
  // SECTION 3: OWNERSHIP & PARTICIPANTS
  // Reason: Track who created, owns, and participates in interview
  // Source: Authentication service
  // Provider: AuthService
  // ============================================
  "participants": {
    "expert": {
      "id": "expert_001",
      "name": "John Expert",
      "email": "john.expert@company.com",
      "role": "expert",
      "logged_in_at": "2025-12-16T06:54:00.000Z",
      "last_activity_at": "2025-12-16T07:25:00.000Z",
      "is_active": true,
      "reason_needed": "To track who created the interview and enable HITL workflows"
    },
    "admin": {
      "id": "admin_001",
      "name": "Jane Admin",
      "email": "jane.admin@company.com",
      "role": "admin",
      "logged_in_at": "2025-12-16T07:00:00.000Z",
      "last_activity_at": "2025-12-16T07:28:00.000Z",
      "is_active": true,
      "reason_needed": "To enable admin monitoring and intervention capabilities"
    },
    "candidate": {
      "id": "cand_12345",
      "name": "Alice Johnson",
      "email": "alice.johnson@email.com",
      "phone": "+1-555-0123",
      "joined_at": "2025-12-16T07:02:00.000Z",
      "left_at": null,
      "ip_address": "192.168.1.100",
      "browser": "Chrome 120.0",
      "device": "Desktop",
      "is_active": true,
      "reason_needed": "To track candidate participation and enable reconnection"
    }
  },
  
  // ============================================
  // SECTION 4: COMPANY & POSITION METADATA
  // Reason: Context for personalized questions and JD alignment
  // Source: Company database, JD repository
  // Provider: CompanyService, PositionService
  // ============================================
  "company_metadata": {
    "company_id": "uber",
    "company_name": "Uber Technologies",
    "department": "Engineering",
    "hiring_manager": {
      "name": "Sarah Manager",
      "email": "sarah.manager@uber.com"
    },
    "interview_preferences": {
      "preferred_question_style": "practical_scenario_based",
      "focus_areas": ["system_design", "scalability", "real_world_experience"],
      "red_flags_to_probe": ["job_hopping", "lack_of_ownership"],
      "reason_needed": "To align questions with company culture and hiring priorities"
    },
    "context": {
      "tech_stack": ["Python", "Go", "Kubernetes", "AWS"],
      "team_size": 50,
      "team_structure": "microservices",
      "reason_needed": "To ask relevant technical questions about company's actual stack"
    }
  },
  
  "job_metadata": {
    "position_id": "uber_senior_python_2024",
    "job_title": "Senior Python Developer",
    "experience_level": "senior",
    "seniority": "5-8 years",
    "job_description": {
      "full_text": "We are looking for a Senior Python Developer with 5+ years of experience...",
      "required_skills": [
        {"skill": "python", "proficiency": "expert", "weight": 0.3, "must_have": true},
        {"skill": "system_design", "proficiency": "advanced", "weight": 0.25, "must_have": true},
        {"skill": "microservices", "proficiency": "advanced", "weight": 0.2, "must_have": true},
        {"skill": "aws", "proficiency": "intermediate", "weight": 0.15, "must_have": false},
        {"skill": "docker", "proficiency": "intermediate", "weight": 0.1, "must_have": false}
      ],
      "responsibilities": [
        "Design and implement scalable microservices",
        "Lead technical discussions and architecture reviews",
        "Mentor junior developers",
        "Collaborate with product and design teams"
      ],
      "nice_to_have": ["kubernetes", "kafka", "redis"],
      "reason_needed": "To generate questions that assess JD requirements and identify skill gaps"
    },
    "salary_range": {
      "min": 120000,
      "max": 180000,
      "currency": "USD"
    }
  },
  
  // ============================================
  // SECTION 5: CANDIDATE METADATA
  // Reason: Personalize questions based on background
  // Source: Resume parser, candidate profile
  // Provider: ResumeParserService
  // ============================================
  "candidate_metadata": {
    "profile": {
      "experience_years": 5,
      "current_company": "Tech Corp",
      "current_role": "Senior Python Developer",
      "notice_period_days": 30,
      "expected_salary": 150000,
      "reason_needed": "To set appropriate difficulty level and personalize questions"
    },
    "resume": {
      "resume_id": "resume_67890",
      "uploaded_at": "2025-12-15T10:00:00.000Z",
      "full_text": "Alice Johnson\\n5 years of Python development experience at Tech Corp...",
      "parsed_data": {
        "work_experience": [
          {
            "company": "Tech Corp",
            "role": "Senior Python Developer",
            "duration": "3 years",
            "start_date": "2022-01",
            "end_date": "present",
            "responsibilities": [
              "Built microservices platform using Django and PostgreSQL",
              "Implemented CI/CD pipelines with Jenkins and Docker",
              "Led team of 3 junior developers"
            ],
            "technologies": ["Python", "Django", "PostgreSQL", "Docker", "Jenkins", "AWS"]
          },
          {
            "company": "StartupXYZ",
            "role": "Python Developer",
            "duration": "2 years",
            "start_date": "2020-01",
            "end_date": "2021-12",
            "responsibilities": [
              "Developed REST APIs using Flask",
              "Integrated third-party payment systems"
            ],
            "technologies": ["Python", "Flask", "MySQL", "Redis"]
          }
        ],
        "projects": [
          {
            "name": "Microservices Platform",
            "description": "Built scalable microservices architecture serving 1M+ users",
            "technologies": ["Python", "Django", "PostgreSQL", "Docker", "Kubernetes"],
            "impact": "Reduced latency by 40%, improved scalability",
            "reason_needed": "To ask specific questions about this project and validate claims"
          }
        ],
        "education": [
          {
            "degree": "BS Computer Science",
            "institution": "MIT",
            "year": 2018,
            "gpa": 3.8
          }
        ],
        "certifications": [
          "AWS Certified Developer - Associate (2023)",
          "Certified Kubernetes Administrator (2022)"
        ],
        "skills_claimed": {
          "languages": ["Python", "Go", "JavaScript"],
          "frameworks": ["Django", "Flask", "FastAPI"],
          "databases": ["PostgreSQL", "MySQL", "Redis"],
          "cloud": ["AWS", "Docker", "Kubernetes"],
          "tools": ["Git", "Jenkins", "Terraform"]
        }
      },
      "reason_needed": "To personalize questions, probe specific experiences, and identify resume-JD alignment"
    },
    "resume_jd_alignment": {
      "overall_score": 78,
      "strong_matches": ["Python", "Microservices", "System Design", "AWS", "Docker"],
      "gaps": ["Kafka hands-on experience", "Large-scale system design"],
      "overqualifications": ["Kubernetes certification"],
      "recommendations": "Focus on system design and microservices given candidate's experience. Probe Kafka knowledge gap.",
      "reason_needed": "To identify what to assess deeply vs. what to skip"
    }
  },
  
  // ============================================
  // SECTION 6: INTERVIEW CONFIGURATION
  // Reason: Define interview parameters and constraints
  // Source: Expert configuration, QSM/CCM mode
  // Provider: ConfigService
  // ============================================
  "interview_metadata": {
    "config": {
      "mode": "quick_start",  // quick_start | custom_config
      "total_duration_minutes": 50,
      "duration_calculation": {
        "base_minutes": 45,
        "buffer_percentage": 10,
        "breakdown": {
          "easy_questions": {"count": 0, "minutes_each": 10, "total": 0},
          "medium_questions": {"count": 2, "minutes_each": 15, "total": 30},
          "hard_questions": {"count": 1, "minutes_each": 20, "total": 20}
        },
        "reason_needed": "To pace interview and ensure all topics are covered"
      },
      "total_questions_planned": 3,
      "max_followups_per_question": 10,
      "question_distribution": {
        "coding": 1,
        "conceptual": 1,
        "system_design": 1
      },
      "difficulty_distribution": {
        "easy": 0.0,
        "medium": 0.67,
        "hard": 0.33
      },
      "enable_adaptive_difficulty": true,
      "enable_dynamic_followups": true,
      "enable_expert_mode": false,
      "reason_needed": "To guide question generation and maintain interview structure"
    },
    "round_info": {
      "round_type": "TI2",  // TI0 | TI1 | TI2 | TI3 | TI4 | TI5
      "round_number": 2,
      "round_name": "Comprehensive Template-Based",
      "round_objectives": [
        "Systematic assessment across Java/OOPS/DS/SQL/JUnit",
        "Validate breadth of technical knowledge",
        "Assess problem-solving approach"
      ],
      "expected_outcomes": [
        "Solid understanding across majority of template areas",
        "Ability to explain concepts clearly",
        "Practical coding ability demonstrated"
      ],
      "reason_needed": "To adapt question style and depth for this specific round type"
    },
    "round_rules": {
      "allowed_categories": ["coding", "conceptual", "system_design", "debugging"],
      "forbidden_topics": ["salary_negotiation", "personal_questions"],
      "min_questions": 3,
      "max_questions": 6,
      "time_per_category": {
        "coding": 20,
        "conceptual": 15,
        "system_design": 20
      },
      "coding_required": true,
      "system_design_required": true,
      "reason_needed": "To ensure plan respects round-specific constraints"
    },
    "time_tracking": {
      "start_time": "2025-12-16T07:00:00.000Z",
      "end_time": null,
      "time_elapsed_seconds": 1800,
      "time_remaining_seconds": 1200,
      "is_running_behind": false,
      "is_ahead_of_schedule": false,
      "reason_needed": "To manage pacing and decide on followup depth"
    }
  },
  
  // ============================================
  // SECTION 7: MULTI-ROUND CONTEXT
  // Reason: Track progress across multiple interview rounds
  // Source: Previous session SSO

Ts
  // Provider: SessionManager
  // ============================================
  "multi_round_context": {
    "is_multi_round_interview": true,
    "current_round_number": 2,
    "total_rounds_planned": 4,
    "previous_rounds": [
      {
        "round_type": "TI1",
        "round_number": 1,
        "session_id": "session_20251215_100000",
        "conducted_at": "2025-12-15T10:00:00.000Z",
        "duration_minutes": 45,
        "topics_covered": ["basic_coding", "python_fundamentals"],
        "overall_score": 75,
        "strengths_identified": ["Python syntax", "Problem-solving approach"],
        "weaknesses_identified": ["Algorithm optimization", "Edge case handling"],
        "interviewer_notes": "Good foundation but needs work on optimization",
        "pass_status": "passed",
        "reason_needed": "To avoid re-testing validated skills and focus on gaps"
      }
    ],
    "next_rounds_planned": [
      {
        "round_type": "TI3",
        "round_number": 3,
        "focus_areas": ["advanced_system_design", "microservices", "aws"],
        "reason": "Based on strong TI2 performance, proceed to advanced depth"
      }
    ],
    "reason_needed": "To maintain context across rounds and ensure progressive assessment"
  },
  
  // ============================================
  // SECTION 8: PLANNING PHASE DATA
  // Reason: Store all planning outputs for execution phase
  // Source: PlanningService, Critique Agent, Observer Agent
  // Provider: PlannerAgent
  // ============================================
  "planning_phase": {
    "started_at": "2025-12-16T06:55:00.000Z",
    "completed_at": "2025-12-16T06:59:00.000Z",
    "duration_seconds": 240,
    
    "llm_plan_generation": {
      "plan_id": "plan_001",
      "generated_at": "2025-12-16T06:56:00.000Z",
      "llm_model_used": "gemini-2.0-flash-exp",
      "generation_duration_ms": 12500,
      "self_confidence_score": 85,
      "confidence_reasoning": "High confidence - clear JD requirements, strong resume-JD alignment, standard TI2 round",
      "reason_needed": "To track plan quality and LLM performance"
    },
    
    "planning_phase_output": {
      "interview_template": {
        "categories": [
          {
            "category": "Python Fundamentals",
            "depth": "deep",
            "rationale": "Core requirement for senior Python role, candidate claims expert level",
            "time_allocation_minutes": 15,
            "priority": "must_cover"
          },
          {
            "category": "System Design - Microservices",
            "depth": "deep",
            "rationale": "Critical for role, candidate has relevant project experience",
            "time_allocation_minutes": 20,
            "priority": "must_cover"
          },
          {
            "category": "AWS & Cloud",
            "depth": "moderate",
            "rationale": "Nice-to-have skill, candidate has AWS certification",
            "time_allocation_minutes": 15,
            "priority": "should_cover"
          }
        ],
        "total_time_minutes": 50,
        "coverage_rationale": "Balanced assessment of must-have skills with depth on Python and System Design",
        "reason_needed": "To guide execution phase on WHAT to assess"
      },
      
      "interview_plan": {
        "conversation_flow": [
          {
            "sequence_number": 1,
            "category": "Python Fundamentals",
            "guiding_question": "Explain how Python's garbage collection works, specifically reference counting and cyclic references",
            "personalization_note": "Candidate claims expert Python - probe deep understanding",
            "expected_duration_minutes": 15,
            "difficulty": "medium",
            "is_warmup": true,
            "is_core": true,
            "is_stretch": false
          },
          {
            "sequence_number": 2,
            "category": "System Design - Microservices",
            "guiding_question": "Design a scalable notification service that can handle 1M+ users. Walk me through your architecture",
            "personalization_note": "Relates to candidate's microservices platform project",
            "expected_duration_minutes": 20,
            "difficulty": "hard",
            "is_warmup": false,
            "is_core": true,
            "is_stretch": false
          },
          {
            "sequence_number": 3,
            "category": "AWS & Cloud",
            "guiding_question": "How would you deploy this notification service on AWS? What services would you use?",
            "personalization_note": "Candidate has AWS certification - validate practical knowledge",
            "expected_duration_minutes": 15,
            "difficulty": "medium",
            "is_warmup": false,
            "is_core": false,
            "is_stretch": true
          }
        ],
        "flexibility_notes": "Execution can deviate based on candidate responses. If Python question reveals gaps, add followups. If system design is strong, can add stretch questions on Kafka.",
        "total_planned_questions": 3,
        "reason_needed": "To guide execution phase on HOW to assess (guideline, not script)"
      },
      
      "personalization_insights": {
        "resume_jd_alignment": {
          "strong_matches": ["Python", "Microservices", "System Design", "AWS"],
          "gaps": ["Kafka", "Large-scale system design at Uber scale"],
          "overqualifications": ["Kubernetes certification"],
          "alignment_score": 78
        },
        "personalization_strategy": {
          "resume_driven_questions": [
            "Tell me about your microservices platform project - how did you handle inter-service communication?",
            "You mentioned reducing latency by 40% - what specific optimizations did you implement?"
          ],
          "gap_probing_questions": [
            "Have you worked with message queues like Kafka? How would you design a pub-sub system?",
            "What's the largest scale system you've designed? How many users/requests?"
          ],
          "strength_validation_questions": [
            "Walk me through your AWS architecture for the microservices platform",
            "How did you implement CI/CD for your microservices?"
          ]
        },
        "reason_needed": "To enable personalized, context-aware questioning"
      },
      
      "metadata": {
        "plan_id": "plan_001",
        "generation_timestamp": "2025-12-16T06:56:00.000Z",
        "llm_model_used": "gemini-2.0-flash-exp",
        "generation_duration_ms": 12500,
        "self_confidence_score": 85,
        "confidence_reasoning": "High confidence - clear requirements, good alignment",
        "round_type": "TI2",
        "total_categories": 3,
        "total_planned_questions": 3,
        "estimated_interview_duration_minutes": 50,
        "critique_score": 88,
        "critique_feedback": "Excellent plan. Good balance of depth and breadth. Questions are realistic and frequently-asked.",
        "hitl_status": "approved"
      }
    },
    
    "critique_feedback": {
      "overall_assessment": "Excellent plan with minor suggestions",
      "strengths": [
        "Good difficulty progression",
        "Questions are concise and frequently-asked",
        "Strong personalization based on resume",
        "Time allocation is realistic"
      ],
      "concerns": [
        "Question 3 might be too easy if candidate has AWS cert",
        "Could add more focus on Kafka given JD mentions it"
      ],
      "improvements_suggested": [
        {
          "question_number": 3,
          "suggestion": "Consider adding Kafka followup if time permits",
          "rationale": "JD mentions Kafka as nice-to-have, good to probe"
        }
      ],
      "critique_confidence": 0.88,
      "critique_timestamp": "2025-12-16T06:57:00.000Z",
      "reason_needed": "To validate plan quality before HITL review"
    },
    
    "hitl_feedback": {
      "reviewed_at": "2025-12-16T06:58:00.000Z",
      "reviewed_by": "expert_001",
      "approved": true,
      "review_duration_seconds": 60,
      "modifications": [],
      "comments": "Great plan. Approved as-is. Let's proceed.",
      "approval_action": "approve",
      "reason_needed": "To track interviewer approval and modifications for learning"
    },
    
    "observer_insights": {
      "learning_type": "plan_approved_without_changes",
      "pattern_detected": "Expert tends to approve plans for senior candidates when questions are personalized and realistic",
      "learning_points": [
        "Personalization based on resume projects increases approval rate",
        "Concise, frequently-asked questions are preferred",
        "Time allocation matching difficulty is important"
      ],
      "confidence": 0.85,
      "stored_for_future": true,
      "learning_id": "learn_planning_001",
      "applies_to": ["senior_level_candidates", "TI2_rounds", "python_positions"],
      "reason_needed": "To learn from HITL feedback and improve future plans"
    },
    
    "history": [
      {
        "plan_id": "plan_001",
        "generated_at": "2025-12-16T06:56:00.000Z",
        "critique_score": 88,
        "hitl_status": "approved",
        "modifications_count": 0
      }
    ],
    
    "stats": {
      "total_plans_generated": 1,
      "total_regenerations": 0,
      "average_plan_quality_score": 88,
      "average_generation_time_ms": 12500,
      "hitl_approval_rate": 1.0
    },
    
    "reason_needed": "To store all planning outputs for execution phase and enable learning"
  },
  
  // ============================================
  // SECTION 9: EXECUTION PHASE DATA
  // Reason: Track real-time interview execution
  // Source: ExecutionService, Evaluator Agent
  // Provider: ExecutorAgent
  // ============================================
  "execution_phase": {
    "started_at": "2025-12-16T07:00:00.000Z",
    "ended_at": null,
    
    "current_state": {
      "phase": "questioning",  // greeting | questioning | evaluating | completed
      "current_question_id": "q2",
      "current_question_number": 2,
      "is_followup": false,
      "followup_number": 0,
      "awaiting_response": true,
      "last_question_asked_at": "2025-12-16T07:15:00.000Z",
      "candidate_typing": true,
      "candidate_last_activity": "2025-12-16T07:16:30.000Z",
      "expert_pending_approval": false,
      "pending_followup_id": null,
      "reason_needed": "To enable pause/resume and reconnection"
    },
    
    "context": {
      "current_question_index": 2,
      "total_questions_planned": 3,
      "questions_completed": 1,
      "questions_remaining": 2,
      "time_elapsed_seconds": 1800,
      "time_remaining_seconds": 1200,
      "topics_covered": ["Python Fundamentals"],
      "topics_remaining": ["System Design", "AWS"],
      "current_difficulty_level": "hard",
      "conversation_flow_state": "mid_interview",
      "reason_needed": "To manage pacing and topic transitions"
    },
    
    "transcript": [
      {
        "interaction_id": "int_001",
        "question": {
          "id": "q1",
          "text": "Explain how Python's garbage collection works, specifically reference counting and cyclic references.",
          "type": "conceptual",
          "category": "Python Fundamentals",
          "topic": "garbage_collection",
          "difficulty": "medium",
          "is_personalized": true,
          "seed_question_id": "py_gc_001",
          "asked_at": "2025-12-16T07:05:00.000Z",
          "round_number": 2,
          "question_number": 1,
          "is_followup": false,
          "followup_number": null,
          "parent_question_id": null,
          "generation_context": {
            "strategy_used": "initial_assessment",
            "reason": "First question to assess Python fundamentals",
            "resume_context_used": true,
            "jd_alignment_score": 0.85,
            "personalization": {
              "candidate_name_used": false,
              "experience_level_considered": true,
              "resume_projects_referenced": false
            }
          },
          "expected_answer_points": [
            "Reference counting mechanism",
            "Cyclic reference problem",
            "Generational garbage collector",
            "gc module usage"
          ],
          "reason_needed": "To track what was asked and enable followup generation"
        },
        "responses": [
          {
            "response_id": "resp_001",
            "text": "Python uses reference counting as its primary garbage collection mechanism. Each object has a reference count that tracks how many references point to it. When the count reaches zero, the object is immediately deallocated. However, reference counting can't handle cyclic references where two objects reference each other. Python uses a generational garbage collector to detect and clean up these cycles periodically.",
            "submitted_at": "2025-12-16T07:07:30.000Z",
            "response_type": "initial",
            "is_code": false,
            "code_language": null,
            "word_count": 65,
            "char_count": 450,
            "typing_started_at": "2025-12-16T07:05:15.000Z",
            "typing_duration_seconds": 135,
            "edit_count": 8,
            "paste_detected": false,
            "backspace_count": 25,
            "pause_events": [
              {"timestamp": "2025-12-16T07:06:00.000Z", "duration_seconds": 5},
              {"timestamp": "2025-12-16T07:07:00.000Z", "duration_seconds": 3}
            ],
            "evaluation": {
              "overall_score": 75,
              "evaluated_at": "2025-12-16T07:07:35.000Z",
              "evaluator_version": "v3.0",
              "evaluation_time_seconds": 3.2,
              "llm_evaluation": {
                "score": 75,
                "model_used": "gemini-2.0-flash-exp",
                "reasoning": "Good understanding of reference counting and cyclic references. Mentions generational GC correctly. Missing details about gc module and weak references.",
                "strengths": [
                  "Clear explanation of reference counting",
                  "Correctly identifies cyclic reference problem",
                  "Mentions generational GC"
                ],
                "improvements": [
                  "Could mention gc module and manual control",
                  "Missing weak references concept",
                  "No mention of GC thresholds"
                ],
                "gaps_identified": [
                  "gc module usage",
                  "weak references",
                  "performance implications"
                ],
                "confidence": 0.85
              },
              "critique_feedback": {
                "quality_score": 80,
                "feedback": "Evaluation is fair and accurate. Good identification of gaps.",
                "flags": []
              },
              "answer_coverage": {
                "points_covered": 3,
                "points_total": 4,
                "coverage_percentage": 75
              },
              "reason_needed": "To determine followup strategy and track performance"
            },
            "strategy_decision": {
              "swarm_intelligence_used": true,
              "agent_votes": [
                {
                  "agent_role": "technical_depth_analyzer",
                  "recommended_strategy": "depth_focused",
                  "confidence": 0.85,
                  "reasoning": "Good foundation but missing gc module details"
                },
                {
                  "agent_role": "clarity_analyzer",
                  "recommended_strategy": "breadth_focused",
                  "confidence": 0.65,
                  "reasoning": "Response is clear, could explore related topics"
                },
                {
                  "agent_role": "engagement_analyzer",
                  "recommended_strategy": "depth_focused",
                  "confidence": 0.75,
                  "reasoning": "Candidate engaged, time permits deeper exploration"
                }
              ],
              "strategy_selected": "depth_focused",
              "strategy_id": "depth_001",
              "confidence": 0.75,
              "consensus_level": "strong_majority",
              "final_reasoning": "Two agents recommend depth_focused due to missing gc module details. Time permits followup.",
              "alternative_strategies": ["clarification", "breadth_focused"],
              "decided_at": "2025-12-16T07:07:36.000Z",
              "reason_needed": "To track strategy effectiveness and enable learning"
            },
            "followup_decision": {
              "should_continue": true,
              "reason": "sufficient_depth_potential",
              "confidence": 0.85,
              "max_followups_reached": false,
              "current_followup_count": 0,
              "predicted_followups": 1,
              "followup_plan": {
                "followup_1": {
                  "type": "depth_focused",
                  "focus": "gc_module_usage",
                  "expected_improvement": 10
                }
              },
              "reason_needed": "To decide if followup is warranted"
            }
          },
          {
            "response_id": "resp_002",
            "text": "The gc module allows manual control over garbage collection. You can use gc.collect() to force collection, gc.disable() to turn it off, and gc.get_threshold() to see collection thresholds. Weak references allow referencing objects without increasing their reference count, useful for caches.",
            "submitted_at": "2025-12-16T07:10:00.000Z",
            "response_type": "followup",
            "parent_response_id": "resp_001",
            "followup_question": "Can you explain how to use the gc module and what weak references are?",
            "is_code": false,
            "word_count": 50,
            "char_count": 320,
            "evaluation": {
              "overall_score": 85,
              "llm_evaluation": {
                "score": 85,
                "reasoning": "Excellent followup response. Covers gc module well and mentions weak references.",
                "strengths": ["Good gc module examples", "Mentions weak references correctly"],
                "improvements": ["Could provide code example"],
                "gaps_identified": [],
                "confidence": 0.90
              },
              "reason_needed": "To track improvement from followup"
            },
            "strategy_decision": {
              "strategy_selected": "move_to_next_topic",
              "reason": "Topic well covered, time to move on",
              "confidence": 0.90
            },
            "followup_decision": {
              "should_continue": false,
              "reason": "topic_exhausted_time_to_move_on",
              "confidence": 0.90
            }
          }
        ],
        "summary": {
          "total_responses": 2,
          "score_progression": [75, 85],
          "score_improvement": 10,
          "time_taken_seconds": 300,
          "followups_generated": 1,
          "topic_coverage": ["reference_counting", "cyclic_references", "generational_gc", "gc_module", "weak_references"],
          "skills_demonstrated": ["Python fundamentals", "Memory management"],
          "skills_gaps": [],
          "reason_needed": "To track question effectiveness and learning"
        }
      }
    ],
    
    "behavioral_analytics": {
      "typing_patterns": {
        "avg_typing_speed_wpm": 45,
        "avg_pause_duration_seconds": 4.0,
        "longest_pause_seconds": 8,
        "edit_frequency": 0.06,
        "paste_events": 0,
        "backspace_frequency": 0.08,
        "typing_consistency_score": 0.80,
        "reason_needed": "To detect suspicious activity and assess confidence"
      },
      "response_patterns": {
        "avg_response_length_words": 60,
        "avg_response_time_seconds": 150,
        "quickest_response_seconds": 135,
        "longest_response_seconds": 180,
        "response_time_trend": "stable",
        "verbosity_trend": "stable",
        "response_quality_trend": "improving",
        "reason_needed": "To track engagement and performance trends"
      },
      "engagement_metrics": {
        "total_active_time_seconds": 1800,
        "total_idle_time_seconds": 30,
        "tab_switches": 1,
        "window_blur_events": 0,
        "reconnection_count": 0,
        "questions_asked_by_candidate": 0,
        "engagement_score": 0.95,
        "reason_needed": "To assess candidate engagement level"
      },
      "confidence_indicators": {
        "hesitation_score": 0.25,
        "certainty_language_score": 0.75,
        "response_completeness_score": 0.85,
        "overall_confidence_estimate": 0.75,
        "reason_needed": "To gauge candidate confidence and adjust difficulty"
      },
      "suspicious_activity": {
        "detected": false,
        "indicators": [],
        "confidence": 0.98,
        "reason_needed": "To flag potential cheating"
      }
    },
    
    "code_submissions": [],
    
    "timings": [
      {
        "timing_id": "time_001",
        "question_id": "q1",
        "question_number": 1,
        "is_followup": false,
        "question_asked_at": "2025-12-16T07:05:00.000Z",
        "typing_started_at": "2025-12-16T07:05:15.000Z",
        "response_submitted_at": "2025-12-16T07:07:30.000Z",
        "evaluation_completed_at": "2025-12-16T07:07:35.000Z",
        "think_time_seconds": 15,
        "typing_time_seconds": 135,
        "total_response_time_seconds": 150,
        "evaluation_time_seconds": 5,
        "score": 75,
        "time_efficiency_score": 0.85,
        "compared_to_average": "faster",
        "difficulty": "medium",
        "expected_time_seconds": 180,
        "time_saved_seconds": 30,
        "reason_needed": "To track time management and pacing"
      }
    ],
    
    "strategy_performance": {
      "depth_focused": {
        "times_used": 1,
        "avg_score_improvement": 10.0,
        "success_rate": 1.0,
        "avg_followups_generated": 1.0,
        "best_use_case": "missing_details",
        "last_used_at": "2025-12-16T07:07:36.000Z",
        "effectiveness_score": 0.90,
        "reason_needed": "To track strategy effectiveness"
      }
    },
    
    "skills_assessment": {
      "Python": {
        "claimed_level": "expert",
        "assessed_level": "advanced",
        "confidence": 0.85,
        "evidence_count": 2,
        "questions_asked": ["q1"],
        "avg_score": 80,
        "score_progression": [75, 85],
        "strengths": ["Reference counting", "GC concepts", "gc module"],
        "weaknesses": [],
        "progression": "improving",
        "gap_analysis": {
          "expected_for_level": 85,
          "actual_score": 80,
          "gap": 5,
          "recommendations": []
        },
        "reason_needed": "To track skill assessment in real-time"
      }
    },
    
    "live_metrics": {
      "overall_score": 80.0,
      "questions_completed": 1,
      "questions_remaining": 2,
      "total_followups_asked": 1,
      "avg_response_time_seconds": 150,
      "total_interview_time_seconds": 1800,
      "time_remaining_seconds": 1200,
      "completion_percentage": 33.3,
      "performance_trend": {
        "direction": "improving",
        "score_velocity": 5.0,
        "consistency_score": 0.85,
        "prediction": {
          "final_score_estimate": 82,
          "confidence": 0.75
        }
      },
      "topic_coverage": {
        "topics_planned": ["Python", "System Design", "AWS"],
        "topics_covered": ["Python"],
        "topics_remaining": ["System Design", "AWS"],
        "coverage_percentage": 33.3
      },
      "difficulty_progression": {
        "current_difficulty": "hard",
        "difficulty_trend": "increasing",
        "adaptive_difficulty_enabled": true,
        "next_difficulty_recommendation": "hard"
      },
      "reason_needed": "To provide real-time dashboard metrics"
    },
    
    "observer_insights": [],
    "hitl_feedback": [],
    "critique_feedback": [],
    "conversation_metrics": {
      "candidate_engagement_score": 95,
      "response_completeness_average": 85,
      "followup_effectiveness_rate": 1.0,
      "topic_transition_smoothness": 90,
      "reason_needed": "To track conversation quality"
    },
    "time_metrics": {
      "time_remaining_seconds": 1200,
      "questions_remaining": 2,
      "average_time_per_question": 600,
      "is_running_behind": false,
      "is_ahead_of_schedule": false,
      "reason_needed": "To manage pacing"
    },
    
    "reason_needed": "To track real-time execution and enable adaptive questioning"
  },
  
  // ============================================
  // SECTION 10: EVALUATION PHASE DATA
  // Reason: Store comprehensive final assessment
  // Source: EvaluationService
  // Provider: EvaluatorAgent
  // ============================================
  "evaluation_phase": {
    "started_at": null,
    "completed_at": null,
    "report": {
      "overall_score": null,
      "overall_grade": null,
      "recommendation": null,
      "summary": null,
      "strengths": [],
      "weaknesses": [],
      "skill_gaps": [],
      "per_question_analysis": [],
      "skill_matrix": {},
      "hiring_recommendation": null,
      "next_steps": null,
      "reason_needed": "To provide comprehensive final assessment"
    },
    "hitl_feedback": {
      "reviewed_at": null,
      "final_comments": null,
      "modifications": [],
      "reason_needed": "To track interviewer's final assessment"
    },
    "observer_insights": {
      "learnings": [],
      "reason_needed": "To extract learnings for future interviews"
    }
  },
  
  // ============================================
  // SECTION 11: AUDIT TRAIL
  // Reason: Complete history of all events
  // Source: All services
  // Provider: EventLogger
  // ============================================
  "events": [
    {
      "event_id": "evt_001",
      "timestamp": "2025-12-16T06:55:00.000Z",
      "event_type": "session_created",
      "actor": "system",
      "actor_id": "expert_001",
      "details": {"session_id": "session_20251216_065500"},
      "reason_needed": "To track all actions for debugging and compliance"
    },
    {
      "event_id": "evt_002",
      "timestamp": "2025-12-16T06:56:00.000Z",
      "event_type": "plan_generated",
      "actor": "planner_agent",
      "details": {"plan_id": "plan_001", "confidence": 0.85}
    },
    {
      "event_id": "evt_003",
      "timestamp": "2025-12-16T06:58:00.000Z",
      "event_type": "plan_approved",
      "actor": "expert",
      "actor_id": "expert_001",
      "details": {"plan_id": "plan_001", "modifications": 0}
    },
    {
      "event_id": "evt_004",
      "timestamp": "2025-12-16T07:00:00.000Z",
      "event_type": "interview_started",
      "actor": "system",
      "details": {"start_time": "2025-12-16T07:00:00.000Z"}
    },
    {
      "event_id": "evt_005",
      "timestamp": "2025-12-16T07:02:00.000Z",
      "event_type": "candidate_joined",
      "actor": "candidate",
      "actor_id": "cand_12345",
      "details": {"ip_address": "192.168.1.100"}
    }
  ],
  
  // ============================================
  // SECTION 12: METADATA & STATS
  // Reason: Track session-level statistics
  // Source: Aggregated from all phases
  // Provider: SessionManager
  // ============================================
  "metadata": {
    "total_duration_seconds": null,
    "total_questions_asked": 1,
    "total_followups_asked": 1,
    "total_responses_received": 2,
    "average_response_time_seconds": 150,
    "average_score": 80.0,
    "file_size_bytes": null,
    "last_backup_at": null,
    "reason_needed": "To track session statistics"
  }
}
```

---

## Data Providers & Sources Summary

| Section | Provider | Source | Update Frequency |
|---------|----------|--------|------------------|
| State Management | SessionManager | State machine | On state change |
| Participants | AuthService | Authentication DB | On login/logout |
| Company Metadata | CompanyService | Company DB | Static per session |
| Job Metadata | PositionService | JD repository | Static per session |
| Candidate Metadata | ResumeParserService | Resume upload | Static per session |
| Interview Config | ConfigService | Expert input | Static per session |
| Multi-Round Context | SessionManager | Previous sessions | Static per session |
| Planning Phase | PlannerAgent | LLM + Critique + HITL | Once per session |
| Execution Phase | ExecutorAgent | Real-time | Continuous |
| Evaluation Phase | EvaluatorAgent | Post-interview | Once at end |
| Audit Trail | EventLogger | All services | Real-time |

---

## Usage by LLM Prompts

This Session SSOT provides **complete context** for LLM prompts:

### Planning Phase Prompts
```
Context: {session_ssot.job_metadata}, {session_ssot.candidate_metadata}, {session_ssot.multi_round_context}
Task: Generate interview plan
```

### Execution Phase Prompts
```
Context: {session_ssot.planning_phase_output}, {session_ssot.execution_phase.context}, {session_ssot.execution_phase.transcript}
Task: Generate next question or followup
```

### Evaluation Phase Prompts
```
Context: {session_ssot.execution_phase.transcript}, {session_ssot.planning_phase_output.interview_template}
Task: Generate comprehensive evaluation report
```

---

## Next Steps

1. ✅ **Schema Design Complete** - This is the exhaustive SSOT
2. 📋 **Implement SessionManager v3** - Load/save this schema
3. 📋 **Implement Caching Layer** - HashMap for O(1) access
4. 📋 **Update All Services** - Read/write to this SSOT
5. 📋 **Test with 5-10 Users** - Validate JSON file performance
6. 📋 **Plan MongoDB Migration** - When ready to scale beyond 20 users
