"""
Executioner Agent - Generation Swarm
Responsible for conducting the interview, managing conversational flow, 
and selecting intelligent follow-up strategies.
"""

from typing import Dict, List, Optional, Any
from llm.gemini_client import GeminiClient
from prompts.prompt_service import get_prompt_service
from services.event_store import get_event_store
from services.agents.evaluator_agent import get_evaluator_agent

class ExecutionerAgent:
    """
    The Executioner Agent handles the live interaction with the candidate.
    It uses a 7-phase state machine and a 5-strategy swarm for follow-ups.
    """
    
    PHASES = [
        "greeting",
        "self_introduction",
        "candidate_introduction",
        "comfort_discovery",
        "seed_execution",
        "dynamic_followup",
        "closure"
    ]
    
    STRATEGIES = {
        "depth": "Probe deeper into technical nuances and 'why' behind the implementation.",
        "breadth": "Shift focus to related peripheral topics to test boundary knowledge.",
        "clarification": "Ask for clarification on vague or incomplete parts of the answer.",
        "challenge": "Present a difficult edge case or constraint to test problem-solving limits.",
        "trap": "Verify consistency by asking about a potential contradiction with earlier claims."
    }
    
    def __init__(self):
        self.gemini_client = GeminiClient()
        self.prompt_service = get_prompt_service()
        self.event_store = get_event_store()
        self.evaluator = get_evaluator_agent()
        
    def get_next_action(self, session_id: str, context: Dict) -> Dict:
        """
        Determines the next agent action based on the current interview state.
        
        Context expects:
        - current_phase: str
        - last_answer: str
        - last_question: str
        - question_count: int
        - history: List[Dict]
        - experience_level: str
        """
        phase = context.get("current_phase", "greeting")
        
        # Phase 1-5 transitions are mostly linear for now
        # Phase 6 (dynamic_followup) uses the 5-strategy swarm
        
        if phase == "dynamic_followup":
            return self._handle_dynamic_followup(session_id, context)
        else:
            return self._handle_linear_phase(session_id, context, phase)

    def _handle_linear_phase(self, session_id: str, context: Dict, phase: str) -> Dict:
        """Handles the standard introductory and closing phases."""
        # For simplicity in this logic, we use a mapping to prompt templates
        phase_templates = {
            "greeting": "transition_message", # Can be repurposed or use custom
            "self_introduction": "transition_message",
            "candidate_introduction": "transition_message",
            "comfort_discovery": "transition_message",
            "seed_execution": "first_question_personalized",
            "closure": "transition_message"
        }
        
        # Render a transition or personalized message
        # In a real implementation, we'd have dedicated templates for each phase
        # Here we use placeholders if templates aren't fully specialized yet
        
        # Placeholder logic for phase generation
        if phase == "greeting":
            text = "Hi there! I'm SwarmHire's Executioner Agent. It's great to meet you. How are you doing today?"
        elif phase == "self_introduction":
            text = "Today, I'll be conducting your technical interview. My goal is to explore your depth in technical roles and understand how you solve real-world problems. Feel free to ask for clarification at any point."
        elif phase == "candidate_introduction":
            text = "To start, could you give me a brief overview of your background and the projects you've been most proud of recently?"
        elif phase == "closure":
            text = "That concludes our technical deep-dive! Thank you for the insightful conversation. Do you have any questions for me about the role or the team?"
        else:
            text = "Let's move to our first core topic."
            
        action = {
            "text": text,
            "phase": phase,
            "agent": "Executioner",
            "type": "statement" if phase in ["greeting", "self_introduction"] else "question"
        }
        
        # Emit event
        self.event_store.append_event(
            session_id,
            "ExecutionerAction",
            {**action, "thought_process": f"Executing Phase: {phase}"}
        )
        
        return action

    def _handle_dynamic_followup(self, session_id: str, context: Dict) -> Dict:
        """The core 5-strategy swarm logic."""
        # 1. Get score for the last answer
        scores = self.evaluator.score_response(
            question=context["last_question"],
            answer=context["last_answer"],
            experience_level=context["experience_level"]
        )
        
        # 2. Strategy Selection Logic (The "Swarm Decision")
        # Logic: 
        # - If accuracy/completeness < 50% -> Clarification
        # - If scores > 85% and it's a senior role -> Challenge
        # - If scores are 60-80% -> Depth
        # - If everything is great but we want to check consistency -> Trap (rarely selected here for MVP)
        # - Otherwise -> Breadth
        
        if scores["accuracy"] < 50 or scores["completeness"] < 40:
            strategy = "clarification"
        elif scores["overall"] > 85 and context["experience_level"] == "senior":
            strategy = "challenge"
        elif 50 <= scores["overall"] <= 85:
            strategy = "depth"
        else:
            strategy = "breadth"
            
        # 3. Render the follow-up with the selected strategy
        render_result = self.prompt_service.render(
            "followup_generation",
            variables={
                "original_question": context["last_question"],
                "candidate_response": context["last_answer"],
                "score": scores["overall"],
                "strategy_guidance": self.STRATEGIES[strategy]
            }
        )
        
        response = self.gemini_client.model.generate_content(
            render_result["rendered_prompt"],
            generation_config=render_result["generation_config"].to_gemini_config()
        )
        
        question_text = response.text.strip()
        
        action = {
            "text": question_text,
            "phase": "dynamic_followup",
            "strategy": strategy,
            "scores": scores,
            "agent": "Executioner",
            "type": "question"
        }
        
        # 4. Emit events for both strategy selection and question
        self.event_store.append_event(
            session_id,
            "StrategySelected",
            {
                "strategy": strategy,
                "reason": f"Evaluator scores: {scores['overall']}% overall. Selecting {strategy} focus.",
                "metrics": scores
            }
        )
        
        self.event_store.append_event(
            session_id,
            "QuestionAsked",
            {
                "question_text": question_text,
                "question_category": "followup",
                "strategy": strategy,
                "agent": "Executioner",
                "thought_process": f"Selected {strategy} strategy based on candidate's {scores['overall']}% score."
            }
        )
        
        return action

# Singleton
_executioner = None

def get_executioner_agent() -> ExecutionerAgent:
    global _executioner
    if _executioner is None:
        _executioner = ExecutionerAgent()
    return _executioner
