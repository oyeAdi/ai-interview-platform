from fastapi import APIRouter, HTTPException, Request
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr
from datetime import datetime
import logging

from ..middleware.rbac import require_permission, Permission

router = APIRouter(
    prefix="/candidates",
    tags=["candidates"]
)

logger = logging.getLogger(__name__)


# Pydantic Models
class CandidateCreate(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    resume_text: str
    skills: List[str] = []
    experience_years: Optional[int] = None
    file_name: Optional[str] = None
    org_id: str


class CandidateUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    resume_text: Optional[str] = None
    skills: Optional[List[str]] = None
    experience_years: Optional[int] = None


class CandidateResponse(BaseModel):
    id: str
    name: str
    email: Optional[str]
    phone: Optional[str]
    skills: List[str]
    experience_years: Optional[int]
    file_name: Optional[str]
    created_at: datetime
    last_match_score: Optional[int] = None


@router.post("")
@require_permission(Permission.START_SESSION)
async def create_candidate(request: Request, candidate: CandidateCreate):
    """
    Save a new candidate to the talent pool.
    """
    try:
        from ..database import get_supabase_client
        
        supabase = get_supabase_client()
        
        # Prepare data for insertion
        candidate_data = {
            "candidate_name": candidate.name,
            "candidate_email": candidate.email,
            "candidate_phone": candidate.phone,
            "parsed_data": {
                "text": candidate.resume_text,
                "email": candidate.email,
                "phone": candidate.phone
            },
            "skills": candidate.skills,
            "experience_years": candidate.experience_years,
            "file_name": candidate.file_name,
            "org_id": candidate.org_id,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Insert into resumes table
        result = supabase.table("resumes").insert(candidate_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create candidate")
        
        return {
            "id": result.data[0]["id"],
            "message": "Candidate saved to talent pool successfully"
        }
        
    except Exception as e:
        logger.error(f"Error creating candidate: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
@require_permission(Permission.START_SESSION)
async def list_candidates(
    request: Request,
    org_id: str,
    min_experience: Optional[int] = None,
    skills: Optional[str] = None,  # Comma-separated
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    """
    List candidates with optional filtering.
    """
    try:
        from ..database import get_supabase_client
        
        supabase = get_supabase_client()
        
        # Start query
        query = supabase.table("resumes").select("*")
        
        # Filter by org_id
        query = query.eq("org_id", org_id)
        
        # Filter out soft-deleted
        query = query.is_("deleted_at", "null")
        
        # Apply filters
        if min_experience is not None:
            query = query.gte("experience_years", min_experience)
        
        if skills:
            # Filter by skills (contains any of the specified skills)
            skill_list = [s.strip() for s in skills.split(",")]
            query = query.contains("skills", skill_list)
        
        if search:
            # Search in name, email, or resume text
            query = query.or_(f"candidate_name.ilike.%{search}%,candidate_email.ilike.%{search}%")
        
        # Pagination
        query = query.range(offset, offset + limit - 1)
        
        # Execute
        result = query.execute()
        
        # Format response
        candidates = []
        for row in result.data:
            candidates.append({
                "id": row["id"],
                "name": row.get("candidate_name", "Unnamed"),
                "email": row.get("candidate_email"),
                "phone": row.get("candidate_phone"),
                "skills": row.get("skills", []),
                "experience_years": row.get("experience_years"),
                "file_name": row.get("file_name"),
                "created_at": row.get("created_at"),
                "last_match_score": row.get("analyst_output", {}).get("match_score") if row.get("analyst_output") else None
            })
        
        return {
            "candidates": candidates,
            "total": len(candidates),
            "offset": offset,
            "limit": limit
        }
        
    except Exception as e:
        logger.error(f"Error listing candidates: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{candidate_id}")
@require_permission(Permission.START_SESSION)
async def get_candidate(request: Request, candidate_id: str):
    """
    Get full candidate details including resume text.
    """
    try:
        from ..database import get_supabase_client
        
        supabase = get_supabase_client()
        
        result = supabase.table("resumes").select("*").eq("id", candidate_id).is_("deleted_at", "null").execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        row = result.data[0]
        
        return {
            "id": row["id"],
            "name": row.get("candidate_name", "Unnamed"),
            "email": row.get("candidate_email"),
            "phone": row.get("candidate_phone"),
            "resume_text": row.get("parsed_data", {}).get("text", ""),
            "skills": row.get("skills", []),
            "experience_years": row.get("experience_years"),
            "file_name": row.get("file_name"),
            "created_at": row.get("created_at"),
            "analyst_output": row.get("analyst_output")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting candidate: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{candidate_id}")
@require_permission(Permission.START_SESSION)
async def update_candidate(request: Request, candidate_id: str, updates: CandidateUpdate):
    """
    Update candidate information.
    """
    try:
        from ..database import get_supabase_client
        
        supabase = get_supabase_client()
        
        # Build update dict
        update_data = {}
        if updates.name is not None:
            update_data["candidate_name"] = updates.name
        if updates.email is not None:
            update_data["candidate_email"] = updates.email
        if updates.phone is not None:
            update_data["candidate_phone"] = updates.phone
        if updates.skills is not None:
            update_data["skills"] = updates.skills
        if updates.experience_years is not None:
            update_data["experience_years"] = updates.experience_years
        if updates.resume_text is not None:
            # Update parsed_data.text
            update_data["parsed_data"] = {"text": updates.resume_text}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        result = supabase.table("resumes").update(update_data).eq("id", candidate_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        return {"message": "Candidate updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating candidate: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{candidate_id}")
@require_permission(Permission.START_SESSION)
async def delete_candidate(request: Request, candidate_id: str):
    """
    Soft delete a candidate (sets deleted_at timestamp).
    """
    try:
        from ..database import get_supabase_client
        
        supabase = get_supabase_client()
        
        result = supabase.table("resumes").update({
            "deleted_at": datetime.utcnow().isoformat()
        }).eq("id", candidate_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        return {"message": "Candidate deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting candidate: {e}")
        raise HTTPException(status_code=500, detail=str(e))
