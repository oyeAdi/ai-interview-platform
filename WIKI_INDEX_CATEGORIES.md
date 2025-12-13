# Codebase Wiki - Index Categories

> This document contains all categories and entries to be indexed in the Codebase Wiki.
> Update this file when adding new features to ensure they get documented.

---

## Summary

- **12 Categories**
- **70+ Entries**
- **Last Updated**: December 13, 2024

---

## 1. INTERVIEW FLOW (Core Business Logic)

| Entry | Files | Description |
|-------|-------|-------------|
| Interview Lifecycle | `backend/core/interview_controller.py` | Start → Questions → Follow-ups → End |
| Session Management | `backend/core/interview_controller.py:12-46` | Session ID, state, expert mode |
| WebSocket Communication | `backend/websocket/message_handler.py` | Real-time message routing |
| Connection Management | `backend/websocket/connection_manager.py` | Candidate/Admin connections |
| Interview Start API | `backend/main.py:634-698` | POST /api/interview/start |

---

## 2. CANDIDATE MATCHING

| Entry | Files | Description |
|-------|-------|-------------|
| Match Score Algorithm | `backend/main.py:426-483` | Skill weighting, partial matches |
| Skill Comparison | `backend/main.py:440-445` | Exact vs related skill matching |
| Experience Level Scoring | `backend/main.py:453-467` | Level alignment bonuses |
| Candidate Filtering | `frontend/src/components/PositionGrid.tsx:110-114` | Frontend threshold (>=30%) |

---

## 3. QUESTION GENERATION

| Entry | Files | Description |
|-------|-------|-------------|
| Question Bank Structure | `backend/questions/python.json`, `backend/questions/java.json` | Pre-defined questions |
| Question Selection | `backend/core/question_manager.py:31-50` | Topic-based, no duplicates |
| AI Question Generation | `backend/llm/gemini_client.py` | Dynamic question creation |
| First Question Logic | `backend/core/interview_controller.py:42-45` | Resume-based personalization |
| Question Types | `backend/models/question_bank.json` | true_false, multiple_choice, open_ended, coding |

---

## 4. FOLLOW-UP STRATEGIES

| Entry | Files | Description |
|-------|-------|-------------|
| Strategy Factory | `backend/strategies/strategy_factory.py` | Strategy selection logic |
| Depth Focused | `backend/strategies/depth_focused.py` | Deep dive on weak areas |
| Breadth Focused | `backend/strategies/breadth_focused.py` | Cover more topics |
| Clarification | `backend/strategies/clarification.py` | Ask for more details |
| Challenge | `backend/strategies/challenge.py` | Harder follow-ups |
| Strategy Selection Rules | `backend/strategies/strategy_factory.py:33-67` | Score-based selection |

---

## 5. EVALUATION & SCORING

| Entry | Files | Description |
|-------|-------|-------------|
| Evaluator Engine | `backend/evaluation/evaluator.py` | Main evaluation orchestrator |
| Scoring Algorithms | `backend/evaluation/scoring_algorithms.py` | True/False, MCQ, Open-ended |
| Keyword Coverage | `backend/evaluation/scoring_algorithms.py:32-39` | Expected keyword matching |
| Completeness Scoring | `backend/evaluation/scoring_algorithms.py:56-60` | Length + keywords |
| LLM Evaluation | `backend/evaluation/evaluator.py:45-46` | Gemini-assisted assessment |
| Overall Score Calculation | `backend/evaluation/evaluator.py:48-66` | Weighted average |

---

## 6. DATA MODELS

| Entry | Files | Description |
|-------|-------|-------------|
| Organization Structure | `backend/models/organizations.json` | EPAM → Accounts hierarchy |
| Account Model | `backend/models/accounts.json` | Client accounts with positions |
| Position Model | `backend/models/positions.json` | Job with data_model config |
| Position Data Model | `backend/models/positions.json` (data_model field) | Duration, skills, flow, distribution |
| Question Bank Schema | `backend/models/question_bank.json` | Categories, difficulty, skills |
| Resume Model | `backend/resumes/resumes.json` | Candidate skills, experience |
| Position Templates | `backend/models/position_templates.json` | Reusable configurations |

---

## 7. API ENDPOINTS

| Entry | Files | Description |
|-------|-------|-------------|
| Organization APIs | `backend/main.py:182-202` | GET /api/organizations |
| Account CRUD | `backend/main.py:204-290` | Create, Read, Update, Delete accounts |
| Position CRUD | `backend/main.py:292-420` | Position management |
| Candidate APIs | `backend/main.py:485-519` | Match scores, resume details |
| Template APIs | `backend/main.py:538-595` | Position templates |
| Question Bank APIs | `backend/main.py:599-631` | Skills taxonomy |
| Interview APIs | `backend/main.py:634-698` | Start interview |
| Expert Mode APIs | `backend/main.py:1024-1118` | Approve/Edit/Override |
| WebSocket | `backend/main.py:701-942` | Real-time interview communication |

