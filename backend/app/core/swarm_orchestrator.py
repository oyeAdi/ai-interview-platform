import uuid
import logging
import json
from typing import Dict, List, Any, Optional
from datetime import datetime

# Swarm Consolidated Agents
from ..engine.agents.strategy import get_strategy_agent
from ..engine.agents.executioner import get_executioner_agent
from ..engine.agents.evaluator import get_evaluator_agent
from ..engine.agents.observer import get_observer_agent
from ..engine.agents.critique import get_critique_agent
from ..engine.agents.monitor import get_monitor_agent
from ..engine.protocol.base import AgentContext
from ..services.redis_service import get_redis_client

logger = logging.getLogger(__name__)

class SwarmOrchestrator:
    """
    Optimized 6-Agent Swarm Orchestrator.
    Consolidates:
    1. Strategy (Planner + Architect)
    2. Executioner (Voice)
    3. Evaluator (Judge + Analyst)
    4. Observer (Integrity + Guardian)
    5. Critique (Coach)
    6. Monitor (Watcher + Interpreter + Logger)
    """
    
    def __init__(self, session_id: Optional[str] = None):
        self.session_id = session_id or str(uuid.uuid4())
        self.context = AgentContext(session_id=self.session_id)
        self.current_phase = "General Tech"
        self.rounds_completed = 0
        self.total_rounds = 5
        self.start_time = None
        self.last_candidate_answer = None
        self.last_response = None
        self.redis = get_redis_client()
        
        # Agents
        self.strategy = get_strategy_agent()
        self.executioner = get_executioner_agent()
        self.evaluator = get_evaluator_agent()
        self.observer = get_observer_agent()
        self.critique = get_critique_agent()
        self.monitor = get_monitor_agent()

    async def initialize_session(self, jd_text: str, resume_text: str, metadata: Dict[str, Any] = None):
        """Pre-interview setup and intelligence baseline."""
        self.start_time = datetime.now()
        self.context.metadata.update({
            "jd_text": jd_text,
            "resume_text": resume_text,
            "start_time": self.start_time.isoformat(),
            "rounds_completed": 0
        })
        if metadata:
            self.context.metadata.update(metadata)

        # 1. Strategy Initialization
        strategy_output = await self.strategy.process(self._build_context({
            "strategy_task": "initial_setup"
        }))
        self.context.metadata["interview_config"] = strategy_output.action_data
        
        # 2. Monitor: Audit Setup
        await self.monitor.process(self._build_context({"monitor_task": "health_check"}))

        self.save_state()
        return {
            "session_id": self.session_id,
            "config": strategy_output.action_data
        }

    async def process_candidate_input(self, text: str) -> Dict[str, Any]:
        """Unified 6-Agent workflow for processing candidate responses."""
        if not self.start_time:
            self.start_time = datetime.now()
            
        self.last_candidate_answer = text
        self.context.history.append({"role": "candidate", "text": text, "timestamp": datetime.now().isoformat()})

        # 1. Monitor: Decoding Signal
        monitor_output = await self.monitor.process(self._build_context({
            "monitor_task": "decode_input",
            "raw_input": text
        }))
        
        # 2. Observer: Security & Pattern Integrity
        observer_output = await self.observer.process(self._build_context({
            "security_check": True,
            "last_input": text
        }))
        if not observer_output.action_data.get("safe", True):
             return {"type": "security_alert", "message": observer_output.action_data.get("reason", "Security Alert")}

        # 3. Evaluator: Deep Analysis
        evaluator_output = await self.evaluator.process(self._build_context({
            "evaluator_task": "evaluate_response",
            "last_answer": text
        }))

        # 4. Strategy: Adaptive Trajectory
        strategy_output = await self.strategy.process(self._build_context({
            "strategy_task": "update_plan"
        }))
        self.current_phase = strategy_output.action_data.get("current_focus", self.current_phase)

        # 5. Executioner: Interaction Generation
        executioner_output = await self.executioner.process(self._build_context({
            "executioner_task": "speak",
            "current_phase": self.current_phase
        }))
        proposed_text = executioner_output.action_data.get("text", "")

        # 6. Critique: Quality Control
        critique_output = await self.critique.process(self._build_context({
            "proposed_action": proposed_text,
            "subject_agent": "Executioner"
        }))
        final_text = critique_output.action_data.get("suggestion") if critique_output.action_data.get("fix_required") else proposed_text

        # Update Session State
        self.rounds_completed += 1
        self.context.history.append({"role": "interviewer", "text": final_text, "timestamp": datetime.now().isoformat()})
        
        result = {
            "response": final_text,
            "evaluation": evaluator_output.action_data,
            "phase": self.current_phase,
            "progress": {
                "rounds_completed": self.rounds_completed,
                "total_rounds": self.total_rounds,
                "percentage": (self.rounds_completed / self.total_rounds) * 100
            }
        }
        self.last_response = result
        self.save_state()
        return result

    def _build_context(self, overrides: Dict[str, Any]) -> AgentContext:
        """Helper for building fresh AgentContext."""
        return AgentContext(
            session_id=self.session_id,
            metadata={**self.context.metadata, **overrides},
            history=self.context.history
        )

    async def generate_final_report(self) -> Dict[str, Any]:
        """Generate summary report using Evaluator Agent."""
        eval_output = await self.evaluator.process(self._build_context({
            "evaluator_task": "generate_report"
        }))
        return eval_output.action_data

    async def get_greeting(self) -> str:
        """Get greeting from Executioner."""
        if self.last_response:
             return self.last_response["response"]
        
        result = await self.executioner.process(self._build_context({
            "executioner_task": "speak",
            "current_phase": "greeting"
        }))
        return result.action_data["text"]

    def save_state(self):
        """Persist state to Redis."""
        try:
            state = {
                "session_id": self.session_id,
                "current_phase": self.current_phase,
                "rounds_completed": self.rounds_completed,
                "total_rounds": self.total_rounds,
                "start_time": self.start_time.isoformat() if self.start_time else None,
                "last_response": self.last_response,
                "last_candidate_answer": self.last_candidate_answer,
                "context": self.context.metadata,
                "history": self.context.history
            }
            self.redis.set(f"session:{self.session_id}", json.dumps(state))
        except Exception as e:
            logger.error(f"Failed to save state: {e}")

    @classmethod
    def load_from_redis(cls, session_id: str) -> Optional['SwarmOrchestrator']:
        """Reconstruct from Redis."""
        redis = get_redis_client()
        state_json = redis.get(f"session:{session_id}")
        if not state_json:
            return None
        
        state = json.loads(state_json)
        orch = cls(session_id=session_id)
        orch.current_phase = state.get("current_phase", "General Tech")
        orch.rounds_completed = state.get("rounds_completed", 0)
        orch.total_rounds = state.get("total_rounds", 5)
        if state.get("start_time"):
            orch.start_time = datetime.fromisoformat(state["start_time"])
        orch.last_response = state.get("last_response")
        orch.last_candidate_answer = state.get("last_candidate_answer")
        orch.context.metadata = state.get("context", {})
        orch.context.history = state.get("history", [])
        return orch

# Session cache
_sessions: Dict[str, SwarmOrchestrator] = {}

def get_or_create_orchestrator(session_id: Optional[str] = None) -> SwarmOrchestrator:
    if session_id:
        if session_id in _sessions:
            return _sessions[session_id]
        
        orch = SwarmOrchestrator.load_from_redis(session_id)
        if orch:
            _sessions[session_id] = orch
            return orch
    
    orch = SwarmOrchestrator(session_id=session_id)
    _sessions[orch.session_id] = orch
    return orch

def delete_session(session_id: str):
    if session_id in _sessions:
        del _sessions[session_id]
