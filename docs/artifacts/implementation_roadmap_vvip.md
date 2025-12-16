# Implementation Roadmap - VVIP Features (Strangler Fig Pattern)

**Date**: 2025-12-16  
**Strategy**: Build new alongside old, zero downtime, gradual migration  
**Principle**: Don't break what's working

---

## VVIP Priority Order

### 1. **Swarm Intelligence for Followup Strategy** ⭐⭐⭐
**Why VVIP**: Wow factor, improves followup quality dramatically  
**Impact**: High - Better followup decisions  
**Complexity**: Medium - 3 LLM calls with voting

### 2. **Multi-Agent Coordination** ⭐⭐⭐
**Why VVIP**: Core architecture, enables all other features  
**Impact**: High - Enables Critique, Observer, Swarm  
**Complexity**: High - New agent framework

### 3. **Question Quality with Internet Search** ⭐⭐
**Why VVIP**: Wow factor, ensures realistic questions  
**Impact**: Medium - Better question quality  
**Complexity**: Medium - Tool calling integration

### 4. **HITL Planning Approval Workflow** ⭐⭐
**Why VVIP**: Critical for production, safety net  
**Impact**: High - Expert control  
**Complexity**: Low - UI + workflow

---

## Strangler Fig Implementation Plan

### Phase 1: Foundation (Week 1) - **Build New Alongside Old**

#### 1.1 Multi-Agent Framework (New Code)
**Location**: `backend/agents/` (NEW directory)

**Files to Create**:
```
backend/agents/
├── __init__.py
├── base_agent.py          # Abstract base class
├── planner_agent.py       # Planning phase
├── executor_agent.py      # Execution phase
├── evaluator_agent.py     # Evaluation phase
├── critique_agent.py      # Quality check
├── observer_agent.py      # Learning
└── swarm_coordinator.py   # Swarm intelligence
```

**Strategy**: 
- ✅ Create new agent framework
- ✅ Load perfected configs from `backend/config/phases/`
- ❌ **DON'T** touch existing `backend/core/interview_controller.py` yet
- ✅ Build alongside, test independently

**Integration Point**: Add feature flag
```python
# backend/config.py
ENABLE_MULTI_AGENT_SYSTEM = False  # Default: old system
```

---

#### 1.2 Swarm Intelligence Service (New Code)
**Location**: `backend/services/swarm_service.py` (NEW file)

**Implementation**:
```python
class SwarmIntelligenceService:
    """
    Implements swarm intelligence for followup strategy selection.
    Uses same LLM with different system prompts (3 agents).
    """
    
    async def select_followup_strategy(
        self,
        candidate_response: str,
        evaluation_result: dict,
        context: dict
    ) -> dict:
        # Invoke 3 LLM agents with different personas
        agent_1_vote = await self._technical_depth_analyzer(...)
        agent_2_vote = await self._clarity_analyzer(...)
        agent_3_vote = await self._engagement_analyzer(...)
        
        # Weighted voting
        final_decision = self._aggregate_votes([
            (agent_1_vote, 0.4),
            (agent_2_vote, 0.3),
            (agent_3_vote, 0.3)
        ])
        
        return final_decision
```

**Strategy**:
- ✅ Create new service
- ✅ Load config from `execution.json`
- ❌ **DON'T** integrate with old system yet
- ✅ Add feature flag: `ENABLE_SWARM_INTELLIGENCE = False`

---

#### 1.3 Question Validator with Internet Search (New Code)
**Location**: `backend/services/question_validator.py` (NEW file)

**Implementation**:
```python
class QuestionValidatorService:
    """
    Validates questions using internet search to ensure they're frequently-asked.
    """
    
    async def validate_question(self, question: str) -> dict:
        # Check length
        if len(question) > 500:
            return {"valid": False, "reason": "too_long"}
        
        # Internet search to verify it's frequently-asked
        search_results = await self._search_internet(question)
        is_frequently_asked = self._analyze_search_results(search_results)
        
        if not is_frequently_asked:
            return {"valid": False, "reason": "not_frequently_asked"}
        
        return {"valid": True, "quality_score": 95}
```

**Strategy**:
- ✅ Create new service
- ✅ Use Google Search API or Serper API
- ❌ **DON'T** enforce validation in old system yet
- ✅ Add feature flag: `ENABLE_QUESTION_VALIDATION = False`

---

### Phase 2: Integration (Week 2) - **Route New Traffic**

#### 2.1 Planning Phase HITL Workflow (New UI + Backend)

