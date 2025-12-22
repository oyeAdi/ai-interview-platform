from fastapi import APIRouter, HTTPException, Request, Body
from typing import List, Optional
from pydantic import BaseModel
from middleware.rbac import require_permission, Permission, log_admin_action
from supabase_config import supabase_admin
from datetime import datetime

router = APIRouter(prefix="/api/account-admin", tags=["Account Admin"])

# ============================================================================
# MODELS
# ============================================================================

class PositionCreate(BaseModel):
    account_id: str
    title: str
    description: Optional[str] = None
    role_template_id: Optional[str] = None

class CandidateInvite(BaseModel):
    email: str
    full_name: str
    position_id: str

# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/stats")
@require_permission(Permission.VIEW_SESSION)
async def get_account_stats(request: Request, current_user: dict = Body(...)):
    managed_accounts = current_user.get('managed_accounts', [])
    if not managed_accounts:
        return {"positions": 0, "sessions": 0, "candidates": 0}
    
    try:
        # Positions count
        positions = supabase_admin.table('positions').select('id', count='exact').in_('account_id', managed_accounts).execute()
        
        # Sessions count
        pos_ids = [p['id'] for p in (supabase_admin.table('positions').select('id').in_('account_id', managed_accounts).execute().data or [])]
        sessions_count = 0
        if pos_ids:
            sessions = supabase_admin.table('interview_sessions').select('id', count='exact').in_('position_id', pos_ids).execute()
            sessions_count = sessions.count or 0
            
        # Candidates count (unique emails in profiles assigned to these accounts/positions)
        # For now, simplified: users with 'candidate' role where managed_accounts contains one of ours
        # Actually, candidates are often tied to positions via user_account_assignments or similar
        # Let's just count profiles with role='candidate' in the same tenant for now, 
        # but filter by managed_accounts if that logic exists.
        
        return {
            "positions": positions.count or 0,
            "sessions": sessions_count,
            "candidates": 0 # Placeholder for more complex candidate tracking
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/positions")
@require_permission(Permission.MANAGE_POSITION)
async def get_positions(request: Request, current_user: dict = Body(...)):
    managed_accounts = current_user.get('managed_accounts', [])
    if not managed_accounts:
        return {"positions": []}
        
    try:
        res = supabase_admin.table('positions').select('*, accounts(name)').in_('account_id', managed_accounts).execute()
        return {"positions": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/positions")
@require_permission(Permission.CREATE_POSITION)
async def create_position(request: Request, pos: PositionCreate, current_user: dict = Body(...)):
    managed_accounts = current_user.get('managed_accounts', [])
    if pos.account_id not in managed_accounts:
        raise HTTPException(status_code=403, detail="Forbidden: You do not manage this account")
        
    try:
        new_pos = pos.dict()
        res = supabase_admin.table('positions').insert(new_pos).execute()
        
        if res.data:
            await log_admin_action(
                user_id=current_user['id'],
                action="create_position",
                resource_type="position",
                resource_id=res.data[0]['id'],
                details={"title": pos.title}
            )
            return res.data[0]
        raise HTTPException(status_code=400, detail="Failed to create position")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/invitations")
@require_permission(Permission.MANAGE_USER) # account_admin often needs to invite candidates
async def invite_candidate(request: Request, invite: CandidateInvite, current_user: dict = Body(...)):
    # Verify account_admin manages the account for this position
    try:
        pos = supabase_admin.table('positions').select('account_id').eq('id', invite.position_id).single().execute()
        if not pos.data or pos.data['account_id'] not in current_user.get('managed_accounts', []):
            raise HTTPException(status_code=403, detail="Forbidden: Access denied to this position")
            
        # Simplified: create candidate profile
        new_profile = {
            "email": invite.email,
            "full_name": invite.full_name,
            "role": "candidate",
            "tenant_id": current_user['tenant_id'],
            "managed_accounts": [pos.data['account_id']] # Assign them to this account's scope
        }
        res = supabase_admin.table('profiles').upsert(new_profile, on_conflict='email').execute()
        
        if res.data:
            return {"status": "success", "user": res.data[0]}
        raise HTTPException(status_code=400, detail="Failed to invite candidate")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
