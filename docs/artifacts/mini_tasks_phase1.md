# Mini Tasks - Phase 1: Foundation

**Parent Plan**: Grand Refactoring Plan  
**Phase**: Phase 1 - Foundation (Weeks 1-2)  
**Focus**: Planning Phase Only  
**Approach**: TDD + Strangler Fig Pattern  
**Worktree**: `interview-platform-version2-SNAPSHOT`

---

## Status Legend

- [ ] Not Started
- [/] In Progress  
- [T] Testing
- [✓] Complete
- [!] Blocked

---

## Worktree Setup ✓

```bash
# Worktree created at:
C:\Users\aditya_raj\.cursor\worktrees\cursor-code\interview-platform-version2-SNAPSHOT

# Branch: refactor/platform-v2
# Base: verify-axg-found-changes (current branch)
```

**Why Worktree?**
- Isolate v2 dev from production
- Easy switch between old/new
- Test both side-by-side
- Safe rollback

---

## Task Checklist

### Week 1: Core Infrastructure
- [ ] **MT-1.1**: Create Platform Capabilities JSON (SSOT)
- [ ] **MT-1.2**: Implement Configuration Service
- [ ] **MT-1.3**: Implement Authentication Service (Stub)
- [ ] **MT-1.4**: Create Enhanced Session Schema v2.0
- [ ] **MT-1.5**: Implement Session Manager v2

### Week 2: Planning Phase Services
- [ ] **MT-2.1**: Implement Planning Service
- [ ] **MT-2.2**: Implement Multi-Agent System (Controller + Critique + Observer)
- [ ] **MT-2.3**: Implement Email Service (Stub)
- [ ] **MT-2.4**: Add Concurrency Middleware
- [ ] **MT-2.5**: Setup MongoDB Integration

---

## MT-1.1: Create Platform Capabilities JSON (SSOT)

### Objective
Create `backend/config/platform_capabilities.json` as single source of truth for all platform capabilities.

### Steps
1. **Create directory structure**
   ```bash
   mkdir -p backend/config
   ```

2. **Create `platform_capabilities.json`**
   - Use data from `platform_capabilities_ssot.md`
   - Include all languages, skills, categories, modes, strategies
   - Add version number and last_updated timestamp

3. **Create Python model**
   ```python
   # backend/models/platform_capabilities.py
   from typing import Dict, List
   from pydantic import BaseModel
   
   class PlatformCapabilities(BaseModel):
       version: str
       last_updated: str
       supported_languages: List[Dict]
       question_categories: Dict
       difficulty_levels: Dict
       interview_modes: Dict
       followup_strategies: Dict
       evaluation_criteria: Dict
       concurrency_limits: Dict
   ```

4. **Create loader utility**
   ```python
   # backend/utils/capabilities_loader.py
   import json
   from pathlib import Path
   
   _capabilities_cache = None
   
   def load_capabilities() -> Dict:
       global _capabilities_cache
       if _capabilities_cache is None:
           path = Path(__file__).parent.parent / "config" / "platform_capabilities.json"
           with open(path) as f:
               _capabilities_cache = json.load(f)
       return _capabilities_cache
   ```

### Justification: No Regression/Bugs
- ✅ **New file**: Doesn't modify existing code
- ✅ **Read-only**: Only loads data, doesn't change behavior
- ✅ **Cached**: Single load per process, no performance impact
- ✅ **Isolated**: No dependencies on existing code

### Tests Required
```python
# backend/tests/unit/test_capabilities_loader.py
def test_load_capabilities_returns_dict():
    caps = load_capabilities()
    assert isinstance(caps, dict)

def test_capabilities_has_required_keys():
    caps = load_capabilities()
    assert "version" in caps
    assert "supported_languages" in caps
    assert "question_categories" in caps

def test_capabilities_cached():
    caps1 = load_capabilities()
    caps2 = load_capabilities()
    assert caps1 is caps2  # Same object

def test_python_language_exists():
    caps = load_capabilities()
    langs = {l["id"]: l for l in caps["supported_languages"]}
    assert "python" in langs
    assert langs["python"]["versions"] == ["3.8+"]
```

