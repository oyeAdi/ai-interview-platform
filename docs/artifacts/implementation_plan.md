# Multi-Agent Framework Implementation Plan

**Date**: 2025-12-16  
**Goal**: Build foundation for all intelligent agents in the system  
**Strategy**: Create reusable BaseAgent → Implement 5 core agents → Add Swarm Intelligence

---

## Overview

The Multi-Agent Framework provides a consistent interface for all agents in the AI Interview Platform. Each agent:
- Loads configuration from perfected phase configs (`planning.json`, `execution.json`, `evaluation.json`)
- Implements standard interface (execute, validate_inputs, load_config)
- Integrates with LLMs for intelligent decision-making
- Tracks execution statistics and performance
- Handles errors gracefully with retries

---

## Proposed Changes

### 1. Foundation (`backend/agents/`)

#### [NEW] `__init__.py`
- Package initialization
- Exports: BaseAgent, AgentConfig, AgentResponse, AgentError

#### [NEW] `base_agent.py` ✅ **COMPLETE**
- `BaseAgent` abstract class
- `AgentConfig` dataclass (LLM model, temperature, timeout, retries)
- `AgentResponse` dataclass (success, data, metadata, errors, confidence)
- `AgentError` exception
- Lifecycle management (start, end, reset)
- LLM integration interface
- Statistics tracking

---

### 2. Core Agents

#### [NEW] `planner_agent.py`
**Purpose**: Generate interview plans based on JD, resume, and round type

**Responsibilities**:
- Load `planning.json` configuration
- Generate interview template (categories, depth, time allocation)
- Generate interview plan (guiding questions, personalization)
- Generate personalization insights (resume-driven, gap-probing)
- Call Critique Agent for validation
- Return plan for HITL review

**Key Methods**:
```python
async def execute(inputs: Dict) -> AgentResponse:
    # inputs: job_description, candidate_resume, round_type, config
    # outputs: interview_template, interview_plan, personalization_insights
```

**Inputs** (from Session SSOT):
- `job_metadata.job_description`
- `candidate_metadata.resume`
- `interview_metadata.round_info`
- `multi_round_context.previous_rounds`

**Outputs** (to Session SSOT):
- `planning_phase.planning_phase_output.interview_template`
- `planning_phase.planning_phase_output.interview_plan`
- `planning_phase.planning_phase_output.personalization_insights`

---

#### [NEW] `executor_agent.py`
**Purpose**: Ask questions and generate followups during interview

**Responsibilities**:
- Load `execution.json` configuration
- Ask questions from approved plan
- Generate followup questions based on responses
- Manage conversation flow (natural transitions, paragraph breaks)
- Call Swarm Intelligence for followup strategy selection
- Call Question Validator for quality check

**Key Methods**:
```python
async def execute(inputs: Dict) -> AgentResponse:
    # inputs: approved_plan, candidate_response, evaluation_result
    # outputs: next_question, followup_strategy, conversation_state
```

