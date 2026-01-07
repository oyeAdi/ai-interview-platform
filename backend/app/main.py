from fastapi import FastAPI, UploadFile, File, Form, HTTPException, WebSocket, WebSocketDisconnect, Request, Header, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional, Dict, Any, List
import logging
import json
from .core.swarm_orchestrator import get_or_create_orchestrator, delete_session, _sessions
from .supabase_config import supabase_admin
import sys
from pathlib import Path
from .middleware.rbac import require_permission, Permission
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Form, Depends, Request

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from services.payment_service import payment_service
    USE_PAYMENT_STUBS = False
except ImportError:
    USE_PAYMENT_STUBS = True
    logger.warning("Payment service not available, using stubs")

# Import stubs
from .payment_stubs import (
    get_subscription_plans_stub,
    get_tenant_subscription_stub,
    get_payment_history_stub,
    create_checkout_session_stub,
    get_usage_stub
)
import os



# Import Routers
from .routers.wiki import router as wiki_router
from .routers.super_admin import router as super_admin_router
from .routers.interview import router as interview_router
from .routers.utils import router as utils_router
from .routers.candidates import router as candidates_router

app = FastAPI(title="SwarmHire API")

# CORS Configuration
# Parse FRONTEND_URL from environment variable (comma-separated), defaulting to localhost for dev
origins_str = os.getenv("FRONTEND_URL", "")
origins = [origin.strip().rstrip("/") for origin in origins_str.split(",") if origin.strip()]
default_origins = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8000"]
allow_origins = origins + default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(wiki_router, prefix="/api")
app.include_router(super_admin_router, prefix="/api")
app.include_router(interview_router, prefix="/api")
app.include_router(utils_router, prefix="/api")
app.include_router(candidates_router, prefix="/api")

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append(websocket)

    def disconnect(self, websocket: WebSocket, session_id: str):
        if session_id in self.active_connections:
            self.active_connections[session_id].remove(websocket)
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]

    async def broadcast(self, message: dict, session_id: str):
        if session_id in self.active_connections:
            for connection in self.active_connections[session_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to connection: {e}")

manager = ConnectionManager()

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0-swarmhire"}

@app.get("/api/debug/dump")
async def debug_dump_sessions():
    """Dump all active in-memory sessions for debugging"""
    try:
        return {
            "source": "in-memory-cache",
            "active_sessions_count": len(_sessions),
            "sessions": {
                sid: {
                    "phase": orc.current_phase,
                    "rounds": f"{orc.rounds_completed}/{orc.total_rounds}",
                    "last_response": orc.last_response,
                    "history_len": len(orc.context.history)
                } for sid, orc in _sessions.items()
            }
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/debug/session/{session_id}")
async def debug_get_session(session_id: str):
    """Get full state of a specific session"""
    if session_id not in _sessions:
        raise HTTPException(status_code=404, detail="Session not found in memory")
    
    orc = _sessions[session_id]
    # Reconstruct the state object that would go to Redis
    return {
        "session_id": orc.session_id,
        "current_phase": orc.current_phase,
        "rounds_completed": orc.rounds_completed,
        "total_rounds": orc.total_rounds,
        "is_quick_start": orc.is_quick_start,
        "start_time": orc.start_time.isoformat() if orc.start_time else None,
        "max_duration_minutes": orc.max_duration_minutes,
        "last_response": orc.last_response,
        "last_candidate_answer": orc.last_candidate_answer,
        "context": orc.context.model_dump()
    }

async def resolve_org_id(request: Request, org_id: Optional[str] = None):
    """Helper to resolve org_id from param or header"""
    if org_id:
        return org_id
    
    tenant_slug = request.headers.get('X-Tenant-Slug')
    if tenant_slug:
        try:
            res = supabase_admin.table('organizations').select('id').eq('slug', tenant_slug).single().execute()
            if res.data:
                return res.data['id']
        except Exception:
            pass
    return None

@app.get("/api/accounts")
@require_permission(Permission.MANAGE_ACCOUNT)
async def get_accounts(request: Request, org_id: Optional[str] = None, current_user: dict = None):
    """Get list of accounts for an organization"""
    try:
        # Resolve target org: param -> header -> user context
        resolved_org_id = await resolve_org_id(request, org_id)
        target_org = resolved_org_id if resolved_org_id else current_user.get('org_id')
        
        if not target_org and not current_user.get('is_super_admin'):
            return {"accounts": []}
            
        query = supabase_admin.table('accounts').select('*')
        if target_org:
            query = query.eq('org_id', target_org)
            
        response = query.order('created_at', desc=True).execute()
        return {"accounts": response.data}
    except Exception as e:
        logger.error(f"Failed to fetch accounts: {e}")
        return {"accounts": []}

@app.get("/api/accounts/{account_id}/positions")
@require_permission(Permission.MANAGE_POSITION)
async def get_account_positions(request: Request, account_id: str, current_user: dict = None):
    """Get positions for a specific account"""
    try:
        response = supabase_admin.table('requirements').select('*').eq('account_id', account_id).execute()
        return {"positions": response.data}
    except Exception as e:
        logger.error(f"Failed to fetch account positions: {e}")
        return {"positions": []}

@app.post("/api/accounts")
@require_permission(Permission.CREATE_ACCOUNT)
async def create_account(request: Request, data: Dict[str, Any], current_user: dict = None):
    """Create a new account"""
    try:
        # Force org_id to user's org if not super admin
        if not current_user.get('is_super_admin'):
            data['org_id'] = current_user.get('org_id')
            
        response = supabase_admin.table('accounts').insert(data).execute()
        return response.data[0]
    except Exception as e:
        logger.error(f"Failed to create account: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/positions")
@require_permission(Permission.MANAGE_POSITION)
async def get_positions(request: Request, account_id: Optional[str] = None, org_id: Optional[str] = None, current_user: dict = None):
    """Get list of positions (requirements) for an account or organization"""
    try:
        resolved_org_id = await resolve_org_id(request, org_id)
        target_org = resolved_org_id if resolved_org_id else current_user.get('org_id')
        
        query = supabase_admin.table('requirements').select('*')
        if account_id:
            query = query.eq('account_id', account_id)
        if target_org:
            query = query.eq('org_id', target_org)
            
        response = query.order('created_at', desc=True).execute()
        return {"positions": response.data}
    except Exception as e:
        logger.error(f"Failed to fetch positions: {e}")
        return {"positions": []}

@app.post("/api/positions")
@require_permission(Permission.CREATE_POSITION)
async def create_position(request: Request, data: Dict[str, Any], current_user: dict = None):
    """Create a new position"""
    try:
        if not current_user.get('is_super_admin'):
            data['org_id'] = current_user.get('org_id')
            
        response = supabase_admin.table('requirements').insert(data).execute()
        return response.data[0]
    except Exception as e:
        logger.error(f"Failed to create position: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/jds")
def get_jds():
    """Get list of available JDs from Supabase (Alias for positions)"""
    try:
        response = supabase_admin.table('requirements').select('*').execute()
        jds = []
        for row in response.data:
            jds.append({
                "id": str(row['id']),
                "title": row['title'],
                "company": "EPAM Systems",
                "text": row['description'],
                "language": row.get('skills', ['python'])[0] if row.get('skills') else 'python'
            })
        return jds
    except Exception as e:
        logger.error(f"Failed to fetch requirements from Supabase: {e}")
        return []

@app.get("/api/positions/{position_id}/candidates")
@require_permission(Permission.MANAGE_POSITION)
async def get_position_candidates(request: Request, position_id: str, current_user: dict = None):
    """
    Get candidates for a specific position with fast SQL-based domain filtering.
    """
    try:
        # 1. Get Position details (org_id, title)
        pos_res = supabase_admin.table('requirements').select('org_id, title').eq('id', position_id).single().execute()
        if not pos_res.data:
            raise HTTPException(status_code=404, detail="Position not found")
        
        org_id = pos_res.data['org_id']
        pos_title = pos_res.data['title']
        
        # 2. Extract domain keywords from title to prevent cross-industry noise
        # Basic domains: Engineering, HR, Sales, Design
        keywords = []
        if any(term in pos_title.lower() for term in ['engineer', 'dev', 'software', 'tech', 'data']):
            keywords = ['engineer', 'developer', 'software', 'technical']
        elif any(term in pos_title.lower() for term in ['hr', 'recruiter', 'people', 'talent', 'staffing']):
            keywords = ['hr', 'recruiter', 'human resources', 'talent']
        elif any(term in pos_title.lower() for term in ['marketing', 'brand', 'content']):
            keywords = ['marketing', 'content', 'seo', 'social media']
        elif any(term in pos_title.lower() for term in ['sales', 'account executive', 'business development']):
            keywords = ['sales', 'business development', 'account executive']

        # 3. Query Resumes for this ORG
        # Use simple ILIKE filter on candidate_name or parsed_text if pool is huge
        # For now, we fetch all in org and do basic keyword filtering in Python for speed
        resumes_res = supabase_admin.table('resumes').select('*').eq('org_id', org_id).is_('deleted_at', 'null').execute()
        
        candidates = []
        for row in resumes_res.data:
            parsed_data = row.get('parsed_data') or {}
            resume_text = parsed_data.get('text', '').lower()
            candidate_name = row.get('candidate_name', 'Unnamed').lower()
            
            # Domain Filter: If keywords exist, check if name or text matches at least one
            is_relevant = True
            if keywords:
                is_relevant = any(k in resume_text or k in candidate_name for k in keywords)
            
            # Skip only if definitely irrelevant (Marketing resume for HR role)
            if not is_relevant:
                continue
                
            match_score = None
            # Check for existing match score in analyst_output
            if row.get('analyst_output') and isinstance(row['analyst_output'], dict):
                 match_score = row['analyst_output'].get('match_score')
            
            analyst_output = row.get('analyst_output') or {}
            
            candidates.append({
                "id": row['id'],
                "name": row.get('candidate_name', 'Unknown'),
                "experience_level": "senior" if (row.get('experience_years', 0) or 0) > 5 else "mid",
                "skills": row.get('skills', [])[:5],
                "language": analyst_output.get('language', 'English'),
                "match_score": match_score,
                "status": "ready" if match_score is not None else "pending"
            })
            
        return {"candidates": candidates, "position_title": pos_title}
    except Exception as e:
        logger.error(f"Failed to fetch position candidates: {e}")
        return {"candidates": []}

@app.post("/api/candidates/{candidate_id}/score")
@require_permission(Permission.START_SESSION)
async def score_candidate(request: Request, candidate_id: str, data: Dict[str, Any] = Body(...)):
    """
    Trigger async AI scoring for a specific candidate vs JD.
    """
    try:
        from .engine.agents.strategy import get_strategy_agent
        strategy = get_strategy_agent()
        
        jd_text = data.get("jd_text")
        if not jd_text:
            raise HTTPException(status_code=400, detail="JD text required")
            
        # Get resume
        res = supabase_admin.table('resumes').select('*').eq('id', candidate_id).single().execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        resume_text = res.data.get('parsed_data', {}).get('text', '')
        
        # Perform real audit
        analysis = await strategy.audit_match(resume_text, jd_text)
        match_score = analysis.get("match_score", 0)
        
        # Save score back to DB for future use
        analyst_output = res.data.get('analyst_output', {})
        if not analyst_output: analyst_output = {}
        analyst_output['match_score'] = match_score
        analyst_output['explanation'] = analysis.get('explanation')
        
        supabase_admin.table('resumes').update({"analyst_output": analyst_output}).eq('id', candidate_id).execute()
        
        return {
            "match_score": match_score,
            "explanation": analysis.get("explanation")
        }
    except Exception as e:
        logger.error(f"Candidate scoring failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/resumes/{candidate_id}")
async def get_resume_details(request: Request, candidate_id: str):
    """Get specific resume details for a candidate"""
    try:
        response = supabase_admin.table('resumes').select('*').eq('id', candidate_id).single().execute()
        if not response.data:
             raise HTTPException(status_code=404, detail="Resume not found")
             
        row = response.data
        parsed_data = row.get('parsed_data', {})
        analyst_output = row.get('analyst_output', {})
        
        return {
            "id": str(row['id']),
            "candidate_id": row['candidate_id'],
            "name": row['file_name'],
            "text": parsed_data.get('text', '') if parsed_data else '',
            "language": analyst_output.get('language', 'english'),
            "skills": row.get('skills', []),
            "experience_years": row.get('experience_years', 0),
            "match_reasoning": analyst_output.get('critique', ''),
            "analysis": analyst_output # Expose full analysis
        }
    except Exception as e:
        logger.error(f"Failed to fetch resume: {e}")
        raise HTTPException(status_code=404, detail="Resume not found")

@app.get("/api/resumes")
def get_resumes():
    """Get list of available Resumes from Supabase"""
    try:
        # Check if table 'resumes' exists, otherwise use 'profiles' as fallback if applicable
        # For now, stick to 'resumes' as per legacy implementation
        response = supabase_admin.table('resumes').select('*').execute()
        resumes = []
        for row in response.data:
            # Handle potential missing parsed_data
            parsed_data = row.get('parsed_data', {})
            resumes.append({
                "id": str(row['id']),
                "name": row['file_name'],
                "text": parsed_data.get('text', '') if parsed_data else '',
                "language": row.get('analyst_output', {}).get('language', 'python') if row.get('analyst_output') else 'python'
            })
        return resumes
    except Exception as e:
        logger.error(f"Failed to fetch resumes: {e}")
        return []

# Intelligence Endpoints
@app.post("/api/intelligence/audit")
@require_permission(Permission.START_SESSION)
async def intelligence_audit(request: Request, data: Dict[str, Any] = Body(...)):
    """AI Audit of resume vs JD"""
    try:
        from .engine.agents.strategy import get_strategy_agent
        strategy = get_strategy_agent()
        # In SIMPLIFIED core, Strategy handles the audit
        # Call Strategy Agent for real analysis
        resume_text = data.get('resume_text', '')
        jd_text = data.get('jd_text', '')
        
        # If we have texts, perform real audit
        if resume_text and jd_text:
            analysis = await strategy.audit_match(resume_text, jd_text)
            return {
                "overall_match": analysis.get("match_score", 0),
                "explanation": analysis.get("explanation", "Analysis complete."),
                "p0_jd_summary": analysis.get("p0_jd_summary", ""),
                "p1_resume_summary": analysis.get("p1_resume_summary", ""),
                "p3_strengths": analysis.get("p3_strengths", []),
                "p4_gaps": analysis.get("p4_gaps", []),
                "metadata": analysis.get("metadata", {}),
                "critique": analysis.get("critique", ""),
                "observer_notes": analysis.get("observer_notes", ""),
                "confidence": 0.95
            }
        
        # Default fallback if texts missing
        return {
            "overall_match": 0,
            "explanation": "Missing Resume or Job Description text for analysis.",
            "analysis": "Please ensure both documents are provided."
        }
    except Exception as e:
        logger.error(f"AI Audit failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/intelligence/strategize")
@require_permission(Permission.START_SESSION)
async def intelligence_strategize(request: Request, data: Dict[str, Any] = Body(...)):
    """Generate interview strategy"""
    try:
        from .engine.agents.strategy import get_strategy_agent
        # Call Strategy Agent for real blueprint generation
        jd_text = data.get('jd_text', '')
        resume_text = data.get('resume_text', '')
        
        strategy_data = await strategy.generate_strategy_map(jd_text, resume_text)
        return strategy_data
    except Exception as e:
        logger.error(f"Strategy generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/extract-skills")
async def extract_skills(data: Dict[str, Any] = Body(...)):
    """Extract skills from JD for auto-population"""
    try:
        jd_text = data.get("jd_text")
        if not jd_text:
            return {"skills": []}
        from .engine.agents.strategy import get_strategy_agent
        strategy = get_strategy_agent()
        analysis = await strategy.audit_match("", jd_text)
        skills = []
        for s in analysis.get("p3_strengths", []):
            skills.append({"name": s.upper(), "proficiency": "comfortable", "type": "must_have"})
        for s in analysis.get("p4_gaps", []):
            skills.append({"name": s.upper(), "proficiency": "basic_knowledge", "type": "nice_to_have"})
        return {"skills": skills[:15]} # Limit to 15 skills
    except Exception as e:
        logger.error(f"Skill extraction failed: {e}")
        return {"skills": []}

@app.post("/api/map-skills")
async def map_skills(data: Dict[str, Any] = Body(...)):
    """Map skills to technical categories"""
    skills = data.get("skills", [])
    # Simple semantic grouping
    category_map = {"TECHNICAL_CORE": skills}
    return {"category_map": category_map}

@app.post("/api/configure-interview")
async def configure_interview(data: Dict[str, Any] = Body(...)):
    """Comprehensive AI configuration for an interview"""
    try:
        jd_text = data.get("jd_text")
        from .engine.agents.strategy import get_strategy_agent
        strategy = get_strategy_agent()
        strategy_data = await strategy.generate_strategy_map(jd_text, "")
        
        # Structure for Frontend Components
        ai_metadata = {
            "interview_parameters": {
                "duration_minutes": strategy_data.get("estimated_duration", 60),
                "experience_level": strategy_data.get("overall_difficulty", "mid"),
                "expectations": strategy_data.get("strategy_narrative", ""),
                "urgency": "medium",
                "urgency_source": "ai_suggested"
            },
            "interview_flow": [
                {
                    "category": m.get("title", "Phase"),
                    "duration": 15, # Default segment duration
                    "difficulty": m.get("difficulty", "medium").lower()
                } for m in strategy_data.get("milestones", [])
            ],
            "sample_questions": [
                {
                    "question": f"How do you approach {m.get('title')}?",
                    "category": m.get("title"),
                    "expected_answer": "Demonstrates core competency."
                } for m in strategy_data.get("milestones", [])
            ]
        }
        
        # Also return flat keys for the main DataModel sync
        ai_metadata["duration"] = ai_metadata["interview_parameters"]["duration_minutes"]
        ai_metadata["level"] = ai_metadata["interview_parameters"]["experience_level"]
        ai_metadata["flow"] = [m.get("title") for m in strategy_data.get("milestones", [])]
        ai_metadata["expectations"] = ai_metadata["interview_parameters"]["expectations"]
        
        return {"ai_metadata": ai_metadata}
    except Exception as e:
        logger.error(f"AI configuration failed: {e}")
        return {"ai_metadata": None}

@app.post("/api/intelligence/generate-email")
@require_permission(Permission.START_SESSION)
async def intelligence_generate_email(request: Request, data: Dict[str, Any] = Body(...)):
    """Generate interview invitation email template"""
    try:
        from .utils.email_generator import generate_interview_email
        
        email_body = generate_interview_email(
            candidate_name=data.get('candidate_name', 'Candidate'),
            position_title=data.get('position_title', 'Technical Role'),
            company_name="SwarmHire",
            interview_link="{{link}}",
            expires_at="24 hours",
            ttl_minutes=1440
        )
        return {"email_body": email_body}
    except Exception as e:
        import traceback
        traceback.print_exc()
        logger.error(f"Email generation failed: {e}")
        return {"email_body": f"Failed to generate AI email template. Debug Error: {str(e)}"}

@app.post("/api/swarm/init")
@require_permission(Permission.START_SESSION)
async def initialize_swarm(
    request: Request,
    jd_text: Optional[str] = Form(None),
    resume_text: Optional[str] = Form(None),
    metadata: Optional[str] = Form(None),
    current_user: dict = None
):
    """
    Initialize a new swarm session.
    """
    try:
        meta_dict = json.loads(metadata) if metadata else {}
        orchestrator = get_or_create_orchestrator()
        
        # Initialize session (Analyst + Architect)
        init_result = await orchestrator.initialize_session(
            jd_text=jd_text or "",
            resume_text=resume_text or "",
            metadata=meta_dict
        )
        
        return {
            "session_id": orchestrator.session_id,
            "analyst_feedback": init_result["analyst_feedback"],
            "config": init_result["config"]
        }
    except Exception as e:
        logger.error(f"Failed to initialize swarm: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/interview/{session_id}/end")
async def end_interview(session_id: str, data: Dict[str, Any]):
    """
    End an interview session and notify all participants.
    """
    try:
        orchestrator = get_or_create_orchestrator(session_id)
        
        # Generate final report before ending
        final_report = await orchestrator.generate_final_report()
        
        # Broadcast end message with report to all connected clients
        payload = {
            "type": "session_ended",
            "data": {
                **data,
                "final_report": final_report
            }
        }
        await manager.broadcast(payload, session_id)
        
        # Clean up the orchestrator
        delete_session(session_id)
        
        return {"status": "success", "message": "Interview ended", "report": final_report}
    except Exception as e:
        logger.error(f"Failed to end interview: {e}")
        # Even if report generation fails, we should still try to end the session
        delete_session(session_id)
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/swarm/{session_id}")
async def swarm_websocket(websocket: WebSocket, session_id: str):
    """
    WebSocket handler for real-time swarm interaction.
    """
    orchestrator = get_or_create_orchestrator(session_id)
    await manager.connect(websocket, session_id)
    
    try:
        # Send initial greeting or current state
        state = orchestrator.get_current_state()
        if state:
            await websocket.send_json({
                "type": "swarm_response",
                "data": state
            })
        else:
            greeting = await orchestrator.get_greeting()
            await websocket.send_json({
                "type": "greeting",
                "data": {"text": greeting}
            })
        
        while True:
            data = await websocket.receive_json()
            message_type = data.get("type")
            
            if message_type == "candidate_response":
                text = data.get("text")
                
                # Broadcast the candidate's answer to all views (especially Expert)
                await manager.broadcast({
                    "type": "candidate_answer",
                    "data": {"text": text}
                }, session_id)
                
                result = await orchestrator.process_candidate_input(text)
                
                # Broadcast the swarm's response to all views
                await manager.broadcast({
                    "type": "swarm_response",
                    "data": result
                }, session_id)
                
            elif message_type == "candidate_typing":
                text = data.get("text")
                await manager.broadcast({
                    "type": "candidate_typing",
                    "data": {"text": text}
                }, session_id)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)
        logger.info(f"WebSocket disconnected for session: {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket, session_id)
        await websocket.close()

# ============================================================================
# PAYMENT ENDPOINTS
# ============================================================================

@app.get("/api/payments/plans")
async def get_subscription_plans():
    """Get all available subscription plans"""
    try:
        if USE_PAYMENT_STUBS:
            plans = get_subscription_plans_stub()
        else:
            plans = payment_service.get_subscription_plans()
        return {"plans": plans}
    except Exception as e:
        logger.error(f"Error fetching subscription plans: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/payments/providers")
async def get_payment_providers():
    """Get available payment providers"""
    if USE_PAYMENT_STUBS:
        providers = ["stripe", "razorpay"]  # Stub: show both available
    else:
        providers = payment_service.get_available_providers()
    return {"providers": providers}

@app.post("/api/payments/create-checkout")
async def create_checkout_session(data: Dict[str, Any]):
    """
    Create a checkout session for subscription
    
    Body:
    {
        "tenant_id": "tenant-uuid",
        "plan_id": "plan-uuid",
        "provider": "stripe" | "razorpay",
        "success_url": "https://yourapp.com/success",
        "cancel_url": "https://yourapp.com/cancel",
        "customer_email": "user@example.com" (optional)
    }
    """
    try:
        tenant_id = data.get("tenant_id")
        plan_id = data.get("plan_id")
        provider = data.get("provider", "stripe")
        success_url = data.get("success_url", "http://localhost:3000/payment/success")
        cancel_url = data.get("cancel_url", "http://localhost:3000/payment/cancel")
        customer_email = data.get("customer_email")
        
        if not tenant_id or not plan_id:
            raise HTTPException(status_code=400, detail="tenant_id and plan_id are required")
        
        if USE_PAYMENT_STUBS:
            # Use stub: redirect to success page immediately
            result = create_checkout_session_stub(
                tenant_id=tenant_id,
                plan_id=plan_id,
                provider=provider,
                success_url=success_url,
                cancel_url=cancel_url
            )
        elif provider == "stripe":
            result = payment_service.create_stripe_checkout_session(
                tenant_id=tenant_id,
                plan_id=plan_id,
                success_url=success_url,
                cancel_url=cancel_url,
                customer_email=customer_email
            )
        elif provider == "razorpay":
            result = payment_service.create_razorpay_subscription(
                tenant_id=tenant_id,
                plan_id=plan_id,
                customer_email=customer_email
            )
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")
        
        return result
    except Exception as e:
        logger.error(f"Error creating checkout session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/payments/webhook/stripe")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None, alias="stripe-signature")):
    """Handle Stripe webhook events"""
    if USE_PAYMENT_STUBS:
        return {"status": "ignored", "message": "Using payment stubs"}
    try:
        payload = await request.body()
        result = payment_service.handle_stripe_webhook(payload, stripe_signature)
        return result
    except Exception as e:
        logger.error(f"Error handling Stripe webhook: {e}")
        return JSONResponse(status_code=400, content={"error": str(e)})