**Backend**: `backend/services/planning_service.py` (NEW file)
```python
class PlanningService:
    """
    Implements planning phase with HITL approval.
    """
    
    async def generate_plan(self, session_id: str) -> dict:
        # Load from Session SSOT
        session = session_manager.load_session(session_id)
        
        # Generate plan using PlannerAgent
        plan = await planner_agent.generate_plan(
            job_description=session["job_metadata"],
            candidate_resume=session["candidate_metadata"]["resume"],
            interview_config=session["interview_metadata"]["config"]
        )
        
        # Critique validation
        critique = await critique_agent.validate_plan(plan)
        
        # Save to Session SSOT
        session["planning_phase"]["llm_plan_generation"] = plan
        session["planning_phase"]["critique_feedback"] = critique
        session["state"]["current"] = "plan_review"
        
        session_manager.save_session(session_id, session)
        
        return {"plan": plan, "critique": critique}
    
    async def approve_plan(self, session_id: str, modifications: list) -> dict:
        # HITL approval
        session = session_manager.load_session(session_id)
        
        # Apply modifications
        final_plan = self._apply_modifications(
            session["planning_phase"]["llm_plan_generation"],
            modifications
        )
        
        # Observer learning
        observer_insights = await observer_agent.analyze_hitl_feedback(
            original_plan=session["planning_phase"]["llm_plan_generation"],
            final_plan=final_plan,
            modifications=modifications
        )
        
        # Update Session SSOT
        session["planning_phase"]["planning_phase_output"]["interview_plan"] = final_plan
        session["planning_phase"]["hitl_feedback"] = {
            "approved": True,
            "modifications": modifications,
            "reviewed_at": datetime.now()
        }
        session["planning_phase"]["observer_insights"] = observer_insights
        session["state"]["current"] = "in_progress"
        
        session_manager.save_session(session_id, session)
        
        return {"status": "approved"}
```

**Frontend**: `frontend/src/components/PlanReviewModal.tsx` (NEW component)
```tsx
export default function PlanReviewModal({ sessionId, plan }) {
  const [modifications, setModifications] = useState([]);
  
  const handleApprove = async () => {
    await fetch(`/api/planning/approve`, {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, modifications })
    });
  };
  
  return (
    <Modal>
      <h2>Review Interview Plan</h2>
      <PlanDisplay plan={plan} />
      <CritiqueFeedback critique={plan.critique} />
      <ModificationEditor onChange={setModifications} />
      <Button onClick={handleApprove}>Approve & Start Interview</Button>
    </Modal>
  );
}
```

**Strategy**:
- ✅ Create new planning workflow
- ✅ Add new route: `/api/planning/generate`, `/api/planning/approve`
- ❌ **DON'T** force old sessions through this yet
- ✅ Add feature flag: `ENABLE_PLANNING_PHASE = False`

---

#### 2.2 Execution Phase with Swarm Intelligence

**Update**: `backend/core/interview_controller.py` (MODIFY existing)

**Strangler Fig Pattern**:
```python
class InterviewController:
    def __init__(self):
        self.use_swarm = os.getenv("ENABLE_SWARM_INTELLIGENCE", "false") == "true"
        self.swarm_service = SwarmIntelligenceService() if self.use_swarm else None
    
    async def generate_followup(self, session_id: str, response: str):
        if self.use_swarm:
            # NEW: Use swarm intelligence
            strategy = await self.swarm_service.select_followup_strategy(
                candidate_response=response,
                evaluation_result=self.latest_evaluation,
                context=self.session_context
            )
        else:
            # OLD: Use existing logic
            strategy = self._select_strategy_old(response)
        
        # Generate followup (both paths use same generation)
        followup = await self._generate_followup_question(strategy)
        return followup
```

**Strategy**:
- ✅ Add swarm intelligence as optional path
- ✅ Keep old logic intact
- ✅ Feature flag controls which path
- ✅ Gradual rollout: Test with 1 session, then 5, then all

---

### Phase 3: Validation (Week 3) - **Test & Monitor**

#### 3.1 Testing Strategy

**Unit Tests**:
```python
# backend/tests/unit/test_swarm_service.py
def test_swarm_intelligence_voting():
    service = SwarmIntelligenceService()
    result = await service.select_followup_strategy(...)
    assert result["strategy"] in ["depth_focused", "clarification", ...]
    assert result["confidence"] > 0.6
```

**Integration Tests**:
```python
# backend/tests/integration/test_planning_workflow.py
async def test_complete_planning_flow():
    # Generate plan
    plan = await planning_service.generate_plan(session_id)
    assert plan["plan_id"] is not None
    
    # Approve plan
    result = await planning_service.approve_plan(session_id, [])
    assert result["status"] == "approved"
    
    # Verify Session SSOT updated
    session = session_manager.load_session(session_id)
    assert session["state"]["current"] == "in_progress"
```