---

## 8. EXPERT MODE

| Entry | Files | Description |
|-------|-------|-------------|
| Expert Mode Flow | `backend/core/interview_controller.py:37-40` | Pending approval system |
| Approve Follow-up | `backend/main.py:1024-1048` | POST /api/expert/approve |
| Edit Follow-up | `backend/main.py:1051-1079` | POST /api/expert/edit |
| Override Follow-up | `backend/main.py:1082-1107` | POST /api/expert/override |
| Pending State | `backend/main.py:1110-1118` | GET pending questions |

---

## 9. LLM INTEGRATION

| Entry | Files | Description |
|-------|-------|-------------|
| Gemini Client | `backend/llm/gemini_client.py` | Model initialization |
| Language Analysis | `backend/llm/gemini_client.py:32-68` | JD/Resume → Java/Python detection |
| Follow-up Generation | `backend/llm/gemini_client.py` | AI-generated questions |
| Evaluation Prompts | `backend/llm/gemini_client.py` | Assessment prompts |
| Model Fallback | `backend/llm/gemini_client.py:14-30` | Multiple model attempts |

---

## 10. FRONTEND COMPONENTS

| Entry | Files | Description |
|-------|-------|-------------|
| Dashboard Page | `frontend/src/app/page.tsx` | Main landing page |
| Interview Page | `frontend/src/app/interview/page.tsx` | Live interview UI |
| Quick Start | `frontend/src/app/quick-start/page.tsx` | Direct JD/Resume upload |
| Candidate View | `frontend/src/components/CandidateView.tsx` | Candidate interview UI |
| Admin Dashboard | `frontend/src/components/AdminDashboard.tsx` | Expert controls |
| Code Editor | `frontend/src/components/CodeEditor.tsx` | Monaco editor for coding questions |
| Position Grid | `frontend/src/components/PositionGrid.tsx` | Position cards with filters |
| Account Grid | `frontend/src/components/AccountGrid.tsx` | Account cards with filters |
| Data Model Panel | `frontend/src/components/DataModelPanel.tsx` | Interview configuration |
| Candidate Selector | `frontend/src/components/CandidateSelector.tsx` | Candidate matching display |

---

## 11. UI/UX FEATURES

| Entry | Files | Description |
|-------|-------|-------------|
| Theme Toggle | `frontend/src/components/ThemeToggle.tsx`, `frontend/src/contexts/ThemeContext.tsx` | Dark/Light mode |
| EPAM Branding | `frontend/tailwind.config.js`, `frontend/src/app/globals.css` | Color scheme, fonts |
| Search & Filters | `frontend/src/components/SearchBar.tsx`, `frontend/src/components/FilterChips.tsx` | Scalable lists |
| Detail Sidebar | `frontend/src/components/AccountDetail.tsx`, `frontend/src/components/PositionDetail.tsx` | Inline panels |
| Add Modals | `frontend/src/components/AddAccountModal.tsx`, `frontend/src/components/AddPositionModal.tsx` | Creation forms |

---

## 12. LOGGING & ANALYTICS

| Entry | Files | Description |
|-------|-------|-------------|
| Logger | `backend/utils/logger.py` | Session logging |
| Log Structure | `backend/logs/log.json` | Interview transcripts |
| Time Metrics | `frontend/src/components/TimeMetrics.tsx` | Response time tracking |
| Live Scores | `frontend/src/components/LiveScores.tsx` | Real-time scoring display |

---

## How to Add New Features to Wiki

When implementing a new feature:

1. **Identify the category** it belongs to (or create a new one)
2. **Add entry** to this file with:
   - Entry name
   - File path(s)
   - Brief description
3. **After implementation**, run the wiki re-indexer to generate documentation

---

## Category Tree

```
Wiki Categories:
├── 1. Interview Flow (5 entries)
├── 2. Candidate Matching (4 entries)
├── 3. Question Generation (5 entries)
├── 4. Follow-up Strategies (6 entries)
├── 5. Evaluation & Scoring (6 entries)
├── 6. Data Models (7 entries)
├── 7. API Endpoints (9 entries)
├── 8. Expert Mode (5 entries)
├── 9. LLM Integration (5 entries)
├── 10. Frontend Components (10 entries)
├── 11. UI/UX Features (5 entries)
└── 12. Logging & Analytics (4 entries)

Total: 12 Categories, 71 Entries
```


