"""
Strategy Agent - Swarm 2.0 (Consolidated)
The brain of the swarm. Combines the functions of the legacy Planner and Architect.
Responsible for:
1. Initial JD & Resume Analysis (Audit)
2. Interview Milestone Definition
3. Dynamic Trajectory Planning
"""

from ..protocol.base import BaseAgent, AgentContext, InferenceOutput
from ..intelligence.dispatch import get_intelligence_dispatch
from typing import Dict, Any, List

class StrategyAgent(BaseAgent):
    """
    The Strategy Agent plans the 'Mission' and 'Trajectory'.
    It decides what needs to be evaluated and how to structure the session.
    """
    
    def __init__(self):
        super().__init__(
            name="Strategy",
            intelligence_provider=get_intelligence_dispatch()
        )

    async def process(self, context: AgentContext) -> InferenceOutput:
        """
        Main execution hook for the Strategy Agent.
        Can perform 'initial_setup', 'update_plan', or 'refine_trajectory'.
        """
        task = context.metadata.get("strategy_task", "update_plan")
        
        if task == "initial_setup":
            prompt = self._build_initial_setup_prompt(context)
        elif task == "refine_trajectory":
            prompt = self._build_refinement_prompt(context)
        else:
            prompt = self._build_planning_prompt(context)
            
        # Enforce structured output based on task
        if task == "initial_setup":
            prompt += "\n\nCRITICAL: Respond in JSON format: " + '{"thought": "reasoning...", "action_type": "configure_interview", "action_data": {"required_skills": [...], "milestones": [...], "focus_areas": [...]}}'
        else:
            prompt += "\n\nCRITICAL: Respond in JSON format: " + '{"thought": "reasoning...", "action_type": "update_plan", "action_data": {"completed_milestones": [...], "current_focus": "...", "next_milestone": "...", "estimated_total_progress": "0-100%"}}'
            
        output = await self.intelligence_provider.generate_structured(prompt)
        self._log_thought(context.session_id, output.thought)
        return output

    def _build_initial_setup_prompt(self, context: AgentContext) -> str:
        jd = context.metadata.get("jd_text", "Unknown role")
        resume = context.metadata.get("resume_text", "Unknown candidate")
        return f"""You are the Strategy Agent. Analyze the JD and Resume to plan the interview.
JD: {jd}
Resume: {resume}
Goal: Define 3-4 key technical milestones and required skills.
"""

    def _build_refinement_prompt(self, context: AgentContext) -> str:
        history = context.history[-5:]
        return f"""You are the Strategy Agent. Based on recent history, refine the technical trajectory.
History: {history}
"""

    def _build_planning_prompt(self, context: AgentContext) -> str:
        history = context.history
        goals = context.metadata.get("milestones", ["General Tech", "Problem Solving"])
        return f"""Review progress against milestones.
Milestones: {goals}
History: {history[-5:] if history else "Start"}
Task: Determine next focus area and update progress.
"""

# Singleton
_strategy = None

def get_strategy_agent() -> StrategyAgent:
    global _strategy
    if _strategy is None:
        _strategy = StrategyAgent()
    return _strategy
