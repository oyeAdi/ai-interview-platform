# Grand Refactoring Plan - Interview Platform Modernization

## Executive Summary

**Goal**: Transform the interview platform into a production-ready, scalable system using the Strangler Fig Pattern while maintaining all existing functionality.

**Core Principles**: YAGNI, DRY, KISS, SOLID, **TDD (Test-Driven Development)**
**Strategy**: Strangler Fig Pattern - Build new alongside old, gradually migrate
**Development Approach**: **Test-Driven Development (TDD)** - Write tests first, then implementation
**Timeline**: Phased approach with incremental delivery

---

## Current State Analysis

### What's Working ✅
- Basic interview flow (QSM mode)
- Question generation and evaluation
- Dynamic follow-ups
- Expert mode with HITL approval
- Timer and progress tracking
- WebSocket communication
- Admin dashboard
- Session storage (basic)

### Critical Issues 🔴
1. **Architecture**: Spaghetti code, tight coupling, low cohesion
2. **Hardcoding**: Magic constants everywhere (frontend & backend)
3. **Concurrency**: No handling for concurrent users
4. **Scalability**: Cannot handle 20-30 concurrent users
5. **Session Management**: Incomplete SSOT implementation
6. **Authentication**: No login system
7. **Configuration**: QSM and CCM treated as separate modes
8. **Planning Phase**: Missing expert review workflow
9. **Multi-Agent System**: Not implemented
10. **Email System**: Using QR codes instead of proper email

---

## Vision: Three-Phase Interview System

### 1. PLANNING Phase
**Owner**: Expert (Technical Interviewer)
**Flow**:
```
Expert Login → Select Mode (QSM/CCM) → Configure Interview → 
LLM Generates Plan → Multi-Agent Critique → Expert Reviews Plan → 
Expert Edits Email → Send Invitation → Session Created (state: invitation_sent)
```

### 2. EXECUTION Phase
**Owner**: System + Expert (monitoring)
**Flow**:
```
Candidate Joins (state: in_progress) → Questions Asked → 
Responses Evaluated → Dynamic Follow-ups → Expert HITL (if enabled) → 
Session Updated Continuously → Interview Ends
```

### 3. EVALUATION Phase
**Owner**: System + Expert
**Flow**:
```
Generate Comprehensive Report → Expert Reviews → 
Add Final Feedback → Session Finalized (state: completed) → 
Learnings Stored for Future Interviews
```

---

## Evaluation System v2.0 (HITL-Centric)

> **IMPORTANT CHANGE**: Removing deterministic scoring entirely. New system is HITL-centric with LLM + Critique + Expert approval.

### Old System (Deprecated) ❌
```
Deterministic Scoring (30%) + LLM Evaluation (70%) = Final Score
- Deterministic: completeness, accuracy, depth, clarity, relevance
- LLM: 3 frameworks (coding/behavioral/conceptual)
- Adaptive weighting based on score gap
```

### New System (v2.0) ✅
```
┌─────────────────────────────────────────────────┐
│  RESPONSE EVALUATION FLOW                       │
├─────────────────────────────────────────────────┤
│                                                 │
│  1. LLM SCORING (Primary Evaluator)             │
│     → Score (0-100)                             │
│     → Reasoning (one sentence)                  │
│     → Strengths (1-2 points)                    │
│     → Improvements (1-2 points)                 │
│     → Uses 3 frameworks:                        │
│        • Coding (40% code, 30% depth, 20% PS)   │
│        • Behavioral (35% comm, 25% STAR)        │
│        • Technical (40% accuracy, 25% explain)  │
│                                                 │
│  2. CRITIQUE AGENT (Quality Check)              │
│     → Reviews LLM score for accuracy            │
│     → Identifies potential biases               │
│     → Suggests score adjustments                │
│     → Flags edge cases/ambiguities              │
│     → Confidence score (0.0-1.0)                │
│                                                 │
│  3. HITL APPROVAL (Expert/Admin)                │
│     ┌─────────────────────────────────────┐    │
│     │ ✓ APPROVE                           │    │
│     │   - Accept LLM score + critique     │    │
│     │   - No feedback stored              │    │
│     │                                     │    │
│     │ ✏️ EDIT SCORE                        │    │
│     │   - Modify LLM score                │    │
│     │   - Provide reason                  │    │
│     │   - Agree/disagree with critique    │    │
│     │   - Triggers learning                │    │
│     │                                     │    │
│     │ ✍️ OVERRIDE                          │    │
│     │   - Complete rewrite                │    │
│     │   - New score + reasoning           │    │
│     │   - New strengths/improvements      │    │
│     │   - Override reason                 │    │
│     │   - Triggers learning                │    │
│     └─────────────────────────────────────┘    │
│                                                 │
│  4. LEARNING SYSTEM                             │
│     → Stores all HITL feedback                  │
│     → Learns from score adjustments             │
│     → Improves LLM prompts                      │
│     → Builds evaluation knowledge base          │
│                                                 │
└─────────────────────────────────────────────────┘
```