@app.post("/api/payments/webhook/razorpay")
async def razorpay_webhook(request: Request, x_razorpay_signature: str = Header(None, alias="x-razorpay-signature")):
    """Handle Razorpay webhook events"""
    if USE_PAYMENT_STUBS:
        return {"status": "ignored", "message": "Using payment stubs"}
    try:
        payload = await request.json()
        result = payment_service.handle_razorpay_webhook(payload, x_razorpay_signature)
        return result
    except Exception as e:
        logger.error(f"Error handling Razorpay webhook: {e}")
        return JSONResponse(status_code=400, content={"error": str(e)})

@app.get("/api/subscriptions/current")
async def get_current_subscription(tenant_id: str):
    """Get current subscription for a tenant"""
    try:
        if USE_PAYMENT_STUBS:
            subscription = get_tenant_subscription_stub(tenant_id)
        else:
            subscription = payment_service.get_tenant_subscription(tenant_id)
        if subscription:
            return {"subscription": subscription}
        return {"subscription": None}
    except Exception as e:
        logger.error(f"Error fetching subscription: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/subscriptions/cancel")
async def cancel_subscription(data: Dict[str, Any]):
    """
    Cancel a subscription
    
    Body:
    {
        "tenant_id": "tenant-uuid",
        "cancel_at_period_end": true (optional, defaults to true)
    }
    """
    try:
        tenant_id = data.get("tenant_id")
        cancel_at_period_end = data.get("cancel_at_period_end", True)
        
        if not tenant_id:
            raise HTTPException(status_code=400, detail="tenant_id is required")
        
        if USE_PAYMENT_STUBS:
            # Stub: just return success
            return {"status": "success", "cancel_at_period_end": cancel_at_period_end, "message": "Subscription will be canceled (stub)"}
        else:
            result = payment_service.cancel_subscription(tenant_id, cancel_at_period_end)
            return result
    except Exception as e:
        logger.error(f"Error canceling subscription: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/payments/history")
async def get_payment_history(tenant_id: str, limit: int = 10):
    """Get payment history for a tenant"""
    try:
        if USE_PAYMENT_STUBS:
            payments = get_payment_history_stub(tenant_id, limit)
        else:
            response = supabase_admin.table('payments').select('*').eq('tenant_id', tenant_id).order('created_at', desc=True).limit(limit).execute()
            payments = response.data
        return {"payments": payments}
    except Exception as e:
        logger.error(f"Error fetching payment history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/subscriptions/usage")
async def get_subscription_usage(tenant_id: str):
    """Get usage statistics for tenant (interviews used/available)"""
    try:
        if USE_PAYMENT_STUBS:
            usage = get_usage_stub(tenant_id)
        else:
            # Real implementation would query database
            usage = {"current": 0, "max": 5, "allowed": True}
        return usage
    except Exception as e:
        logger.error(f"Error fetching usage: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
