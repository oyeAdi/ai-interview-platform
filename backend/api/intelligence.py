from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from services.learning_repository import get_learning_repository
from prompts.prompt_service import get_prompt_service
from supabase_config import supabase_admin
from engine.agents.analyst import get_analyst_agent
from engine.agents.planner import get_planner_agent
from engine.protocol.base import AgentContext

router = APIRouter(prefix="/api/intelligence", tags=["Intelligence"])

@router.post("/audit")
async def audit_profile(data: Dict[str, Any]):
    """AI Technical Audit (Analyst Agent)"""
    analyst = get_analyst_agent()
    context = AgentContext(
        session_id="pre-interview-audit",
        history=[],
        metadata={
            "target_action": "calculate_ats_score",
            "resume_text": data.get("resume_text", ""),
            "jd_text": data.get("jd_text", "")
        }
    )
    result = await analyst.process(context)
    return result.action_data

@router.post("/strategize")
async def strategize_interview(data: Dict[str, Any]):
    """Generating Interview Trajectory (Planner Agent)"""
    planner = get_planner_agent()
    context = AgentContext(
        session_id="pre-interview-strategy",
        history=[],
        metadata={
            "session_goals": data.get("milestones", []),
            "jd_text": data.get("jd_text", ""),
            "resume_text": data.get("resume_text", "")
        }
    )
    result = await planner.process(context)
    return result.action_data

from engine.agents.executioner import get_executioner_agent

@router.post("/generate-email")
async def generate_email(data: Dict[str, Any]):
    """AI Email Generation (Executioner Agent)"""
    executioner = get_executioner_agent()
    context = AgentContext(
        session_id="pre-interview-email",
        history=[],
        metadata={
            "target_action": "generate_invitation_email",
            "candidate_name": data.get("candidate_name", "Candidate"),
            "position_title": data.get("position_title", "Technical Role")
        }
    )
    result = await executioner.process(context)
    return result.action_data

@router.get("/stats")
async def get_intelligence_stats():
    """Get overall IQ metrics for the system"""
    repo = get_learning_repository()
    return repo.get_metrics()

@router.get("/prompts")
async def get_prompts(category: Optional[str] = None):
    """List all prompt templates for the Intelligence Hub"""
    prompt_service = get_prompt_service()
    # prompt_service doesn't have a list_all yet, let's query Supabase directly
    query = supabase_admin.table('prompt_templates').select('*')
    if category:
        query = query.eq('category', category)
    
    response = query.order('name').execute()
    return {"prompts": response.data or []}

@router.get("/learnings")
async def get_learnings(limit: int = 20, category: Optional[str] = None):
    """Get the live Learning Stream (recent learnings)"""
    repo = get_learning_repository()
    # We'll use a lower confidence threshold for the 'stream' to show activity
    learnings = repo.get_high_confidence_learnings(min_confidence=0.0, category=category, limit=limit)
    return {"learnings": learnings}

@router.get("/prompts/{prompt_id}")
async def get_prompt_details(prompt_id: str):
    """Get full details of a specific prompt template"""
    response = supabase_admin.table('prompt_templates').select('*').eq('id', prompt_id).single().execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return response.data

@router.get("/pulse")
async def get_interview_pulse():
    """Get real-time status of all active/recent interview sessions"""
    response = supabase_admin.table('session_state_projection').select('*').order('last_updated_at', desc=True).limit(50).execute()
    return {"sessions": response.data or []}

@router.get("/sessions/{session_id}/events")
async def get_session_events(session_id: str):
    """Get full event trail for a specific session"""
    response = supabase_admin.table('interview_events').select('*').eq('session_id', session_id).order('sequence_number').execute()
    return {"events": response.data or []}