### UI Changes
**Old UI** (Deprecated):
- Showed deterministic scores breakdown
- LLM evaluation as secondary info

**New UI** (v2.0):
- **Primary Display**: LLM Score + Reasoning
- **Secondary Display**: Critique Agent Feedback (replaces deterministic scores)
- **HITL Actions**: Approve / Edit / Override buttons
- **Learning Indicator**: Shows when feedback is being used for learning

### Why This Change?
1. **HITL is the safety net**: Expert approval catches LLM errors
2. **Simpler system**: One evaluation source (LLM) instead of two
3. **Better learning**: Direct feedback on LLM performance
4. **Critique agent**: Provides quality check without complex deterministic rules
5. **Cleaner UI**: Shows what matters (LLM + Critique) not internal calculations

---

## Questions for You - Please Answer

### 1. QSM Defaults
What should be the defaults for Quick Start Mode?
- Duration: 45 minutes? ✓
- Total questions: 3? ✓
- Question distribution: 1 coding, 1 conceptual, 1 system design? ✓
- Max followups: 10 per question? ✓
- Difficulty: 20% easy, 50% medium, 30% hard? ✓
- **Any other defaults you want?**

### 2. Platform Capabilities
From your existing JDs and question bank:
- **Languages supported?** (I see Python, Java - any others?)
- **Question categories?** (coding, conceptual, system_design - any others like debugging, behavioral?)
- **Difficulty levels?** (junior, mid, senior, staff?)
- **Max questions per category?**

### 3. Multi-Agent System
For the Planning Phase critique:
- Should Critique Agent always run, or only in CCM mode?
- How many critique iterations before showing to Expert?
- Should we show Expert both original and critiqued plans?

### 4. Email Template
What should the invitation email include?
- Interview date/time?
- Duration?
- Position title?
- Preparation tips?
- Technical requirements (browser, internet speed)?
- Company branding?

### 5. Concurrency Limits
- Expected concurrent users: 100?
- Rate limiting: 100 requests per minute per IP?
- WebSocket connections per session: 5 max?

---

## Implementation Strategy: Strangler Fig Pattern

### Why Strangler Fig?
- Build new system alongside old
- Zero downtime migration
- Gradual traffic routing
- Easy rollback if issues
- Existing features keep working

### Phase-by-Phase Migration

#### **Phase 1: Foundation (Weeks 1-2)**
**Goal**: Build core services without breaking anything

**Deliverables**:
1. Platform Capabilities Registry (`platform_capabilities.json`)
2. Authentication Service (stub implementation)
3. Enhanced Session Schema v2.0
4. Configuration Service (unified QSM/CCM)
5. Concurrency middleware

**Migration**: None yet, just building foundation

---

#### **Phase 2: Planning Phase (Weeks 3-4)**
**Goal**: Implement complete Planning workflow

**Deliverables**:
1. Planning Service
2. Multi-Agent System (Controller → Critique → Learning)
3. Email Service (stub)
4. Expert Login UI
5. Interview Configuration UI
6. Plan Review UI
7. Email Editor UI

**Migration**: Route new interviews through Planning Phase, old interviews continue as-is

---

#### **Phase 3: Enhanced Execution (Weeks 5-6)**
**Goal**: Improve execution with SSOT updates

**Deliverables**:
1. Real-time SSOT updates
2. Behavioral analytics tracking
3. Code submission tracking
4. Enhanced evaluation with full context
5. Improved WebSocket handling with concurrency

**Migration**: New sessions use enhanced execution, old sessions continue

---

#### **Phase 4: Evaluation Phase (Weeks 7-8)**
**Goal**: Comprehensive reporting and learning

**Deliverables**:
1. Evaluation Service
2. Report Generator
3. Expert Review UI
4. Learning Storage System
5. Historical Analysis

**Migration**: All new sessions use full three-phase system