**Inputs** (from Session SSOT):
- `planning_phase.planning_phase_output.interview_plan`
- `execution_phase.transcript` (previous Q&A)
- `execution_phase.context` (current state, time remaining)
- `execution_phase.skills_assessment` (what's been tested)

**Outputs** (to Session SSOT):
- `execution_phase.transcript` (append new question)
- `execution_phase.context` (update state)

---

#### [NEW] `evaluator_agent.py`
**Purpose**: Score responses and generate comprehensive reports

**Responsibilities**:
- Load `evaluation.json` configuration
- Score individual responses using LLM frameworks
- Identify strengths, improvements, gaps
- Generate comprehensive final report
- Call Critique Agent for validation

**Key Methods**:
```python
async def execute(inputs: Dict) -> AgentResponse:
    # inputs: question, candidate_response, expected_answer_points
    # outputs: score, reasoning, strengths, improvements, gaps
```

**Inputs** (from Session SSOT):
- `execution_phase.transcript` (all Q&A)
- `planning_phase.planning_phase_output.interview_plan` (expected answers)

**Outputs** (to Session SSOT):
- `execution_phase.transcript[].responses[].evaluation`
- `evaluation_phase.llm_evaluation`
- `evaluation_phase.final_report`

---

#### [NEW] `critique_agent.py`
**Purpose**: Validate quality of plans, questions, and evaluations

**Responsibilities**:
- Validate plan quality (realistic questions, good coverage, time allocation)
- Validate question quality (concise, frequently-asked, no made-up)
- Validate evaluation quality (fair scoring, accurate gap identification)
- Provide improvement suggestions

**Key Methods**:
```python
async def execute(inputs: Dict) -> AgentResponse:
    # inputs: artifact_type (plan/question/evaluation), artifact_data
    # outputs: quality_score, strengths, concerns, improvements_suggested
```

**Inputs**:
- Planning: `planning_phase.llm_plan_generation`
- Execution: Generated question
- Evaluation: `evaluation_phase.llm_evaluation`

**Outputs** (to Session SSOT):
- `planning_phase.critique_feedback`
- `execution_phase.transcript[].question.critique_feedback`
- `evaluation_phase.critique_feedback`

---

#### [NEW] `observer_agent.py`
**Purpose**: Learn from HITL feedback to improve future performance

**Responsibilities**:
- Analyze HITL modifications to plans
- Analyze HITL overrides to evaluations
- Extract learning patterns
- Store learnings for future use
- Identify what experts prefer/avoid

**Key Methods**:
```python
async def execute(inputs: Dict) -> AgentResponse:
    # inputs: original_artifact, final_artifact, hitl_modifications
    # outputs: learning_type, pattern_detected, learning_points, confidence
```

**Inputs** (from Session SSOT):
- `planning_phase.llm_plan_generation` (original)
- `planning_phase.planning_phase_output.interview_plan` (final)
- `planning_phase.hitl_feedback.modifications`

**Outputs** (to Session SSOT):
- `planning_phase.observer_insights`
- `evaluation_phase.observer_insights`

---

### 3. Swarm Intelligence

#### [NEW] `swarm_coordinator.py`
**Purpose**: Coordinate multiple LLM agents for collaborative decision-making

**Responsibilities**:
- Implement 3-agent voting system (Technical Depth, Clarity, Engagement)
- Weighted voting mechanism (0.4, 0.3, 0.3)
- Confidence threshold logic (0.6)
- Tie-breaking rules
- Fallback strategies (low confidence, timeout, error)

**Key Methods**:
```python
async def select_followup_strategy(inputs: Dict) -> AgentResponse:
    # inputs: candidate_response, evaluation_result, context
    # outputs: strategy_selected, agent_votes, confidence, consensus_level
```

**Implementation**:
- Use same LLM with different system prompts (prompt engineering)
- Each agent analyzes response from different perspective
- Aggregate votes with weights
- Return final decision with reasoning

---

### 4. Configuration Integration

#### [MODIFY] `backend/services/config_service.py` (NEW file)
**Purpose**: Load and parse phase configurations

**Responsibilities**:
- Load `planning.json`, `execution.json`, `evaluation.json`
- Validate configuration structure
- Provide config to agents
- Cache configs for performance

**Key Methods**:
```python
def load_phase_config(phase: str) -> Dict:
    # phase: "planning" | "execution" | "evaluation"
    # returns: parsed configuration dictionary
```

---

## Verification Plan

### Unit Tests

#### `tests/unit/test_base_agent.py`
- Test AgentConfig creation
- Test AgentResponse serialization
- Test AgentError handling
- Test lifecycle management (start, end, reset)
- Test statistics tracking

#### `tests/unit/test_planner_agent.py`
- Test plan generation with valid inputs
- Test personalization based on resume
- Test round adaptation (TI0-TI5)
- Test error handling (missing inputs)

#### `tests/unit/test_executor_agent.py`
- Test question asking from plan
- Test followup generation
- Test conversation flow management

#### `tests/unit/test_evaluator_agent.py`
- Test response scoring
- Test gap identification
- Test report generation

#### `tests/unit/test_critique_agent.py`
- Test plan validation
- Test question validation
- Test evaluation validation

#### `tests/unit/test_observer_agent.py`
- Test learning extraction from HITL feedback
- Test pattern detection

#### `tests/unit/test_swarm_coordinator.py`
- Test 3-agent voting
- Test weighted aggregation
- Test tie-breaking
- Test fallback strategies

### Integration Tests

#### `tests/integration/test_planning_flow.py`
- Test complete planning flow: Planner → Critique → HITL → Observer

#### `tests/integration/test_execution_flow.py`
- Test complete execution flow: Executor → Swarm → Question Validator → Evaluator

#### `tests/integration/test_multi_agent_coordination.py`
- Test agents working together end-to-end

---

## Implementation Order

1. ✅ **BaseAgent** (foundation)
2. **ConfigService** (load phase configs)
3. **PlannerAgent** (planning phase)
4. **CritiqueAgent** (validation)
5. **ObserverAgent** (learning)
6. **ExecutorAgent** (execution phase)
7. **SwarmCoordinator** (followup strategy)
8. **EvaluatorAgent** (evaluation phase)

---

## Success Criteria

✅ All agents implement BaseAgent interface  
✅ All agents load configs from perfected phase files  
✅ All agents integrate with Session SSOT v3  
✅ Unit test coverage > 80%  
✅ Integration tests pass for complete flows  
✅ Agents handle errors gracefully with retries  
✅ Statistics tracking works for all agents

---

**Ready to implement!** 🚀
