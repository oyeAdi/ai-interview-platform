"""
Planner Agent - Swarm 2.0
The evolution of the Strategy Planner.
Responsible for high-level session goal setting and technical milestone tracking.
"""

from engine.protocol.base import BaseAgent, AgentContext, InferenceOutput
from engine.intelligence.dispatch import get_intelligence_dispatch

class PlannerAgent(BaseAgent):
    """
    The Planner defines the 'Mission' for the interview session.
    It ensures that all required technical domains are covered within the time limit.
    """
    
    def __init__(self):
        super().__init__(
            name="Planner",
            intelligence_provider=get_intelligence_dispatch()
        )

    async def process(self, context: AgentContext) -> InferenceOutput:
        """
        Calculates the next strategic milestone for the interview.
        """
        prompt = self._build_planning_prompt(context)
        
        # Request structured strategic plan
        prompt += "\n\nCRITICAL: You must respond in the following JSON format:\n"
        prompt += '{"thought": "Your reasoning about the interview progress/strategy", "action_type": "update_plan", "action_data": {"completed_milestones": [...], "current_focus": "...", "next_milestone": "...", "estimated_completion": "0-100%"}}'
        
        output = await self.intelligence_provider.generate_structured(prompt)
        
        # Log the planning thought
        self._log_thought(context.session_id, output.thought)
        
        return output

    def _build_planning_prompt(self, context: AgentContext) -> str:
        history = context.history
        goals = context.metadata.get("session_goals", ["Evaluate System Design", "Evaluate Python Proficiency", "Verify Soft Skills"])
        
        return f"""You are the Planner Agent for an elite technical interview swarm.
Your goal is to optimize the interview trajectory to ensure maximum information gain.

SESSION GOALS:
{goals}

HISTORY:
{history[-5:] if history else "Beginning of session."}

TASK:
1. Review the current progress against the session goals.
2. Determine which goal should be the priority for the next technical round.
3. Identify any goals that are already satisfied.
"""

# Singleton
_planner = None

def get_planner_agent() -> PlannerAgent:
    global _planner
    if _planner is None:
        _planner = PlannerAgent()
    return _planner
