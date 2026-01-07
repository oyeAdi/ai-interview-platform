from fastapi import APIRouter, HTTPException, Depends, Request, Body
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging
from datetime import datetime, timedelta
import uuid

from ..core.swarm_orchestrator import get_or_create_orchestrator
from ..utils.email_sender import send_interview_email
from ..utils.email_generator import generate_interview_email
from ..middleware.rbac import get_current_user, check_permission, Permission
from ..supabase_config import supabase_admin

router = APIRouter(prefix="/interview", tags=["interview"])
logger = logging.getLogger(__name__)

class CreateSessionRequest(BaseModel):
    position_id: str
    candidate_id: Optional[str] = None
    ttl_minutes: int = 60
    resume_text: Optional[str] = None
    send_email: bool = False
    candidate_email: Optional[str] = None

async def verify_session_creation(request: Request) -> dict:
    """Dependency to verify permission for creating a session"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Check if user has permission to start session
    if not await check_permission(user, Permission.START_SESSION):
        raise HTTPException(status_code=403, detail="Forbidden: Missing permission 'start_session'")
        
    return user

@router.post("/create-session")
async def create_session(request: Request, data: CreateSessionRequest = Body(...), current_user: dict = Depends(verify_session_creation)):
    """
    Create a new interview session.
    - Initializes SwarmOrchestrator
    - Generates unique session links
    - Optionally sends email invitation
    """
    try:
        session_id = str(uuid.uuid4())
        
        # 1. Fetch Position Details
        position_res = supabase_admin.table('requirements').select('*').eq('id', data.position_id).execute()
        if not position_res.data:
            raise HTTPException(status_code=404, detail="Position not found")
        position = position_res.data[0]
        
        # 2. Fetch/Prepare Candidate Details
        candidate_name = "Candidate"
        if data.candidate_id and data.candidate_id != 'custom':
            # Try to fetch from resumes table first (legacy)
            try:
                candidate_res = supabase_admin.table('resumes').select('*').eq('candidate_id', data.candidate_id).execute()
                if candidate_res.data:
                    candidate_name = candidate_res.data[0].get('file_name', 'Candidate')
            except:
                pass 
                
        # 3. Initialize Swarm Session
        orchestrator = get_or_create_orchestrator(session_id)
        
        # Provide context to Swarm
        metadata = {
            "position_id": data.position_id,
            "position_title": position.get('title', 'Technical Role'),
            "candidate_id": data.candidate_id,
            "candidate_name": candidate_name,
            "ttl_minutes": data.ttl_minutes,
            "created_by": current_user.get('id') if current_user else 'system'
        }
        
        await orchestrator.initialize_session(
            jd_text=position.get('description', ''),
            resume_text=data.resume_text or "",
            metadata=metadata
        )
        
        # 4. Generate Links
        # Use origin from request headers if available, otherwise default to configured base URL
        origin = request.headers.get('origin')
        if not origin:
             # Fallback to backend URL logic or env var if origin not present (e.g. server-to-server)
             origin = "http://localhost:3000" # Default local
             
        # Check if production domain
        if "swarmhire.ai" in str(request.base_url):
             origin = "https://app.swarmhire.ai"

        candidate_link = f"{origin}/interview/{session_id}"
        expert_link = f"{origin}/interview/{session_id}?mode=expert"
        
        expires_at = (datetime.now() + timedelta(minutes=data.ttl_minutes)).isoformat()
        
        response_data = {
            "session_id": session_id,
            "email_sent": False,
            "links": {
                 "candidate": candidate_link,
                 "expert": expert_link
            },
            "expires_at": expires_at,
            "ttl_minutes": data.ttl_minutes
        }
        
        # 5. Send Email if requested
        if data.send_email and data.candidate_email:
            company_name = "SwarmHire" # Could be dynamic based on Tenant
            
            # Generate email content
            email_body = generate_interview_email(
                candidate_name=candidate_name,
                position_title=position.get('title', 'Technical Role'),
                company_name=company_name,
                interview_link=candidate_link,
                expires_at=expires_at,
                ttl_minutes=data.ttl_minutes
            )
            
            subject = f"Interview Invitation: {position.get('title', 'Technical Role')} at {company_name}"
            
            email_result = send_interview_email(
                to_email=data.candidate_email,
                subject=subject,
                html_body=email_body
            )
            
            if email_result['success']:
                response_data.update({
                    "email_sent": True,
                    "candidate_email": data.candidate_email,
                    "expert_link": expert_link,
                    "email_provider": email_result['provider']
                })
            else:
                 logger.error(f"Failed to send email: {email_result.get('error')}")
                 pass
                 
        return response_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create session: {e}")
        raise HTTPException(status_code=500, detail=str(e))