---

#### **Phase 5: Cleanup & Optimization (Weeks 9-10)**
**Goal**: Remove old code, optimize performance

**Deliverables**:
1. Remove deprecated code
2. Performance optimization
3. Load testing (100+ concurrent users)
4. Production deployment
5. Monitoring & alerts

**Migration**: Complete - old code removed

---

## Detailed Component Design

### 1. Platform Capabilities Registry
**File**: `backend/config/platform_capabilities.json`
**Purpose**: Single source of truth for what platform supports

**Key Sections**:
- Supported languages & versions
- Question categories & time allocations
- Difficulty levels & thresholds
- Interview modes (QSM/CCM) with defaults
- Followup strategies
- Evaluation criteria
- Concurrency limits

### 2. Authentication Service
**File**: `backend/services/auth_service.py`
**Purpose**: Modular authentication (stub for now)

**Features**:
- Login/logout
- Token validation
- Role-based access control (Expert, Admin, Candidate)
- Stub implementation with hardcoded expert user

### 3. Enhanced Session Schema v2.0
**File**: `backend/models/session_schema.py`
**Purpose**: Complete SSOT for interview data

**Major Sections**:
- Core identity & state
- Expert ownership
- Configuration
- Candidate information
- Position details
- **Planning phase data** (new)
  - LLM plan
  - Multi-agent critique
  - Expert HITL feedback
  - Learning analysis
  - Invitation details
- **Execution phase data** (enhanced)
  - Current state
  - Transcript with rich metadata
  - Behavioral analytics
  - Code submissions
  - Timings
  - Strategy performance
  - Skills assessment
  - Live metrics
- **Evaluation phase data** (new)
  - Comprehensive report
  - Per-question analysis
  - Expert final feedback
  - Learnings for future
- Audit trail (events)
- HITL feedback history

### 4. Multi-Agent System
**Files**: 
- `backend/agents/interview_controller_agent.py`
- `backend/agents/critique_agent.py`
- `backend/agents/learning_agent.py`

**Flow**:
```
Interview Controller Agent:
  ↓ (generates initial plan)
Critique Agent:
  ↓ (analyzes & improves plan)
Interview Controller Agent:
  ↓ (presents to expert)
Expert HITL:
  ↓ (approves/modifies)
Learning Agent:
  ↓ (analyzes why changes were made)
Store Learnings → Future Improvements
```

### 5. Email Service
**File**: `backend/services/email_service.py`
**Purpose**: Send interview invitations

**Features** (stub for now):
- Generate email content via LLM
- Allow expert to edit
- Send email (stub: show alert)
- Track email state in SSOT

### 6. Configuration Service
**File**: `backend/services/config_service.py`
**Purpose**: Unified handling of QSM and CCM

**Key Insight**: QSM is just CCM with defaults pre-filled
```python
def get_interview_config(mode: str, overrides: Dict = None):
    if mode == "quick_start":
        config = load_qsm_defaults()
    else:
        config = {}
    
    if overrides:
        config.update(overrides)
    
    return config
```

---

## Code Quality Standards

### SOLID Principles

**S - Single Responsibility**
- Each service has one clear purpose
- SessionManager only manages sessions
- AuthService only handles authentication
- PlanningService only handles planning phase

**O - Open/Closed**
- Services open for extension, closed for modification
- Use interfaces/protocols for extensibility
- Strategy pattern for followup strategies

**L - Liskov Substitution**
- Stub implementations can replace real ones
- AuthService stub works exactly like real auth would

**I - Interface Segregation**
- Small, focused interfaces
- Don't force classes to implement unused methods

**D - Dependency Inversion**
- Depend on abstractions, not concretions
- Services use interfaces, not direct imports

### DRY, KISS, YAGNI