**A/B Testing**:
- 50% sessions use swarm intelligence
- 50% sessions use old logic
- Compare followup quality scores

---

### Phase 4: Migration (Week 4) - **Gradual Rollout**

#### 4.1 Rollout Plan

**Day 1-2**: Enable for 10% of sessions
```python
ENABLE_SWARM_INTELLIGENCE = random.random() < 0.1
```

**Day 3-4**: Enable for 50% if metrics good
**Day 5-7**: Enable for 100% if stable

#### 4.2 Monitoring

**Metrics to Track**:
- Swarm intelligence decision time (should be < 5s)
- Followup quality score (should improve by 10%+)
- Question validation pass rate (should be > 90%)
- Planning approval time (should be < 2 min)

**Rollback Plan**:
- If any metric degrades, set feature flag to `false`
- Old system takes over immediately
- Zero downtime

---

## Feature Flags Configuration

**File**: `backend/config.py`
```python
# Feature Flags (Strangler Fig Pattern)
ENABLE_MULTI_AGENT_SYSTEM = os.getenv("ENABLE_MULTI_AGENT", "false") == "true"
ENABLE_SWARM_INTELLIGENCE = os.getenv("ENABLE_SWARM", "false") == "true"
ENABLE_QUESTION_VALIDATION = os.getenv("ENABLE_VALIDATION", "false") == "true"
ENABLE_PLANNING_PHASE = os.getenv("ENABLE_PLANNING", "false") == "true"

# Gradual Rollout Percentages
SWARM_ROLLOUT_PERCENTAGE = int(os.getenv("SWARM_ROLLOUT", "0"))
PLANNING_ROLLOUT_PERCENTAGE = int(os.getenv("PLANNING_ROLLOUT", "0"))
```

**Environment Variables** (`.env`):
```bash
# Development
ENABLE_MULTI_AGENT=true
ENABLE_SWARM=true
ENABLE_VALIDATION=true
ENABLE_PLANNING=true

# Production (gradual rollout)
SWARM_ROLLOUT=10  # Start with 10%
PLANNING_ROLLOUT=10
```

---

## Implementation Checklist

### Week 1: Foundation
- [ ] Create `backend/agents/` directory structure
- [ ] Implement `base_agent.py` abstract class
- [ ] Implement `swarm_coordinator.py` with 3-agent voting
- [ ] Implement `question_validator.py` with internet search
- [ ] Create `planning_service.py` with HITL workflow
- [ ] Add feature flags to `config.py`
- [ ] Write unit tests for all new services

### Week 2: Integration
- [ ] Create `PlanReviewModal.tsx` UI component
- [ ] Add `/api/planning/generate` endpoint
- [ ] Add `/api/planning/approve` endpoint
- [ ] Modify `interview_controller.py` with feature flag
- [ ] Integrate swarm intelligence (behind flag)
- [ ] Integrate question validation (behind flag)
- [ ] Write integration tests

### Week 3: Testing
- [ ] Test swarm intelligence with 5 sessions
- [ ] Test planning workflow end-to-end
- [ ] Test question validation accuracy
- [ ] Monitor performance metrics
- [ ] Fix any bugs found
- [ ] Prepare rollout plan

### Week 4: Rollout
- [ ] Enable swarm for 10% sessions
- [ ] Monitor metrics for 2 days
- [ ] Enable for 50% if stable
- [ ] Enable for 100% if stable
- [ ] Remove old code (optional, keep as fallback)

---

## Success Criteria

✅ **Swarm Intelligence**:
- Decision time < 5 seconds
- Followup quality score improves by 10%+
- Consensus level > 70% (strong majority)

✅ **Question Validation**:
- Validation pass rate > 90%
- No made-up questions reach candidate
- Internet search latency < 2 seconds

✅ **Planning HITL**:
- Plan approval time < 2 minutes
- Expert satisfaction score > 8/10
- Observer learns from 100% of modifications

✅ **Zero Downtime**:
- Old system works if new system fails
- Feature flags allow instant rollback
- No breaking changes to existing code

---

## Next Immediate Actions

1. **Create `backend/agents/` directory**
2. **Implement `swarm_coordinator.py`** (highest impact)
3. **Implement `question_validator.py`** (wow factor)
4. **Create `planning_service.py`** (HITL workflow)
5. **Add feature flags to `config.py`**

**Ready to start implementation?** 🚀
