# Session SSOT - Complete Schema Specification

**Version**: 2.0.0  
**Purpose**: Single source of truth for ALL interview session data  
**Storage**: MongoDB (primary), JSON files (fallback)  
**Updated**: 2025-12-15

---

## Overview

The Session SSOT stores **everything** about an interview from start to finish:
- Planning phase data (LLM plan, critique, expert feedback)
- Execution phase data (questions, responses, evaluations, timings)
- Evaluation phase data (final report, learnings)
- Complete audit trail of all events
- HITL feedback at every stage

**One Session = One Complete Interview Journey**

---

## Schema Structure

```json
{
  // ============================================
  // SECTION 1: CORE IDENTITY & METADATA
  // ============================================
  "id": "session_20251215_183000",
  "version": "2.0.0",
  "created_at": "2025-12-15T18:30:00.123456",
  "updated_at": "2025-12-15T19:15:30.789012",
  
  // ============================================
  // SECTION 2: STATE MANAGEMENT
  // ============================================
  "state": "in_progress",  // planning | plan_review | invitation_sent | in_progress | paused | completed | cancelled
  "phase": "execution",     // planning | execution | evaluation
  "status": "active",       // active | archived | deleted
  
  // ============================================
  // SECTION 3: OWNERSHIP & PARTICIPANTS
  // ============================================
  "expert": {
    "id": "expert_001",
    "name": "John Expert",
    "email": "john.expert@company.com",
    "role": "expert",
    "logged_in_at": "2025-12-15T18:25:00"
  },
  
  "admin": {
    "id": "admin_001",
    "name": "Jane Admin",
    "email": "jane.admin@company.com",
    "role": "admin",
    "logged_in_at": "2025-12-15T18:30:00"
  },
  
  // ============================================
  // SECTION 4: INTERVIEW CONFIGURATION
  // ============================================
  "config": {
    "mode": "quick_start",  // quick_start | custom_config
    "language": "python",
    "position_id": "uber_senior_python",
    
    // Calculated duration based on question distribution
    "duration_minutes": 50,  // Calculated: (10 + 15 + 20) * 1.1
    "duration_calculation": {
      "base_minutes": 45,
      "buffer_percentage": 10,
      "breakdown": {
        "easy_questions": {"count": 1, "minutes_each": 10, "total": 10},
        "medium_questions": {"count": 1, "minutes_each": 15, "total": 15},
        "hard_questions": {"count": 1, "minutes_each": 20, "total": 20}
      }
    },
    
    "total_questions": 3,
    "max_followups_per_question": 10,
    
    "question_distribution": {
      "coding": 1,
      "conceptual": 1,
      "system_design": 1
    },
    
    "difficulty_distribution": {
      "easy": 0.2,
      "medium": 0.5,
      "hard": 0.3
    },
    
    "enable_adaptive_difficulty": true,
    "enable_dynamic_followups": true,
    "enable_expert_mode": false,
    
    // Time tracking
    "start_time": "2025-12-15T18:30:00",
    "end_time": null,
    "time_remaining_seconds": 3000
  },
  
  // ============================================
  // SECTION 5: CANDIDATE INFORMATION
  // ============================================
  "candidate": {
    "id": "cand_12345",
    "name": "Alice Johnson",
    "email": "alice.johnson@email.com",
    "phone": "+1-555-0123",
    
    // Resume data
    "resume_id": "resume_67890",
    "resume_text": "Alice Johnson\n5 years of Python development experience...",
    "resume_parsed": {
      "total_experience_years": 5,
      "current_company": "Tech Corp",
      "current_role": "Senior Python Developer",
      "education": [
        {
          "degree": "BS Computer Science",
          "institution": "MIT",
          "year": 2018
        }
      ],
      "certifications": ["AWS Certified Developer"],
      "projects": [
        {
          "name": "Microservices Platform",
          "technologies": ["Python", "Django", "PostgreSQL", "Docker"],
          "description": "Built scalable microservices..."
        }
      ]
    },
    
    "experience_years": 5,
    "skills_claimed": ["Python", "Django", "PostgreSQL", "AWS", "Docker"],
    
    // Session participation
    "joined_at": "2025-12-15T18:32:00",
    "left_at": null,
    "ip_address": "192.168.1.100",
    "browser": "Chrome 120.0",
    "device": "Desktop"
  },
  
  // ============================================
  // SECTION 6: POSITION DETAILS
  // ============================================
  "position": {
    "id": "uber_senior_python",
    "title": "Senior Python Developer",
    "department": "Engineering",
    "account_id": "uber",
    
    "jd_text": "We are looking for a Senior Python Developer with 5+ years of experience...",
    "jd_parsed": {
      "required_experience": "5+ years",
      "must_have_skills": ["Python", "System Design", "Microservices"],
      "nice_to_have_skills": ["AWS", "Docker", "Kubernetes"],
      "responsibilities": [
        "Design and implement scalable microservices",
        "Lead technical discussions",
        "Mentor junior developers"
      ]
    },
    
    "required_skills": [
      {"skill": "python", "proficiency": "expert", "weight": 0.3},
      {"skill": "system_design", "proficiency": "advanced", "weight": 0.25},
      {"skill": "microservices", "proficiency": "advanced", "weight": 0.2}
    ],
    
    "nice_to_have_skills": [
      {"skill": "aws", "proficiency": "intermediate", "weight": 0.15},
      {"skill": "docker", "proficiency": "intermediate", "weight": 0.1}
    ],
    
    "salary_range": {
      "min": 120000,
      "max": 180000,
      "currency": "USD"
    }
  },
  
  // ============================================
  // SECTION 7: PLANNING PHASE DATA
  // ============================================
  "planning": {
    "started_at": "2025-12-15T18:25:00",
    "completed_at": "2025-12-15T18:29:00",
    
    // LLM Generated Plan
    "llm_plan": {
      "generated_at": "2025-12-15T18:26:00",
      "model_used": "gemini-pro",
      "plan_version": 1,
      "generation_time_seconds": 12.5,
      
      "questions_planned": [
        {
          "question_number": 1,
          "category": "coding",
          "difficulty": "medium",
          "topic": "python_decorators",
          "estimated_time_minutes": 15,
          "rationale": "Tests core Python knowledge relevant to position"
        },
        {
          "question_number": 2,
          "category": "system_design",
          "difficulty": "hard",
          "topic": "microservices_architecture",
          "estimated_time_minutes": 20,
          "rationale": "Assesses system design skills for senior role"
        },
        {
          "question_number": 3,
          "category": "conceptual",
          "difficulty": "easy",
          "topic": "database_concepts",
          "estimated_time_minutes": 10,
          "rationale": "Validates database fundamentals"
        }
      ],
      
      "rationale": "This plan balances coding, system design, and conceptual knowledge. The difficulty progression allows assessment of both fundamentals and advanced skills required for a senior role.",
      
      "confidence": 0.85,
      
      "resume_jd_alignment": {
        "overall_score": 0.78,
        "matching_skills": ["Python", "System Design", "Microservices"],
        "missing_skills": ["AWS hands-on experience"],
        "recommendations": "Focus on system design and microservices given candidate's experience"
      }
    },
    
    // Critique Agent Feedback
    "critique": {
      "critique_agent_feedback": {
        "overall_assessment": "Good plan with minor improvements needed",
        "strengths": [
          "Good difficulty progression",
          "Covers all required skill areas",
          "Time allocation is reasonable"
        ],
        "concerns": [
          "Question 3 might be too easy for a senior candidate",
          "Could add more focus on AWS/cloud given JD requirements"
        ]
      },
      
      "improvements_suggested": [
        {
          "question_number": 3,
          "suggestion": "Replace easy database question with medium-difficulty AWS/cloud question",
          "rationale": "Better aligns with JD requirements and candidate level"
        }
      ],
      
      "critique_confidence": 0.80,
      "critique_timestamp": "2025-12-15T18:27:00",
      
      "revised_plan": {
        "questions_planned": [
          // Same as original but question 3 updated
          {
            "question_number": 3,
            "category": "conceptual",
            "difficulty": "medium",
            "topic": "aws_services",
            "estimated_time_minutes": 15,
            "rationale": "Assesses cloud knowledge relevant to position"
          }
        ]
      }
    },
    
    // Expert HITL Feedback
    "expert_feedback": {
      "reviewed_at": "2025-12-15T18:28:00",
      "approved": true,
      "review_time_seconds": 45,
      
      "modifications": [
        {
          "field": "questions_planned[2].difficulty",
          "old_value": "medium",
          "new_value": "hard",
          "reason": "Candidate has 5 years experience, should be challenged more"
        }
      ],
      
      "comments": "Good plan overall. Made question 3 harder to better match candidate's experience level. Let's proceed.",
      
      "final_plan": {
        // Final approved plan after expert modifications
        "questions_planned": [
          {
            "question_number": 1,
            "category": "coding",
            "difficulty": "medium",
            "topic": "python_decorators",
            "estimated_time_minutes": 15
          },
          {
            "question_number": 2,
            "category": "system_design",
            "difficulty": "hard",
            "topic": "microservices_architecture",
            "estimated_time_minutes": 20
          },
          {
            "question_number": 3,
            "category": "conceptual",
            "difficulty": "hard",  // Changed by expert
            "topic": "aws_services",
            "estimated_time_minutes": 20  // Adjusted time
          }
        ],
        "total_estimated_time": 55
      }
    },
    
    // Observer Agent Analysis
    "learning_analysis": {
      "feedback_type": "modified",  // approved | modified | rejected
      "reason_for_change": "Expert increased difficulty of question 3 to better match candidate's 5 years experience",
      
      "learning_points": [
        "For candidates with 5+ years experience, prefer hard difficulty questions",
        "AWS/cloud questions are important for this position",
        "Expert tends to increase difficulty when candidate is experienced"
      ],
      
      "stored_for_future": true,
      "learning_id": "learn_001",
      "applies_to": ["senior_python_positions", "experienced_candidates"]
    },
    
    // Invitation Details
    "invitation": {
      "email_content": {
        "subject": "Interview Invitation - Senior Python Developer at Uber",
        "body": "Dear Alice Johnson,\n\nThank you for your interest in the Senior Python Developer role at Uber...",
        "generated_by": "llm",
        "generated_at": "2025-12-15T18:29:00"
      },
      
      "email_edited_by_expert": true,
      "expert_edits": [
        {
          "field": "body",
          "change": "Added personal note about candidate's microservices project"
        }
      ],
      
      "sent_at": "2025-12-15T18:30:00",
      "candidate_email": "alice.johnson@email.com",
      "delivery_status": "delivered",
      "opened_at": "2025-12-15T18:31:00",
      
      "interview_link": "https://interview.company.com/session/session_20251215_183000?role=candidate",
      "admin_link": "https://interview.company.com/session/session_20251215_183000?role=admin",
      "expert_link": "https://interview.company.com/session/session_20251215_183000?role=expert"
    }
  },
  
  // ============================================
  // SECTION 8: EXECUTION PHASE DATA
  // ============================================
  "execution": {
    "started_at": "2025-12-15T18:32:00",
    "ended_at": null,
    
    // Current State (for resume/reconnection)
    "current_state": {
      "phase": "questioning",  // greeting | questioning | evaluating | completed
      "current_question_id": "q1",
      "current_question_number": 1,
      "is_followup": false,
      "followup_number": 0,
      "awaiting_response": true,
      "last_question_asked_at": "2025-12-15T18:35:00",
      "candidate_typing": true,
      "candidate_last_activity": "2025-12-15T18:36:30",
      "expert_pending_approval": false,
      "pending_followup_id": null
    },
    
    // Complete Transcript (Q&A with full metadata)
    "transcript": [
      {
        "interaction_id": "int_001",
        "question": {
          "id": "q1",
          "text": "Explain how Python decorators work and provide an example of a practical use case.",
          "type": "conceptual",
          "category": "python_core",
          "topic": "decorators",
          "difficulty": "medium",
          "is_personalized": true,
          "seed_question_id": "py_dec_001",
          "asked_at": "2025-12-15T18:35:00",
          "round_number": 1,
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
              "candidate_name_used": true,
              "experience_level_considered": true,
              "resume_projects_referenced": false
            }
          },
          
          "expected_answer_points": [
            "Decorators are functions that modify other functions",
            "Use @decorator syntax",
            "Common use cases: logging, authentication, caching"
          ]
        },
        
        "responses": [
          {
            "response_id": "resp_001",
            "text": "Decorators in Python are functions that take another function as input and extend its behavior without modifying it. They use the @ syntax...",
            "submitted_at": "2025-12-15T18:37:30",
            "response_type": "initial",
            "is_code": false,
            "code_language": null,
            "word_count": 150,
            "char_count": 850,
            
            // Behavioral tracking
            "typing_started_at": "2025-12-15T18:35:15",
            "typing_duration_seconds": 135,
            "edit_count": 12,
            "paste_detected": false,
            "backspace_count": 45,
            "pause_events": [
              {"timestamp": "2025-12-15T18:36:00", "duration_seconds": 8},
              {"timestamp": "2025-12-15T18:37:00", "duration_seconds": 5}
            ],
            
            // Evaluation
            "evaluation": {
              "overall_score": 75,
              "evaluated_at": "2025-12-15T18:37:35",
              "evaluator_version": "v2.0",
              "evaluation_time_seconds": 3.2,
              
              "deterministic_scores": {
                "completeness": 80,
                "accuracy": 85,
                "depth": 70,
                "clarity": 75,
                "relevance": 80
              },
              
              "llm_evaluation": {
                "score": 75,
                "model_used": "gemini-pro",
                "reasoning": "Good understanding of decorators. Explanation is clear but lacks practical examples.",
                "strengths": [
                  "Clear explanation of decorator concept",
                  "Correct syntax mentioned",
                  "Good structure"
                ],
                "weaknesses": [
                  "No code example provided",
                  "Missing practical use cases",
                  "Could explain closure concept"
                ],
                "gaps_identified": [
                  "Practical applications",
                  "Advanced decorator patterns"
                ],
                "confidence": 0.85
              },
              
              "keyword_analysis": {
                "expected_keywords": ["function", "wrapper", "@symbol", "closure"],
                "keywords_found": ["function", "wrapper", "@symbol"],
                "keywords_missing": ["closure"],
                "keyword_match_score": 0.75
              },
              
              "answer_coverage": {
                "points_covered": 2,
                "points_total": 3,
                "coverage_percentage": 67
              }
            },
            
            // Strategy Decision
            "strategy_decision": {
              "strategy_selected": "depth_focused",
              "strategy_id": "depth_001",
              "reason": "Good foundation but lacks depth. Probe deeper with practical example.",
              "confidence": 0.8,
              "alternative_strategies": ["clarification", "breadth_focused"],
              "decided_at": "2025-12-15T18:37:36",
              
              "strategy_context": {
                "score_threshold_met": false,  // 75 < 80
                "gaps_identified": true,
                "candidate_confidence_level": "medium"
              }
            },
            
            // Followup Decision
            "followup_decision": {
              "should_continue": true,
              "reason": "sufficient_depth_potential",
              "confidence": 0.85,
              "max_followups_reached": false,
              "current_followup_count": 0,
              "predicted_followups": 2,
              
              "followup_plan": {
                "followup_1": {
                  "type": "depth_focused",
                  "focus": "practical_example",
                  "expected_improvement": 10
                },
                "followup_2": {
                  "type": "challenge",
                  "focus": "advanced_patterns",
                  "expected_improvement": 5
                }
              }
            }
          }
        ],
        
        "summary": {
          "total_responses": 1,
          "score_progression": [75],
          "time_taken_seconds": 150,
          "followups_generated": 1,
          "topic_coverage": ["decorators", "functions"],
          "skills_demonstrated": ["Python basics"],
          "skills_gaps": ["Advanced decorator patterns", "Practical examples"]
        }
      }
    ],
    
    // Behavioral Analytics
    "behavioral_analytics": {
      "typing_patterns": {
        "avg_typing_speed_wpm": 45,
        "avg_pause_duration_seconds": 6.5,
        "longest_pause_seconds": 15,
        "edit_frequency": 0.08,  // edits per character
        "paste_events": 0,
        "backspace_frequency": 0.12,
        "typing_consistency_score": 0.75  // 0-1, higher = more consistent
      },
      
      "response_patterns": {
        "avg_response_length_words": 150,
        "avg_response_time_seconds": 180,
        "quickest_response_seconds": 135,
        "longest_response_seconds": 240,
        "response_time_trend": "stable",  // improving | declining | stable
        "verbosity_trend": "increasing",  // increasing | decreasing | stable
        "response_quality_trend": "improving"
      },
      
      "engagement_metrics": {
        "total_active_time_seconds": 1200,
        "total_idle_time_seconds": 45,
        "tab_switches": 2,
        "window_blur_events": 1,
        "reconnection_count": 0,
        "questions_asked_by_candidate": 0,
        "engagement_score": 0.85  // 0-1, based on activity
      },
      
      "confidence_indicators": {
        "hesitation_score": 0.3,  // 0-1, based on pauses and edits
        "certainty_language_score": 0.7,  // based on word choice
        "response_completeness_score": 0.8,
        "overall_confidence_estimate": 0.7  // 0-1
      },
      
      "suspicious_activity": {
        "detected": false,
        "indicators": [],
        "confidence": 0.95  // confidence that no cheating
      }
    },
    
    // Code Submissions (for coding questions)
    "code_submissions": [
      {
        "submission_id": "code_001",
        "question_id": "q2",
        "language": "python",
        "code": "def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)",
        "submitted_at": "2025-12-15T18:45:00",
        "version": 1,
        "is_final": true,
        
        "analysis": {
          "lines_of_code": 4,
          "complexity_score": "O(2^n)",
          "syntax_valid": true,
          "syntax_errors": [],
          "style_issues": ["missing docstring", "no type hints"],
          "best_practices_score": 0.7,
          
          "test_results": {
            "tests_run": 5,
            "tests_passed": 4,
            "tests_failed": 1,
            "test_cases": [
              {"input": "0", "expected": "0", "actual": "0", "passed": true},
              {"input": "1", "expected": "1", "actual": "1", "passed": true},
              {"input": "5", "expected": "5", "actual": "5", "passed": true},
              {"input": "10", "expected": "55", "actual": "55", "passed": true},
              {"input": "100", "expected": "timeout", "actual": "timeout", "passed": false}
            ],
            "edge_cases_handled": ["n=0", "n=1"],
            "edge_cases_missed": ["large n", "negative n"]
          },
          
          "code_quality": {
            "readability_score": 0.85,
            "maintainability_score": 0.7,
            "efficiency_score": 0.4,  // Poor due to O(2^n)
            "uses_best_practices": false,
            "comments_present": false,
            "naming_conventions_followed": true
          },
          
          "improvements_suggested": [
            "Add memoization for better performance",
            "Add docstring",
            "Add type hints",
            "Handle edge cases (negative numbers)"
          ]
        }
      }
    ],
    
    // Enhanced Timings
    "timings": [
      {
        "timing_id": "time_001",
        "question_id": "q1",
        "question_number": 1,
        "is_followup": false,
        "followup_number": null,
        
        // Timestamps
        "question_asked_at": "2025-12-15T18:35:00",
        "typing_started_at": "2025-12-15T18:35:15",
        "response_submitted_at": "2025-12-15T18:37:30",
        "evaluation_completed_at": "2025-12-15T18:37:35",
        
        // Durations
        "think_time_seconds": 15,
        "typing_time_seconds": 135,
        "total_response_time_seconds": 150,
        "evaluation_time_seconds": 5,
        
        // Performance
        "score": 75,
        "time_efficiency_score": 0.8,  // score relative to time taken
        "compared_to_average": "faster",  // faster | slower | average
        
        // Context
        "difficulty": "medium",
        "expected_time_seconds": 180,
        "time_saved_seconds": 30
      }
    ],
    
    // Strategy Performance
    "strategy_performance": {
      "depth_focused": {
        "times_used": 3,
        "avg_score_improvement": 5.2,
        "success_rate": 0.67,
        "avg_followups_generated": 2.3,
        "best_use_case": "low_initial_score",
        "last_used_at": "2025-12-15T18:40:00",
        "effectiveness_score": 0.75
      },
      "clarification": {
        "times_used": 1,
        "avg_score_improvement": 8.5,
        "success_rate": 1.0,
        "avg_followups_generated": 1.0,
        "best_use_case": "ambiguous_answer",
        "last_used_at": "2025-12-15T18:50:00",
        "effectiveness_score": 0.90
      }
    },
    
    // Skills Assessment Matrix
    "skills_assessment": {
      "Python": {
        "claimed_level": "expert",
        "assessed_level": "advanced",
        "confidence": 0.85,
        "evidence_count": 3,
        "questions_asked": ["q1", "q2"],
        "avg_score": 72,
        "score_progression": [75, 70, 72],
        "strengths": ["syntax", "basic concepts", "problem solving"],
        "weaknesses": ["advanced patterns", "optimization", "best practices"],
        "progression": "stable",  // improving | stable | declining
        "gap_analysis": {
          "expected_for_level": 80,
          "actual_score": 72,
          "gap": 8,
          "recommendations": ["Study advanced Python patterns", "Practice optimization"]
        }
      },
      "System Design": {
        "claimed_level": "intermediate",
        "assessed_level": "intermediate",
        "confidence": 0.75,
        "evidence_count": 1,
        "questions_asked": ["q3"],
        "avg_score": 78,
        "score_progression": [78],
        "strengths": ["scalability thinking", "component design"],
        "weaknesses": ["database choices", "caching strategies"],
        "progression": "stable"
      }
    },
    
    // Live Metrics (updated in real-time)
    "live_metrics": {
      "overall_score": 75.5,
      "questions_completed": 2,
      "questions_remaining": 1,
      "total_followups_asked": 3,
      "avg_response_time_seconds": 165,
      "total_interview_time_seconds": 900,
      "time_remaining_seconds": 1800,
      "completion_percentage": 66.7,
      
      "performance_trend": {
        "direction": "improving",  // improving | stable | declining
        "score_velocity": 2.5,  // points per question
        "consistency_score": 0.8,
        "prediction": {
          "final_score_estimate": 78,
          "confidence": 0.75
        }
      },
      
      "topic_coverage": {
        "topics_planned": ["Python", "System Design", "AWS"],
        "topics_covered": ["Python", "System Design"],
        "topics_remaining": ["AWS"],
        "coverage_percentage": 66.7
      },
      
      "difficulty_progression": {
        "current_difficulty": "medium",
        "difficulty_trend": "increasing",
        "adaptive_difficulty_enabled": true,
        "next_difficulty_recommendation": "hard"
      }
    }
  },
  
  // ============================================
  // SECTION 9: EVALUATION PHASE DATA
  // ============================================
  "evaluation": {
    "started_at": null,  // Populated when interview ends
    "completed_at": null,
    
    // Comprehensive Report
    "report": {
      "overall_score": null,
      "overall_grade": null,  // A+, A, B+, B, C+, C, D, F
      "recommendation": null,  // strong_hire | hire | maybe | no_hire
      
      "summary": null,
      "strengths": [],
      "weaknesses": [],
      "skill_gaps": [],
      "growth_areas": [],
      
      "hiring_recommendation": {
        "decision": null,
        "confidence": null,
        "reasoning": null,
        "salary_recommendation": null,
        "start_date_recommendation": null
      }
    },
    
    // Per-Question Analysis
    "question_analysis": [],
    
    // Expert Final Feedback
    "expert_final_feedback": {
      "reviewed_at": null,
      "overall_comments": null,
      "recommendation_override": null,
      "additional_notes": null,
      "follow_up_actions": []
    },
    
    // Learnings for Future
    "learnings": {
      "candidate_patterns": [],
      "question_effectiveness": [],
      "strategy_insights": [],
      "stored_for_ml": false
    }
  },
  
  // ============================================
  // SECTION 10: AUDIT TRAIL
  // ============================================
  "events": [
    {
      "event_id": "evt_001",
      "timestamp": "2025-12-15T18:25:00",
      "event_type": "session_created",
      "actor": "system",
      "actor_id": null,
      "details": {"session_id": "session_20251215_183000"}
    },
    {
      "event_id": "evt_002",
      "timestamp": "2025-12-15T18:25:30",
      "event_type": "expert_logged_in",
      "actor": "expert",
      "actor_id": "expert_001",
      "details": {"name": "John Expert"}
    },
    {
      "event_id": "evt_003",
      "timestamp": "2025-12-15T18:26:00",
      "event_type": "plan_generation_started",
      "actor": "system",
      "actor_id": "interview_controller_agent",
      "details": {"model": "gemini-pro"}
    },
    {
      "event_id": "evt_004",
      "timestamp": "2025-12-15T18:26:12",
      "event_type": "plan_generated",
      "actor": "system",
      "actor_id": "interview_controller_agent",
      "details": {"questions_count": 3, "generation_time": 12.5}
    },
    {
      "event_id": "evt_005",
      "timestamp": "2025-12-15T18:27:00",
      "event_type": "plan_critiqued",
      "actor": "system",
      "actor_id": "critique_agent",
      "details": {"improvements_suggested": 1}
    },
    {
      "event_id": "evt_006",
      "timestamp": "2025-12-15T18:28:00",
      "event_type": "expert_reviewed_plan",
      "actor": "expert",
      "actor_id": "expert_001",
      "details": {"approved": true, "modifications": 1}
    },
    {
      "event_id": "evt_007",
      "timestamp": "2025-12-15T18:29:00",
      "event_type": "invitation_email_sent",
      "actor": "system",
      "actor_id": "email_service",
      "details": {"recipient": "alice.johnson@email.com"}
    },
    {
      "event_id": "evt_008",
      "timestamp": "2025-12-15T18:30:00",
      "event_type": "state_changed",
      "actor": "system",
      "actor_id": null,
      "details": {"from": "plan_review", "to": "invitation_sent"}
    },
    {
      "event_id": "evt_009",
      "timestamp": "2025-12-15T18:32:00",
      "event_type": "candidate_joined",
      "actor": "candidate",
      "actor_id": "cand_12345",
      "details": {"name": "Alice Johnson", "ip": "192.168.1.100"}
    },
    {
      "event_id": "evt_010",
      "timestamp": "2025-12-15T18:32:00",
      "event_type": "state_changed",
      "actor": "system",
      "actor_id": null,
      "details": {"from": "invitation_sent", "to": "in_progress"}
    },
    {
      "event_id": "evt_011",
      "timestamp": "2025-12-15T18:35:00",
      "event_type": "question_asked",
      "actor": "system",
      "actor_id": "interview_controller",
      "details": {"question_id": "q1", "question_number": 1}
    },
    {
      "event_id": "evt_012",
      "timestamp": "2025-12-15T18:37:30",
      "event_type": "response_submitted",
      "actor": "candidate",
      "actor_id": "cand_12345",
      "details": {"question_id": "q1", "word_count": 150}
    },
    {
      "event_id": "evt_013",
      "timestamp": "2025-12-15T18:37:35",
      "event_type": "response_evaluated",
      "actor": "system",
      "actor_id": "evaluator",
      "details": {"question_id": "q1", "score": 75}
    }
  ],
  
  // ============================================
  // SECTION 11: HITL FEEDBACK HISTORY
  // ============================================
  "hitl_feedback_history": [
    {
      "feedback_id": "hitl_001",
      "timestamp": "2025-12-15T18:28:00",
      "phase": "planning",
      "feedback_type": "plan_review",
      "expert_id": "expert_001",
      "expert_name": "John Expert",
      
      "feedback": {
        "approved": true,
        "modifications": [
          {
            "field": "questions_planned[2].difficulty",
            "old_value": "medium",
            "new_value": "hard",
            "reason": "Candidate has 5 years experience"
          }
        ],
        "comments": "Good plan overall. Made question 3 harder."
      },
      
      "learning_extracted": {
        "pattern": "Expert increases difficulty for experienced candidates",
        "applies_to": ["senior_positions", "5+_years_experience"],
        "confidence": 0.85
      }
    }
  ]
}
```