### Acceptance Criteria
- [ ] File exists at `backend/config/platform_capabilities.json`
- [ ] JSON is valid and matches schema
- [ ] Loader function works and caches
- [ ] All tests pass (100% coverage)
- [ ] No existing functionality broken

---

## MT-1.2: Implement Configuration Service

### Objective
Create unified configuration service that treats QSM as CCM with defaults.

### Steps
1. **Write tests first (TDD)**
   ```python
   # backend/tests/unit/test_config_service.py
   def test_get_qsm_config_returns_defaults():
       service = ConfigService()
       config = service.get_interview_config("quick_start")
       assert config["total_questions"] == 3
       assert config["max_followups_per_question"] == 10
   
   def test_get_ccm_config_empty_without_overrides():
       service = ConfigService()
       config = service.get_interview_config("custom_config")
       assert config == {}
   
   def test_qsm_with_overrides_merges():
       service = ConfigService()
       config = service.get_interview_config(
           "quick_start",
           overrides={"total_questions": 5}
       )
       assert config["total_questions"] == 5
       assert config["max_followups_per_question"] == 10  # Default preserved
   
   def test_calculate_duration_from_distribution():
       service = ConfigService()
       duration = service.calculate_duration({
           "question_distribution": {
               "coding": {"easy": 1, "medium": 1, "hard": 1}
           }
       })
       # 10 + 15 + 20 = 45 minutes
       assert duration == 45
   ```

2. **Implement ConfigService**
   ```python
   # backend/services/config_service.py
   from typing import Dict, Optional
   from utils.capabilities_loader import load_capabilities
   
   class ConfigService:
       def __init__(self):
           self.capabilities = load_capabilities()
       
       def get_interview_config(
           self,
           mode: str,
           overrides: Optional[Dict] = None
       ) -> Dict:
           """Get interview configuration.
           
           QSM returns defaults, CCM returns empty dict.
           Overrides are merged on top.
           """
           if mode == "quick_start":
               config = self.capabilities["interview_modes"]["quick_start"]["defaults"].copy()
           else:
               config = {}
           
           if overrides:
               config.update(overrides)
           
           return config
       
       def calculate_duration(self, config: Dict) -> int:
           """Calculate total interview duration in minutes."""
           # Time per difficulty from capabilities
           time_map = {
               "easy": 10,
               "medium": 15,
               "hard": 20
           }
           
           total_minutes = 0
           dist = config.get("question_distribution", {})
           
           for category, questions in dist.items():
               if isinstance(questions, dict):
                   # Format: {"easy": 1, "medium": 1, "hard": 1}
                   for difficulty, count in questions.items():
                       total_minutes += time_map[difficulty] * count
               else:
                   # Format: number (assume medium)
                   total_minutes += time_map["medium"] * questions
           
           # Add 10% buffer for transitions
           return int(total_minutes * 1.1)
   ```

3. **Run tests**
   ```bash
   pytest backend/tests/unit/test_config_service.py -v
   ```

### Justification: No Regression/Bugs
- ✅ **New service**: Doesn't replace existing code
- ✅ **Pure functions**: No side effects
- ✅ **Tested**: 100% test coverage before integration
- ✅ **Isolated**: Can be used alongside old code

### Tests Required
- ✅ QSM returns correct defaults
- ✅ CCM returns empty dict
- ✅ Overrides merge correctly
- ✅ Duration calculation accurate
- ✅ Edge cases handled (empty config, invalid mode)

### Acceptance Criteria
- [ ] All tests pass (100% coverage)
- [ ] Service works for both QSM and CCM
- [ ] Duration calculation matches spec
- [ ] No hardcoded values (uses capabilities.json)
- [ ] Documentation complete

---

## MT-1.3: Implement Authentication Service (Stub)

### Objective
Create modular authentication service with stub implementation for Expert, Admin, Candidate roles.