**DRY (Don't Repeat Yourself)**
- Extract common logic into utilities
- Reuse configuration from `platform_capabilities.json`
- Single source of truth for all data

**KISS (Keep It Simple, Stupid)**
- Simple, readable code
- Avoid over-engineering
- Clear naming conventions

**YAGNI (You Aren't Gonna Need It)**
- Build only what's needed now
- Don't add features for "future maybe"
- Iterate based on actual needs

---

## Concurrency & Scalability

### Issues to Fix
1. **No connection pooling** → Add database connection pool
2. **No rate limiting** → Add rate limiter middleware
3. **No WebSocket limits** → Limit connections per session
4. **No request queuing** → Add async task queue
5. **Blocking operations** → Use async/await everywhere

### Solutions

**1. Rate Limiting**
```python
from slowapi import Limiter
limiter = Limiter(key_func=get_remote_address)

@app.post("/api/interview/start")
@limiter.limit("10/minute")
async def start_interview():
    ...
```

**2. WebSocket Connection Limits**
```python
class ConnectionManager:
    MAX_CONNECTIONS_PER_SESSION = 5
    
    async def connect(self, websocket, session_id):
        if len(self.connections[session_id]) >= self.MAX_CONNECTIONS_PER_SESSION:
            raise ConnectionError("Max connections reached")
        ...
```

**3. Async Operations**
```python
# Bad (blocking)
def generate_plan(config):
    plan = llm_client.generate(config)  # Blocks
    return plan

# Good (non-blocking)
async def generate_plan(config):
    plan = await llm_client.generate_async(config)
    return plan
```

**4. Background Tasks**
```python
from fastapi import BackgroundTasks

@app.post("/api/interview/end")
async def end_interview(background_tasks: BackgroundTasks):
    background_tasks.add_task(generate_report, session_id)
    return {"status": "processing"}
```

---

## Frontend Refactoring

### Issues
- Hardcoded URLs
- Hardcoded constants
- Bulky components
- No code splitting
- Slow rendering

### Solutions

**1. Environment Configuration**
```typescript
// config/env.ts
export const config = {
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000',
  MAX_QUESTIONS: 10,
  DEFAULT_DURATION: 45
}
```

**2. Component Decomposition**
```typescript
// Bad: One huge AdminDashboard component

// Good: Smaller, focused components
<AdminDashboard>
  <Header />
  <QuestionPanel />
  <ResponsePanel />
  <EvaluationPanel />
  <TimerPanel />
  <MetricsPanel />
</AdminDashboard>
```

**3. Code Splitting**
```typescript
const AdminDashboard = lazy(() => import('./AdminDashboard'))
const CandidateView = lazy(() => import('./CandidateView'))
```

**4. Constants File**
```typescript
// constants/interview.ts
export const INTERVIEW_STATES = {
  PLANNING: 'planning',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
} as const

export const QUESTION_TYPES = {
  CODING: 'coding',
  CONCEPTUAL: 'conceptual',
  SYSTEM_DESIGN: 'system_design'
} as const
```

---

## Test-Driven Development (TDD) Strategy 🧪

### Why TDD is VVIP
- **Catch bugs early** - Before they reach production
- **Prevent regressions** - Tests ensure old features don't break
- **Better design** - Writing tests first leads to better architecture
- **Documentation** - Tests serve as living documentation
- **Confidence** - Deploy with confidence knowing tests pass
- **Refactoring safety** - Refactor without fear of breaking things

### TDD Workflow

**Red → Green → Refactor**

```
1. RED: Write a failing test
   ↓
2. GREEN: Write minimal code to make it pass
   ↓
3. REFACTOR: Improve code while keeping tests green
   ↓
Repeat
```

### Test Structure

#### Backend Tests (`backend/tests/`)

```
backend/tests/
├── unit/                      # Unit tests (fast, isolated)
│   ├── test_auth_service.py
│   ├── test_session_manager.py
│   ├── test_config_service.py
│   ├── test_planning_service.py
│   ├── test_agents/
│   │   ├── test_controller_agent.py
│   │   ├── test_critique_agent.py
│   │   └── test_learning_agent.py
│   └── test_utils/
│
├── integration/               # Integration tests (services working together)
│   ├── test_planning_flow.py
│   ├── test_execution_flow.py
│   ├── test_evaluation_flow.py
│   └── test_multi_agent_system.py
│
├── e2e/                       # End-to-end tests (full workflows)
│   ├── test_complete_interview.py
│   ├── test_expert_workflow.py
│   └── test_concurrent_interviews.py
│
├── load/                      # Load/performance tests
│   ├── test_concurrent_users.py
│   └── test_websocket_load.py
│
└── conftest.py               # Pytest fixtures and configuration
```

#### Frontend Tests (`frontend/tests/`)

```
frontend/tests/
├── unit/                      # Component unit tests
│   ├── AdminDashboard.test.tsx
│   ├── CandidateView.test.tsx
│   ├── TimeMetrics.test.tsx
│   └── components/
│
├── integration/               # Integration tests
│   ├── interview-flow.test.tsx
│   └── websocket.test.tsx
│
└── e2e/                       # Playwright/Cypress E2E tests
    ├── expert-login.spec.ts
    ├── planning-phase.spec.ts
    ├── interview-execution.spec.ts
    └── evaluation-phase.spec.ts
```

### Testing Tools & Frameworks

**Backend**:
- **pytest** - Test framework
- **pytest-asyncio** - Async test support
- **pytest-cov** - Coverage reporting
- **pytest-mock** - Mocking
- **faker** - Test data generation
- **locust** - Load testing

**Frontend**:
- **Jest** - Test framework
- **React Testing Library** - Component testing
- **Playwright** - E2E testing
- **MSW (Mock Service Worker)** - API mocking

### Test Coverage Requirements

**Minimum Coverage**: 80% overall
**Critical Paths**: 95%+ coverage

```
Critical Paths:
- Authentication flow
- Session creation & management
- Question generation & evaluation
- Multi-agent system
- WebSocket communication
- Timer & state management
```

### Example: TDD for AuthService

**Step 1: Write Test First (RED)**
```python
# backend/tests/unit/test_auth_service.py
import pytest
from services.auth_service import AuthService, UserRole

def test_login_with_valid_credentials():
    """Test that expert can login with correct credentials"""
    auth_service = AuthService()
    
    result = auth_service.login("expert@company.com", "expert123")
    
    assert result is not None
    assert result["email"] == "expert@company.com"
    assert result["role"] == UserRole.EXPERT.value
    assert "token" in result

def test_login_with_invalid_credentials():
    """Test that login fails with wrong password"""
    auth_service = AuthService()
    
    result = auth_service.login("expert@company.com", "wrong_password")
    
    assert result is None

def test_validate_token_with_valid_token():
    """Test token validation with valid token"""
    auth_service = AuthService()
    
    # First login to get token
    login_result = auth_service.login("expert@company.com", "expert123")
    token = login_result["token"]
    
    # Validate token
    result = auth_service.validate_token(token)
    
    assert result is not None
    assert result["email"] == "expert@company.com"

def test_require_role_with_correct_role():
    """Test role check with correct role"""
    auth_service = AuthService()
    
    login_result = auth_service.login("expert@company.com", "expert123")
    token = login_result["token"]
    
    has_role = auth_service.require_role(token, UserRole.EXPERT)
    
    assert has_role is True
```

**Step 2: Implement Code (GREEN)**
```python
# backend/services/auth_service.py
# (Implementation shown in plan above)
```

**Step 3: Run Tests**
```bash
pytest backend/tests/unit/test_auth_service.py -v
```

**Step 4: Refactor (if needed)**
- Improve code quality
- Extract common logic
- Optimize performance
- **Tests must still pass!**

### Example: TDD for Session Manager

```python
# backend/tests/unit/test_session_manager.py
import pytest
from core.session_manager import SessionManager
from models.session_schema import SessionState

@pytest.fixture
def session_manager():
    """Fixture to create SessionManager instance"""
    return SessionManager()

def test_create_session_with_valid_data(session_manager):
    """Test session creation with valid configuration"""
    session_id = "test_session_001"
    expert_id = "expert_001"
    config = {
        "mode": "quick_start",
        "language": "python",
        "position_id": "pos_001"
    }
    
    session = session_manager.create_session(session_id, expert_id, config)
    
    assert session["id"] == session_id
    assert session["expert"]["id"] == expert_id
    assert session["state"] == SessionState.PLANNING.value
    assert session["config"]["mode"] == "quick_start"

def test_update_session_state(session_manager):
    """Test updating session state"""
    session_id = "test_session_001"
    session_manager.create_session(session_id, "expert_001", {})
    
    session_manager.update_state(session_id, SessionState.IN_PROGRESS)
    
    session = session_manager.load_session(session_id)
    assert session["state"] == SessionState.IN_PROGRESS.value

def test_add_timing_entry(session_manager):
    """Test adding timing data to session"""
    session_id = "test_session_001"
    session_manager.create_session(session_id, "expert_001", {})
    
    session_manager.start_question_timer(
        session_id, 
        question_id="q1",
        question_number=1
    )
    
    session = session_manager.load_session(session_id)
    assert len(session["execution"]["timings"]) == 1
    assert session["execution"]["timings"][0]["question_id"] == "q1"
```

### Integration Test Example

```python
# backend/tests/integration/test_planning_flow.py
import pytest
from services.auth_service import AuthService
from services.planning_service import PlanningService
from services.config_service import ConfigService

@pytest.mark.asyncio
async def test_complete_planning_flow():
    """Test complete planning phase workflow"""
    # 1. Expert logs in
    auth_service = AuthService()
    login_result = auth_service.login("expert@company.com", "expert123")
    assert login_result is not None
    
    # 2. Expert selects QSM mode
    config_service = ConfigService()
    config = config_service.get_interview_config("quick_start")
    assert config["duration_minutes"] == 45
    
    # 3. Planning service generates plan
    planning_service = PlanningService()
    plan = await planning_service.generate_plan(config)
    assert plan is not None
    assert "questions_planned" in plan
    
    # 4. Critique agent reviews plan
    critiqued_plan = await planning_service.critique_plan(plan)
    assert critiqued_plan is not None
    
    # 5. Expert reviews and approves
    final_plan = planning_service.apply_expert_feedback(
        critiqued_plan,
        approved=True,
        modifications=[]
    )
    assert final_plan["expert_approved"] is True
```

### Load Test Example

```python
# backend/tests/load/test_concurrent_users.py
from locust import HttpUser, task, between

class InterviewUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        """Login before starting tasks"""
        response = self.client.post("/api/auth/login", json={
            "email": "expert@company.com",
            "password": "expert123"
        })
        self.token = response.json()["token"]
    
    @task(3)
    def create_interview(self):
        """Create new interview session"""
        self.client.post("/api/interview/create", 
            headers={"Authorization": f"Bearer {self.token}"},
            json={
                "mode": "quick_start",
                "language": "python",
                "position_id": "pos_001"
            }
        )
    
    @task(1)
    def get_session(self):
        """Get session data"""
        self.client.get(f"/api/session/{self.session_id}",
            headers={"Authorization": f"Bearer {self.token}"}
        )

# Run: locust -f test_concurrent_users.py --users 100 --spawn-rate 10
```

### CI/CD Integration

**GitHub Actions Workflow** (`.github/workflows/test.yml`):

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.10'
      
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install pytest pytest-cov pytest-asyncio
      
      - name: Run tests with coverage
        run: |
          cd backend
          pytest tests/ --cov=. --cov-report=xml --cov-report=term
      
      - name: Check coverage threshold
        run: |
          cd backend
          coverage report --fail-under=80
  
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Set up Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Run tests
        run: |
          cd frontend
          npm test -- --coverage --watchAll=false
      
      - name: Check coverage
        run: |
          cd frontend
          npm run test:coverage
```

### Pre-commit Hooks

**`.pre-commit-config.yaml`**:

```yaml
repos:
  - repo: local
    hooks:
      - id: pytest
        name: pytest
        entry: pytest
        language: system
        pass_filenames: false
        always_run: true
        args: [backend/tests/, -v, --tb=short]
      
      - id: jest
        name: jest
        entry: npm
        language: system
        pass_filenames: false
        always_run: true
        args: [test, --bail, --findRelatedTests]
```

### Test Naming Conventions

**Backend**:
```python
def test_<function_name>_<scenario>_<expected_result>():
    """Clear description of what is being tested"""
    # Arrange
    # Act
    # Assert
```

**Frontend**:
```typescript
describe('ComponentName', () => {
  it('should <expected behavior> when <scenario>', () => {
    // Arrange
    // Act
    // Assert
  })
})
```

### Coverage Reports

**Generate Coverage Report**:
```bash
# Backend
cd backend
pytest --cov=. --cov-report=html
open htmlcov/index.html

# Frontend
cd frontend
npm test -- --coverage
open coverage/lcov-report/index.html
```

### TDD Checklist for Each Feature

- [ ] Write failing test first
- [ ] Run test to confirm it fails
- [ ] Write minimal code to pass test
- [ ] Run test to confirm it passes
- [ ] Refactor code if needed
- [ ] Run all tests to ensure no regressions
- [ ] Check coverage meets threshold (80%+)
- [ ] Commit with test and implementation together

---

## Next Immediate Steps

1. **Answer the questions above** so I can create accurate configs
2. **Review this plan** - any changes needed?
3. **Start Phase 1** - Build foundation services

Once you approve, I'll start implementing:
1. `platform_capabilities.json` with your specifications
2. `AuthService` stub
3. Enhanced `SessionSchema` v2.0
4. `ConfigurationService` (unified QSM/CCM)
5. Concurrency middleware

Should I proceed?
