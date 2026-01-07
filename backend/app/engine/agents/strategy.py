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
import json
import re

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

    async def audit_match(self, resume_text: str, jd_text: str) -> Dict[str, Any]:
        """
        Analyze the match between a Resume and a Job Description.
        Returns a score (0-100) and reasoning.
        """
        if not resume_text:
            prompt = f"""
            You are an expert technical architect. Analyze the following Job Description to extract core requirements and skills.

            Job Description:
            {jd_text}

            Task:
            1. Identify core technical requirements (P0).
            2. Extract required technical strengths needed for this role (P3).
            3. Identify potential general knowledge gaps or areas for basic screening (P4).
            4. Extract Metadata:
               - domain: The hiring domain (e.g. Fintech, E-commerce, AI, Healthcare)
               - criticality: How critical is the position (High, Medium, Low)
               - interview_level: Recommended level for the session (Hard, Medium, Easy)
               - experience_context: Summary of requirements
               - is_technical: Boolean (Is this a technical/coding role?)
               - include_coding: Boolean (Should coding questions be asked?)

            CRITICAL: Return ONLY valid JSON in the following format:
            {{
                "match_score": 100,
                "explanation": "Requirement analysis complete.",
                "p0_jd_summary": "<string>",
                "p1_resume_summary": "N/A",
                "p3_strengths": ["list", "of", "required", "skills"],
                "p4_gaps": ["list", "of", "general", "prerequisites"],
                "metadata": {{
                    "domain": "<string>",
                    "criticality": "<string>",
                    "interview_level": "<string>",
                    "experience_context": "<string>",
                    "is_technical": <boolean>,
                    "include_coding": <boolean>
                }},
                "critique": "Plan based on JD analysis.",
                "observer_notes": "Extracted requirements for blueprinting."
            }}
            """
        else:
            prompt = f"""
            You are an expert technical recruiter and ATS system.
            Analyze the following Resume against the Job Description.

            Job Description:
            {jd_text}

            Resume:
            {resume_text}

            Task:
            1. Calculate a match score from 0 to 100 based on technical skills, experience, and relevance.
            2. Provide a detailed multidimensional analysis:
               - P0: JD/Requirement understanding (What is the core of this role?)
               - P1: Resume summary (What are the candidate's main highlights?)
               - P3: Technical Strengths (Where does the candidate excel?)
               - P4: Knowledge Gaps (Where is the candidate weak and needs basic level questions?)
            3. Extract Metadata:
               - domain: The hiring domain (e.g. Fintech, E-commerce, AI, Healthcare)
               - criticality: How critical is the position (High, Medium, Low)
               - interview_level: Recommended level for the session (Hard, Medium, Easy)
               - experience_context: Summary of candidates experience vs requirement
               - is_technical: Boolean (Is this a technical/coding role?)
               - include_coding: Boolean (Should coding questions be asked?)

            CRITICAL: Return ONLY valid JSON in the following format:
            {{
                "match_score": <number 0-100>,
                "explanation": "<string concise summary>",
                "p0_jd_summary": "<string>",
                "p1_resume_summary": "<string>",
                "p3_strengths": ["list", "of", "strings"],
                "p4_gaps": ["list", "of", "strings"],
                "metadata": {{
                    "domain": "<string>",
                    "criticality": "<string>",
                    "interview_level": "<string>",
                    "experience_context": "<string>",
                    "is_technical": <boolean>,
                    "include_coding": <boolean>
                }},
                "critique": "<string agent critique to improve the plan>",
                "observer_notes": "<string observation to improve platform IQ>"
            }}
            """
        
        try:
            output = await self.intelligence_provider.generate_structured(prompt)
            # The base agent returns InferenceOutput which has 'thought', 'action_type', 'action_data' usually
            # But generate_structured relies on the provider.
            # Let's assume the provider returns a dict or object we can parse.
            # If InferenceOutput is returned:
            if isinstance(output, InferenceOutput):
                if output.action_data:
                    return output.action_data
                
                # Check raw_response for JSON block if action_data failed
                raw = output.raw_response or output.thought
                if raw:
                    # Strip code fences
                    json_match = re.search(r'```(?:json)?\s*({.*})\s*```', raw, re.DOTALL)
                    if json_match:
                        try:
                            return json.loads(json_match.group(1))
                        except:
                            pass
                    # Try finding brace to brace
                    brace_match = re.search(r'({.*})', raw, re.DOTALL)
                    if brace_match:
                        try:
                            return json.loads(brace_match.group(1))
                        except:
                            pass
                
            # Fallback mock if LLM fails
            return {
                "match_score": 0,
                "explanation": "Failed to generate analysis.",
                "analysis": "Error in AI processing."
            }
        except Exception as e:
            print(f"Error in audit_match: {e}")
            return {
                "match_score": 0,
                "explanation": "System error during analysis.",
                "analysis": str(e)
            }

    async def generate_strategy_map(self, jd_text: str, resume_text: str = "") -> Dict[str, Any]:
        """
        Generate a strategic interview map/blueprint based on JD and Resume.
        """
        prompt = f"""
        You are the Strategy Architect. Design a technical interview blueprint.
        
        Job Description:
        {jd_text}
        
        Candidate Profile (Optional):
        {resume_text or "No specific candidate - generate general strategy."}
        
        Task:
        1. Define 4-5 core milestones for the interview (e.g. "Low Level Design", "System Architecture", "Behavioral Context").
        2. Assign a difficulty level to each milestone.
        3. Identify 3 critical questions or focus areas for each milestone.
        
        CRITICAL: Respond in JSON format:
        {{
            "milestones": [
                {{
                    "title": "<string>",
                    "difficulty": "<string>",
                    "focus": ["<string>", "<string>", "<string>"]
                }}
            ],
            "estimated_duration": 60,
            "overall_difficulty": "Medium",
            "strategy_narrative": "<string concise overview of the interview approach>"
        }}
        """
        
        try:
            output = await self.intelligence_provider.generate_structured(prompt)
            if isinstance(output, InferenceOutput) and output.action_data:
                return output.action_data
            
            # Fallback parsing
            raw = output.raw_response if isinstance(output, InferenceOutput) else str(output)
            brace_match = re.search(r'({.*})', raw, re.DOTALL)
            if brace_match:
                return json.loads(brace_match.group(1))
                
            return {"milestones": [], "strategy_narrative": "Standard evaluation plan."}
        except Exception as e:
            logger.error(f"Error in generate_strategy_map: {e}")
            return {"milestones": [], "error": str(e)}

# Singleton
_strategy = None

def get_strategy_agent() -> StrategyAgent:
    global _strategy
    if _strategy is None:
        _strategy = StrategyAgent()
    return _strategy