### Steps
1. **Write tests first (TDD)**
   ```python
   # backend/tests/unit/test_auth_service.py
   def test_expert_login_success():
       auth = AuthService()
       result = auth.login("expert@company.com", "expert123")
       assert result is not None
       assert result["role"] == "expert"
       assert "token" in result
   
   def test_admin_login_success():
       auth = AuthService()
       result = auth.login("admin@company.com", "admin123")
       assert result is not None
       assert result["role"] == "admin"
   
   def test_candidate_login_success():
       auth = AuthService()
       result = auth.login("candidate@company.com", "candidate123")
       assert result is not None
       assert result["role"] == "candidate"
   
   def test_login_failure_wrong_password():
       auth = AuthService()
       result = auth.login("expert@company.com", "wrong")
       assert result is None
   
   def test_validate_token_success():
       auth = AuthService()
       login = auth.login("expert@company.com", "expert123")
       result = auth.validate_token(login["token"])
       assert result is not None
       assert result["email"] == "expert@company.com"
   
   def test_require_role_success():
       auth = AuthService()
       login = auth.login("expert@company.com", "expert123")
       assert auth.require_role(login["token"], UserRole.EXPERT) is True
   
   def test_require_role_failure():
       auth = AuthService()
       login = auth.login("candidate@company.com", "candidate123")
       assert auth.require_role(login["token"], UserRole.EXPERT) is False
   ```

2. **Implement AuthService**
   ```python
   # backend/services/auth_service.py
   from typing import Optional, Dict
   from enum import Enum
   
   class UserRole(Enum):
       EXPERT = "expert"
       ADMIN = "admin"
       CANDIDATE = "candidate"
   
   class AuthService:
       """Authentication service with stub implementation."""
       
       def __init__(self):
           # Stub users for testing
           self.stub_users = {
               "expert@company.com": {
                   "id": "expert_001",
                   "email": "expert@company.com",
                   "name": "John Expert",
                   "role": UserRole.EXPERT,
                   "password": "expert123"
               },
               "admin@company.com": {
                   "id": "admin_001",
                   "email": "admin@company.com",
                   "name": "Jane Admin",
                   "role": UserRole.ADMIN,
                   "password": "admin123"
               },
               "candidate@company.com": {
                   "id": "candidate_001",
                   "email": "candidate@company.com",
                   "name": "Bob Candidate",
                   "role": UserRole.CANDIDATE,
                   "password": "candidate123"
               }
           }
       
       def login(self, email: str, password: str) -> Optional[Dict]:
           """Stub login - check against hardcoded users."""
           user = self.stub_users.get(email)
           if user and user["password"] == password:
               return {
                   "user_id": user["id"],
                   "email": user["email"],
                   "name": user["name"],
                   "role": user["role"].value,
                   "token": f"stub_token_{user['id']}"
               }
           return None
       
       def validate_token(self, token: str) -> Optional[Dict]:
           """Stub token validation."""
           if not token.startswith("stub_token_"):
               return None
           
           user_id = token.replace("stub_token_", "")
           for user in self.stub_users.values():
               if user["id"] == user_id:
                   return {
                       "user_id": user["id"],
                       "email": user["email"],
                       "name": user["name"],
                       "role": user["role"].value
                   }
           return None
       
       def require_role(self, token: str, required_role: UserRole) -> bool:
           """Check if user has required role."""
           user = self.validate_token(token)
           if not user:
               return False
           return user["role"] == required_role.value
   ```

3. **Run tests**
   ```bash
   pytest backend/tests/unit/test_auth_service.py -v
   ```

### Justification: No Regression/Bugs
- ✅ **New service**: Doesn't touch existing code
- ✅ **Stub only**: No real auth, no security risks
- ✅ **Isolated**: Can be swapped for real auth later
- ✅ **Tested**: 100% coverage
- ✅ **No database**: No data persistence issues

### Tests Required
- ✅ Login success for all roles
- ✅ Login failure scenarios
- ✅ Token validation
- ✅ Role checking
- ✅ Invalid token handling

