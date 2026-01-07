"""
Interview Session Orchestrator - Swarm 2.0 (Consolidated 6-Agent System)
The central hub for coordinating the optimized 6-agent swarm.
1. Strategy (Planner + Architect)
2. Executioner (Engine)
3. Evaluator (Judge + Analyst)
4. Observer (Watchdog + Guard)
5. Critique (Coach)
6. Monitor (Recorder + Watcher)
"""

from typing import Dict, Any, List, Optional
from engine.protocol.base import AgentContext
from engine.agents.strategy import get_strategy_agent
from engine.agents.executioner import get_executioner_agent
from engine.agents.evaluator import get_evaluator_agent
from engine.agents.observer import get_observer_agent
from engine.agents.critique import get_critique_agent
from engine.agents.monitor import get_monitor_agent
from services.event_store import get_event_store

class InterviewSessionOrchestrator:
    """
    Orchestrates the lifecycle of a Swarm 2.0 session using 6 specialized agents.
    """
    
    def __init__(self, session_id: str, expert_mode: bool = False):
        self.session_id = session_id
        self.expert_mode = expert_mode
        self.event_store = get_event_store()
        
        # Swarm 2.0 Consolidated 6-Agent Ensemble
        self.strategy = get_strategy_agent()
        self.executioner = get_executioner_agent()
        self.evaluator = get_evaluator_agent()
        self.observer = get_observer_agent()
        self.critique = get_critique_agent()
        self.monitor = get_monitor_agent()
        
        # Internal State
        self.current_phase = "General Tech"
        self.history = []
        self.pending_expert_action: Optional[Dict] = None

    async def advance_session(self, input_text: Optional[str] = None) -> Dict[str, Any]:
        """
        Unified 6-Agent Swarm Workflow:
        1. Monitor: Health & Decoding
        2. Observer: Security & Integrity
        3. Evaluator: Scoring & Analysis (if input exists)
        4. Strategy: Dynamic Trajectory
        5. Executioner: Interaction Generation
        6. Critique: Quality Audit
        """
        
        # 1. Monitor: Health & Decoding
        await self.monitor.process(self._build_context({"monitor_task": "health_check"}))
        decoded_signal = None
        if input_text:
            monitor_output = await self.monitor.process(self._build_context({
                "monitor_task": "decode_input",
                "raw_input": input_text
            }))
            decoded_signal = monitor_output.action_data.get("concepts")

        # 2. Observer: Security & Integrity
        if input_text:
            security_output = await self.observer.process(self._build_context({
                "security_check": True,
                "last_input": input_text
            }))
            if not security_output.action_data.get("safe"):
                return {"text": f"Security Alert: {security_output.action_data.get('reason')}", "phase": self.current_phase}

        # 3. Evaluator: Scoring (if input exists)
        if input_text:
            evaluation_output = await self.evaluator.process(self._build_context({
                "evaluator_task": "evaluate_response",
                "last_answer": input_text
            }))
            self._emit_event("ResponseEvaluated", evaluation_output.action_data)

        # 4. Strategy: Dynamic Trajectory
        strategy_output = await self.strategy.process(self._build_context({
            "strategy_task": "update_plan"
        }))
        self.current_phase = strategy_output.action_data.get("current_focus", self.current_phase)

        # 5. Executioner: Interaction Generation
        execution_output = await self.executioner.process(self._build_context({
            "executioner_task": "speak",
            "current_phase": self.current_phase
        }))
        proposed_text = execution_output.action_data.get("text", "")
        
        # 6. Critique: Quality Audit
        audit_output = await self.critique.process(self._build_context({
            "proposed_action": proposed_text,
            "subject_agent": "Executioner"
        }))
        
        final_proposal = audit_output.action_data.get("suggestion") if audit_output.action_data.get("fix_required") else proposed_text

        # EXPERT HITL INTERVENTION
        if self.expert_mode:
            self.pending_expert_action = {
                "text": final_proposal,
                "phase": self.current_phase,
                "thoughts": execution_output.thought
            }
            self._emit_event("ExpertApprovalRequired", self.pending_expert_action)
            return {
                "status": "pending_expert",
                "message": "Waiting for expert approval...",
                "pending_action": self.pending_expert_action
            }

        self._emit_event("ExecutionerSpoke", {"text": final_proposal, "phase": self.current_phase})
        
        return {
            "text": final_proposal,
            "phase": self.current_phase,
            "thoughts": execution_output.thought
        }

    def _build_context(self, metadata_overrides: Dict[str, Any]) -> AgentContext:
        """Helper to build a fresh AgentContext for agents."""
        return AgentContext(
            session_id=self.session_id,
            metadata={**self._get_base_metadata(), **metadata_overrides},
            history=self.history
        )

    def _get_base_metadata(self) -> Dict[str, Any]:
        return {
            "jd_text": "Senior Python Developer role with focus on microservices.",
            "resume_text": "Experienced engineer with 6 years in backend systems."
        }

    def _emit_event(self, event_type: str, data: Any):
        """Helper to append events to the store."""
        self.event_store.append_event(self.session_id, event_type, data)
        print(f"[{self.session_id}] EVENT: {event_type}")

# Factory
def create_orchestrator(session_id: str) -> InterviewSessionOrchestrator:
    return InterviewSessionOrchestrator(session_id)
