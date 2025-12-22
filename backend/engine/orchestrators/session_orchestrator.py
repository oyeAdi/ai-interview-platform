"""
Interview Session Orchestrator - Swarm 2.0
The central hub for coordinating the 11-agent swarm in a clean-slate architecture.
Replaces legacy controllers with a decoupled, state-machine driven engine.
"""

from typing import Dict, Any, List, Optional
from engine.protocol.base import AgentContext
from engine.agents.architect import get_architect_agent
from engine.agents.executioner import get_executioner_agent
from engine.agents.evaluator import get_evaluator_agent
from engine.agents.analyst import get_analyst_agent
from engine.agents.guardian import get_guardian_agent
from engine.agents.critic import get_critic_agent
from engine.agents.watcher import get_watcher_agent
from engine.agents.interpreter import get_interpreter_agent
from engine.agents.planner import get_planner_agent
from engine.agents.observer import get_observer_agent
from services.event_store import get_event_store

class InterviewSessionOrchestrator:
    """
    Orchestrates the lifecycle of a Swarm 2.0 session.
    Manages the interplay between agents and expert HITL interactions.
    """
    
    def __init__(self, session_id: str, expert_mode: bool = False):
        self.session_id = session_id
        self.expert_mode = expert_mode
        self.event_store = get_event_store()
        
        # Swarm 2.0 Agent Ensemble (Restored Naming)
        self.architect = get_architect_agent()
        self.executioner = get_executioner_agent()
        self.evaluator = get_evaluator_agent()
        self.analyst = get_analyst_agent()
        self.guardian = get_guardian_agent()
        self.critic = get_critic_agent()
        self.watcher = get_watcher_agent()
        self.interpreter = get_interpreter_agent()
        self.planner = get_planner_agent()
        self.observer = get_observer_agent()
        
        # Internal State
        self.current_phase = "greeting"
        self.history = []
        self.pending_expert_action: Optional[Dict] = None

    async def advance_session(self, input_text: Optional[str] = None) -> Dict[str, Any]:
        """
        Swarm 2.0 Multi-Agent Workflow with Expert HITL:
        """
        
        # 1. System Health (Watcher)
        await self.watcher.process(self._build_context({}))

        # 2. Security (Guardian)
        if input_text:
            security_output = await self.guardian.process(self._build_context({"last_input": input_text}))
            if security_output.action_data.get("violation_detected"):
                return {"text": "Security scan flagged this input.", "phase": self.current_phase}

        # 3. Decoding & Analysis (Interpreter + Observer + Evaluator)
        decoded_signal = None
        if input_text:
            interpreter_output = await self.interpreter.process(self._build_context({"raw_input": input_text}))
            decoded_signal = interpreter_output.action_data.get("decoded_signal")
            
            await self.observer.process(self._build_context({"last_signal": decoded_signal}))
            
            evaluation_output = await self.evaluator.process(self._build_context({"last_answer": decoded_signal}))
            self._emit_event("ResponseEvaluated", evaluation_output.action_data)

        # 4. Planning & Execution (Planner + Executioner)
        await self.planner.process(self._build_context({}))
        
        execution_output = await self.executioner.process(self._build_context({"current_phase": self.current_phase}))
        proposed_text = execution_output.action_data.get("text", "")
        
        # 5. Quality Audit (Critic)
        audit_output = await self.critic.process(self._build_context({
            "proposed_action": proposed_text,
            "subject_agent": "Executioner"
        }))
        
        final_proposal = audit_output.action_data.get("suggested_fix") if audit_output.action_data.get("adjustment_required") else proposed_text

        # 6. EXPERT HITL INTERVENTION
        if self.expert_mode:
            # Emit event to WebSockets for expert review
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

        # Update Phase
        suggested_phase = execution_output.action_data.get("phase_transition")
        if suggested_phase:
            self.current_phase = suggested_phase
            
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
        # In a real impl, this would pull from the Session store
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