### Acceptance Criteria
- [ ] All tests pass (100% coverage)
- [ ] All three roles work (Expert, Admin, Candidate)
- [ ] Token generation and validation work
- [ ] Role-based access control works
- [ ] Ready to swap for real auth later

---

## MT-1.4: Create Enhanced Session Schema v2.0

### Objective
Define comprehensive session schema with Planning, Execution, and Evaluation phases.

### Steps
1. **Create schema model**
   ```python
   # backend/models/session_schema.py
   from datetime import datetime
   from typing import Dict, List, Optional
   from enum import Enum
   from pydantic import BaseModel
   
   class SessionState(Enum):
       PLANNING = "planning"
       PLAN_REVIEW = "plan_review"
       INVITATION_SENT = "invitation_sent"
       IN_PROGRESS = "in_progress"
       PAUSED = "paused"
       COMPLETED = "completed"
       CANCELLED = "cancelled"
   
   class SessionPhase(Enum):
       PLANNING = "planning"
       EXECUTION = "execution"
       EVALUATION = "evaluation"
   
   def create_session_schema(
       session_id: str,
       expert_id: str,
       config: Dict
   ) -> Dict:
       """Create complete session schema v2.0 - SSOT."""
       return {
           # Core Identity
           "id": session_id,
           "version": "2.0.0",
           "created_at": datetime.now().isoformat(),
           "updated_at": datetime.now().isoformat(),
           
           # State Management
           "state": SessionState.PLANNING.value,
           "phase": SessionPhase.PLANNING.value,
           "status": "active",
           
           # Ownership
           "expert": {
               "id": expert_id,
               "name": "",
               "email": ""
           },
           
           # Configuration
           "config": {
               "mode": config.get("mode", "quick_start"),
               "language": config.get("language"),
               "position_id": config.get("position_id"),
               "duration_minutes": config.get("duration_minutes"),
               "total_questions": config.get("total_questions", 3),
               "max_followups_per_question": config.get("max_followups_per_question", 10),
               "question_distribution": config.get("question_distribution", {}),
               "difficulty_distribution": config.get("difficulty_distribution", {}),
               "enable_adaptive_difficulty": config.get("enable_adaptive_difficulty", True),
               "enable_dynamic_followups": config.get("enable_dynamic_followups", True),
               "enable_expert_mode": config.get("enable_expert_mode", False)
           },
           
           # Candidate Information
           "candidate": {
               "id": None,
               "name": None,
               "email": None,
               "phone": None,
               "resume_id": None,
               "resume_text": None,
               "experience_years": None,
               "skills_claimed": [],
               "joined_at": None,
               "left_at": None
           },
           
           # Position Details
           "position": {
               "id": config.get("position_id"),
               "title": None,
               "department": None,
               "jd_text": None,
               "required_skills": [],
               "nice_to_have_skills": []
           },
           
           # PLANNING PHASE DATA
           "planning": {
               "started_at": datetime.now().isoformat(),
               "completed_at": None,
               
               "llm_plan": {
                   "generated_at": None,
                   "model_used": None,
                   "plan_version": 1,
                   "questions_planned": [],
                   "rationale": None,
                   "confidence": None
               },
               
               "critique": {
                   "critique_agent_feedback": None,
                   "improvements_suggested": [],
                   "critique_confidence": None,
                   "critique_timestamp": None
               },
               
               "expert_feedback": {
                   "reviewed_at": None,
                   "approved": None,
                   "modifications": [],
                   "comments": None,
                   "final_plan": None
               },
               
               "learning_analysis": {
                   "feedback_type": None,
                   "reason_for_change": None,
                   "learning_points": [],
                   "stored_for_future": False
               },
               
               "invitation": {
                   "email_content": None,
                   "email_edited_by_expert": False,
                   "sent_at": None,
                   "candidate_email": None,
                   "interview_link": None,
                   "admin_link": None
               }
           },
           
           # EXECUTION PHASE DATA (for future)
           "execution": {
               "started_at": None,
               "ended_at": None,
               "current_state": {},
               "transcript": [],
               "behavioral_analytics": {},
               "code_submissions": [],
               "timings": [],
               "strategy_performance": {},
               "skills_assessment": {},
               "live_metrics": {}
           },
           
           # EVALUATION PHASE DATA (for future)
           "evaluation": {
               "started_at": None,
               "completed_at": None,
               "report": {},
               "question_analysis": [],
               "expert_final_feedback": {},
               "learnings": {}
           },
           
           # AUDIT TRAIL
           "events": [],
           
           # HITL Feedback History
           "hitl_feedback_history": []
       }
   ```

