from fastapi import APIRouter, Depends, HTTPException, Header, Request
from typing import List, Optional, Dict, Any
from app.supabase_config import supabase_admin
import logging

router = APIRouter(prefix="/super-admin", tags=["super-admin"])
logger = logging.getLogger(__name__)

async def verify_super_admin(x_user_id: str = Header(...)):
    """Middleware-like check for super_admin role"""
    print(f"DEBUG: Verifying Super Admin for User ID: {x_user_id}")
    try:
        profile = supabase_admin.table('profiles').select('is_super_admin').eq('id', x_user_id).single().execute()
        print(f"DEBUG: Profile data: {profile.data}")
        if not profile.data or not profile.data.get('is_super_admin'):
            print(f"DEBUG: Unauthorized! is_super_admin: {profile.data.get('is_super_admin') if profile.data else 'No profile'}")
            raise HTTPException(status_code=403, detail="Super Admin access required")
        return x_user_id
    except Exception as e:
        print(f"DEBUG: Exception in verify_super_admin: {e}")
        logger.error(f"Super admin verification failed: {e}")
        raise HTTPException(status_code=403, detail="Unauthorized access")

@router.get("/stats")
async def get_system_stats(user_id: str = Depends(verify_super_admin)):
    """Fetch global system statistics"""
    print(f"DEBUG: Fetching stats for user: {user_id}")
    try:
        # Get counts from various tables
        orgs = supabase_admin.table('organizations').select('id', count='exact').execute()
        users = supabase_admin.table('profiles').select('id', count='exact').execute()
        accounts = supabase_admin.table('accounts').select('id', count='exact').execute()
        sessions = supabase_admin.table('interview_sessions').select('id', count='exact').execute()
        positions = supabase_admin.table('requirements').select('id', count='exact').execute()
        
        # Determine counts robustly
        org_count = orgs.count if orgs.count is not None else len(orgs.data)
        user_count = users.count if users.count is not None else len(users.data)
        account_count = accounts.count if accounts.count is not None else len(accounts.data)
        session_count = sessions.count if sessions.count is not None else len(sessions.data)
        position_count = positions.count if positions.count is not None else len(positions.data)

        print(f"DEBUG: Counts - Orgs: {org_count}, Users: {user_count}, Accounts: {account_count}")

        return {
            "tenants": org_count,
            "users": user_count,
            "accounts": account_count,
            "sessions": session_count,
            "positions": position_count
        }
    except Exception as e:
        print(f"DEBUG: Error in get_system_stats: {e}")
        logger.error(f"Failed to fetch stats: {e}")
        return {"tenants": 0, "users": 0, "accounts": 0, "positions": 0, "sessions": 0}

@router.get("/tenants")
async def list_tenants(user_id: str = Depends(verify_super_admin)):
    """List all organizations (mapped as tenants for frontend)"""
    try:
        # Reverting to '*' for stability if org_head column is missing
        res = supabase_admin.table('organizations').select('*').order('created_at', desc=True).execute()
        return {"tenants": res.data}
    except Exception as e:
        logger.error(f"Failed to list tenants: {e}")
        return {"tenants": []}

@router.get("/users")
async def list_users(user_id: str = Depends(verify_super_admin)):
    """List all user profiles"""
    try:
        res = supabase_admin.table('profiles').select('*').order('created_at', desc=True).execute()
        return {"users": res.data}
    except Exception as e:
        logger.error(f"Failed to list users: {e}")
        return {"users": []}

@router.get("/accounts")
async def list_all_accounts(user_id: str = Depends(verify_super_admin)):
    """List all accounts with organization names"""
    try:
        # Reverting to '*' for stability if account_head column is missing
        res = supabase_admin.table('accounts').select('*, organizations(name)').order('created_at', desc=True).execute()
        
        # Flatten the data for frontend (tenants key is expected by frontend)
        flattened = []
        for item in res.data:
            org = item.get('organizations', {})
            item['tenants'] = {"name": org.get('name', 'Unknown')}
            flattened.append(item)
            
        return {"accounts": flattened}
    except Exception as e:
        logger.error(f"Failed to list accounts: {e}")
        return {"accounts": []}

@router.get("/positions")
async def list_all_positions(user_id: str = Depends(verify_super_admin)):
    """List all requirements (positions) with account and organization context"""
    try:
        res = supabase_admin.table('requirements').select('*, accounts(name), organizations(name)').order('created_at', desc=True).execute()
        return {"positions": res.data}
    except Exception as e:
        logger.error(f"Failed to list positions: {e}")
        return {"positions": []}

@router.get("/access-requests")
async def list_access_requests(user_id: str = Depends(verify_super_admin)):
    """List all admin access requests"""
    try:
        res = supabase_admin.table('admin_access_requests').select('*').order('created_at', desc=True).execute()
        return {"requests": res.data}
    except Exception as e:
        logger.error(f"Failed to list requests: {e}")
        return {"requests": []}

@router.post("/access-requests/{request_id}/approve")
async def approve_request(request_id: str, user_id: str = Depends(verify_super_admin)):
    """Approve an access request"""
    try:
        # Update request status
        res = supabase_admin.table('admin_access_requests').update({"status": "approved"}).eq('id', request_id).execute()
        return {"status": "success", "data": res.data}
    except Exception as e:
        logger.error(f"Failed to approve request: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/access-requests/{request_id}/reject")
async def reject_request(request_id: str, user_id: str = Depends(verify_super_admin)):
    """Reject an access request"""
    try:
        res = supabase_admin.table('admin_access_requests').update({"status": "rejected"}).eq('id', request_id).execute()
        return {"status": "success", "data": res.data}
    except Exception as e:
        logger.error(f"Failed to reject request: {e}")
        raise HTTPException(status_code=500, detail=str(e))