---

## Summary Statistics

### Data Volume Estimates

**Per Session**:
- Planning Phase: ~50 KB
- Execution Phase: ~300 KB (depends on responses)
- Evaluation Phase: ~100 KB
- **Total**: ~450 KB average per session

**For 1 Million Sessions**:
- Total Storage: ~450 GB
- MongoDB: Easily handles this
- Indexed queries: Fast even at scale

### Key Metrics Tracked

1. **Time Metrics**: 15+ timing data points
2. **Score Metrics**: 10+ scoring dimensions
3. **Behavioral Metrics**: 20+ behavioral indicators
4. **Quality Metrics**: Code quality, response quality, engagement
5. **Learning Metrics**: Strategy effectiveness, pattern recognition

### Real-Time Updates

Fields updated in real-time during interview:
- `current_state.*`
- `live_metrics.*`
- `behavioral_analytics.*`
- `events[]` (append only)
- `updated_at`

---

## Usage Examples

### Get Current Interview State
```python
session = load_session(session_id)
current_question = session["execution"]["current_state"]["current_question_id"]
time_remaining = session["config"]["time_remaining_seconds"]
```

### Check Candidate Performance
```python
overall_score = session["execution"]["live_metrics"]["overall_score"]
skills = session["execution"]["skills_assessment"]
python_level = skills["Python"]["assessed_level"]
```

### Analyze HITL Feedback Patterns
```python
hitl_history = session["hitl_feedback_history"]
modifications = [f for f in hitl_history if f["feedback"]["modifications"]]
common_changes = analyze_patterns(modifications)
```

### Generate Report
```python
transcript = session["execution"]["transcript"]
timings = session["execution"]["timings"]
skills = session["execution"]["skills_assessment"]
report = generate_comprehensive_report(transcript, timings, skills)
```

---

**This is the complete Session SSOT - everything about an interview in one place! 🎯**