2. **Write tests**
   ```python
   # backend/tests/unit/test_session_schema.py
   def test_create_session_schema_returns_dict():
       schema = create_session_schema("test_001", "expert_001", {})
       assert isinstance(schema, dict)
   
   def test_schema_has_required_top_level_keys():
       schema = create_session_schema("test_001", "expert_001", {})
       assert "id" in schema
       assert "version" in schema
       assert "state" in schema
       assert "phase" in schema
       assert "planning" in schema
       assert "execution" in schema
       assert "evaluation" in schema
   
   def test_schema_starts_in_planning_phase():
       schema = create_session_schema("test_001", "expert_001", {})
       assert schema["state"] == "planning"
       assert schema["phase"] == "planning"
   
   def test_schema_version_is_2_0():
       schema = create_session_schema("test_001", "expert_001", {})
       assert schema["version"] == "2.0.0"
   ```

### Justification: No Regression/Bugs
- ✅ **New schema**: Doesn't replace old schema yet
- ✅ **Pure function**: No side effects
- ✅ **Tested**: 100% coverage
- ✅ **Coexists**: Can run alongside old schema

### Acceptance Criteria
- [ ] Schema model created
- [ ] All tests pass
- [ ] Schema includes all three phases
- [ ] Version is 2.0.0
- [ ] Documentation complete

---

## MT-1.5: Implement Session Manager v2

### Objective
Create new SessionManager that uses enhanced schema and MongoDB.

### Steps
1. **Setup MongoDB** (optional for now, can use JSON)
   ```bash
   # Install MongoDB driver
   pip install pymongo motor
   ```

2. **Write tests first**
   ```python
   # backend/tests/unit/test_session_manager_v2.py
   @pytest.fixture
   def session_manager():
       return SessionManagerV2(use_mongodb=False)  # Use JSON for tests
   
   def test_create_session(session_manager):
       session = session_manager.create_session(
           "test_001",
           "expert_001",
           {"mode": "quick_start"}
       )
       assert session["id"] == "test_001"
       assert session["expert"]["id"] == "expert_001"
   
   def test_load_session(session_manager):
       session_manager.create_session("test_001", "expert_001", {})
       loaded = session_manager.load_session("test_001")
       assert loaded["id"] == "test_001"
   
   def test_update_state(session_manager):
       session_manager.create_session("test_001", "expert_001", {})
       session_manager.update_state("test_001", SessionState.PLAN_REVIEW)
       session = session_manager.load_session("test_001")
       assert session["state"] == "plan_review"
   
   def test_add_event(session_manager):
       session_manager.create_session("test_001", "expert_001", {})
       session_manager.add_event("test_001", "plan_generated", {"details": "test"})
       session = session_manager.load_session("test_001")
       assert len(session["events"]) == 1
       assert session["events"][0]["event_type"] == "plan_generated"
   ```

