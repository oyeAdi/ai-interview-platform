from fastapi import APIRouter, HTTPException, Request, Body
from typing import List, Optional
from pydantic import BaseModel
from middleware.rbac import require_permission, Permission, log_admin_action
from supabase_config import supabase_admin
from datetime import datetime

router = APIRouter(prefix="/api/tenant-admin", tags=["Tenant Admin"])

# ============================================================================
# MODELS
# ============================================================================

class AccountCreate(BaseModel):
    name: str
    industry: Optional[str] = None
    description: Optional[str] = None

class UserInvite(BaseModel):
    email: str
    full_name: str
    role: str # account_admin, candidate, HITL_expert
    account_ids: Optional[List[str]] = [] # For account_admin or candidates

# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/stats")
@require_permission(Permission.VIEW_SESSION) # Base tenant admin access
async def get_tenant_stats(request: Request, current_user: dict = Body(...)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="User not associated with a tenant")
    
    try:
        # Get accounts count
        accounts = supabase_admin.table('accounts').select('id', count='exact').eq('tenant_id', tenant_id).execute()
        
        # Get positions count (via accounts)
        # This is slightly more complex in a single query but let's do it simply
        account_ids = [a['id'] for a in (accounts.data or [])]
        positions_count = 0
        if account_ids:
            positions = supabase_admin.table('positions').select('id', count='exact').in_('account_id', account_ids).execute()
            positions_count = positions.count or 0
            
        # Get users count
        users = supabase_admin.table('profiles').select('id', count='exact').eq('tenant_id', tenant_id).execute()
        
        # Get active sessions count
        # Simplified: all sessions for accounts under this tenant
        sessions_count = 0
        if account_ids:
            # First find positions
            pos_res = supabase_admin.table('positions').select('id').in_('account_id', account_ids).execute()
            pos_ids = [p['id'] for p in (pos_res.data or [])]
            if pos_ids:
                sessions = supabase_admin.table('interview_sessions').select('id', count='exact').in_('position_id', pos_ids).execute()
                sessions_count = sessions.count or 0

        return {
            "accounts": accounts.count or 0,
            "positions": positions_count,
            "users": users.count or 0,
            "sessions": sessions_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/accounts")
@require_permission(Permission.MANAGE_ACCOUNT)
async def get_accounts(request: Request, current_user: dict = Body(...)):
    tenant_id = current_user.get('tenant_id')
    try:
        res = supabase_admin.table('accounts').select('*').eq('tenant_id', tenant_id).execute()
        return {"accounts": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/accounts")
@require_permission(Permission.CREATE_ACCOUNT)
async def create_account(request: Request, account: AccountCreate, current_user: dict = Body(...)):
    tenant_id = current_user.get('tenant_id')
    try:
        new_account = {
            **account.dict(),
            "tenant_id": tenant_id
        }
        res = supabase_admin.table('accounts').insert(new_account).execute()
        
        if res.data:
            await log_admin_action(
                user_id=current_user['id'],
                action="create_account",
                resource_type="account",
                resource_id=res.data[0]['id'],
                details={"name": account.name}
            )
            return res.data[0]
        raise HTTPException(status_code=400, detail="Failed to create account")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users")
@require_permission(Permission.MANAGE_USER)
async def get_tenant_users(request: Request, current_user: dict = Body(...)):
    tenant_id = current_user.get('tenant_id')
    try:
        res = supabase_admin.table('profiles').select('*').eq('tenant_id', tenant_id).execute()
        return {"users": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/invitations")
@require_permission(Permission.CREATE_USER)
async def create_user_invitation(request: Request, invite: UserInvite, current_user: dict = Body(...)):
    tenant_id = current_user.get('tenant_id')
    try:
        # Check if user already exists in profiles
        existing = supabase_admin.table('profiles').select('id').eq('email', invite.email).execute()
        
        if existing.data:
            # Update existing user's tenant and role if needed?
            # For now, let's just assign them
            user_id = existing.data[0]['id']
            update_data = {
                "tenant_id": tenant_id,
                "role": invite.role,
                "managed_accounts": invite.account_ids if invite.role == 'account_admin' else []
            }
            res = supabase_admin.table('profiles').update(update_data).eq('id', user_id).execute()
        else:
            # Create a shell profile (in a real app, this would use Supabase Auth Invitation)
            # Since we can't easily trigger Supabase Auth Invites from here without more setup,
            # we'll create a profile that they can 'claim' later or just use for logic.
            # IMPORTANT: Real production uses supabase.auth.admin.invite_user_by_email()
            
            new_profile = {
                "email": invite.email,
                "full_name": invite.full_name,
                "role": invite.role,
                "tenant_id": tenant_id,
                "managed_accounts": invite.account_ids if invite.role == 'account_admin' else []
            }
            res = supabase_admin.table('profiles').insert(new_profile).execute()
            user_id = res.data[0]['id'] if res.data else None

        if res.data:
            await log_admin_action(
                user_id=current_user['id'],
                action="invite_user",
                resource_type="user",
                resource_id=user_id,
                details={"email": invite.email, "role": invite.role}
            )
            return {"status": "success", "user": res.data[0]}
            
        raise HTTPException(status_code=400, detail="Failed to Process invitation")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