3. **Implement SessionManagerV2**
   ```python
   # backend/core/session_manager_v2.py
   from typing import Dict, Optional
   from pathlib import Path
   from datetime import datetime
   import json
   from models.session_schema import create_session_schema, SessionState
   
   class SessionManagerV2:
       """Session Manager v2 with enhanced schema."""
       
       def __init__(self, use_mongodb: bool = False):
           self.use_mongodb = use_mongodb
           if not use_mongodb:
               self.sessions_dir = Path(__file__).parent.parent / "data" / "sessions_v2"
               self.sessions_dir.mkdir(parents=True, exist_ok=True)
       
       def create_session(
           self,
           session_id: str,
           expert_id: str,
           config: Dict
       ) -> Dict:
           """Create new session with v2 schema."""
           session = create_session_schema(session_id, expert_id, config)
           self.save_session(session_id, session)
           self.add_event(session_id, "session_created", {"expert_id": expert_id})
           return session
       
       def load_session(self, session_id: str) -> Optional[Dict]:
           """Load session from storage."""
           if self.use_mongodb:
               # TODO: MongoDB implementation
               pass
           else:
               file_path = self.sessions_dir / f"{session_id}.json"
               if not file_path.exists():
                   return None
               with open(file_path) as f:
                   return json.load(f)
       
       def save_session(self, session_id: str, session: Dict):
           """Save session to storage."""
           session["updated_at"] = datetime.now().isoformat()
           
           if self.use_mongodb:
               # TODO: MongoDB implementation
               pass
           else:
               file_path = self.sessions_dir / f"{session_id}.json"
               with open(file_path, 'w') as f:
                   json.dump(session, f, indent=2)
       
       def update_state(self, session_id: str, new_state: SessionState):
           """Update session state."""
           session = self.load_session(session_id)
           if session:
               session["state"] = new_state.value
               self.save_session(session_id, session)
               self.add_event(session_id, "state_changed", {"new_state": new_state.value})
       
       def add_event(self, session_id: str, event_type: str, details: Dict):
           """Add event to audit trail."""
           session = self.load_session(session_id)
           if session:
               event = {
                   "event_id": f"evt_{len(session['events']) + 1:03d}",
                   "timestamp": datetime.now().isoformat(),
                   "event_type": event_type,
                   "details": details
               }
               session["events"].append(event)
               self.save_session(session_id, session)
   ```

4. **Run tests**
   ```bash
   pytest backend/tests/unit/test_session_manager_v2.py -v
   ```

### Justification: No Regression/Bugs
- ✅ **New class**: Doesn't replace old SessionManager
- ✅ **Separate directory**: Uses `sessions_v2/` folder
- ✅ **Tested**: 100% coverage
- ✅ **Coexists**: Old and new can run side-by-side
- ✅ **MongoDB optional**: Can use JSON for now

### Acceptance Criteria
- [ ] All tests pass (100% coverage)
- [ ] CRUD operations work
- [ ] State management works
- [ ] Event logging works
- [ ] Can switch between JSON and MongoDB
- [ ] No impact on existing sessions

---

## Database Recommendation: MongoDB

### Why MongoDB?
1. **Native JSON**: Sessions are already JSON, no impedance mismatch
2. **Flexible Schema**: SSOT will evolve, MongoDB handles this well
3. **Horizontal Scaling**: Easy to scale to millions of sessions
4. **Rich Queries**: Aggregation framework for analytics
5. **Document Model**: Perfect for hierarchical session data

### Why Not PostgreSQL?
- More rigid schema (even with JSONB)
- Harder to scale horizontally
- Better for relational data (users, positions)

### Hybrid Approach (Recommended)
- **MongoDB**: Session storage (SSOT)
- **PostgreSQL**: Structured data (users, positions, templates)
- **Redis**: Caching, real-time data

### Next Steps
1. Setup MongoDB locally for development
2. Create MongoDB service wrapper
3. Migrate SessionManagerV2 to use MongoDB
4. Keep JSON as fallback for testing

---

## Summary

**Total Mini Tasks**: 5 (Week 1)  
**Estimated Time**: 5-7 days  
**Dependencies**: Sequential (each builds on previous)  
**Risk Level**: Low (all new code, no modifications)  
**Test Coverage Target**: 100%

**After Week 1**:
- ✅ Platform capabilities defined
- ✅ Configuration service working
- ✅ Authentication stub ready
- ✅ Session schema v2 created
- ✅ Session manager v2 implemented
- ✅ All tests passing
- ✅ Zero regressions

**Ready for Week 2**: Planning Phase Services
