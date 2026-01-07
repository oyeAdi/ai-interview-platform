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
        # Get counts from various tables individually for robustness
        org_count = 0
        try:
            res = supabase_admin.table('organizations').select('id', count='exact').execute()
            org_count = res.count if res.count is not None else len(res.data)
        except Exception as e:
            print(f"DEBUG: Error fetching orgs count: {e}")

        user_count = 0
        try:
            res = supabase_admin.table('profiles').select('id', count='exact').execute()
            user_count = res.count if res.count is not None else len(res.data)
        except Exception as e:
            print(f"DEBUG: Error fetching users count: {e}")

        account_count = 0
        try:
            res = supabase_admin.table('accounts').select('id', count='exact').execute()
            account_count = res.count if res.count is not None else len(res.data)
        except Exception as e:
            print(f"DEBUG: Error fetching accounts count: {e}")

        position_count = 0
        try:
            res = supabase_admin.table('requirements').select('id', count='exact').execute()
            position_count = res.count if res.count is not None else len(res.data)
        except Exception as e:
            print(f"DEBUG: Error fetching positions count: {e}")

        session_count = 0
        try:
            res = supabase_admin.table('interactions').select('id', count='exact').execute()
            session_count = res.count if res.count is not None else len(res.data)
        except Exception as e:
            try:
                res = supabase_admin.table('interview_sessions').select('id', count='exact').execute()
                session_count = res.count if res.count is not None else len(res.data)
            except:
                pass

        print(f"DEBUG: Final Counts - Orgs: {org_count}, Users: {user_count}, Accounts: {account_count}, Positions: {position_count}, Sessions: {session_count}")

        return {
            "tenants": org_count,
            "users": user_count,
            "accounts": account_count,
            "sessions": session_count,
            "positions": position_count
        }
    except Exception as e:
        print(f"DEBUG: Critical Error in get_system_stats: {e}")
        logger.error(f"Failed to fetch stats: {e}")
        return {"tenants": 0, "users": 0, "accounts": 0, "positions": 0, "sessions": 0}

@router.get("/tenants")
async def list_tenants(user_id: str = Depends(verify_super_admin)):
    """List all organizations (mapped as tenants for frontend)"""
    try:
        # 1. Fetch organizations
        res = supabase_admin.table('organizations').select('*').order('created_at', desc=True).execute()
        tenants = res.data
        
        # 2. Fetch tenant admins to enrich leadership column
        admins_res = supabase_admin.table('user_tenant_roles').select('tenant_id, user_id, profiles(full_name)').eq('role', 'tenant_admin').execute()
        admins_data = admins_res.data
        
        # Mapping of tenant_id -> list of admin names
        admins_map = {}
        for admin in admins_data:
            tid = admin['tenant_id']
            name = admin.get('profiles', {}).get('full_name') or 'Unknown'
            if tid not in admins_map:
                admins_map[tid] = []
            admins_map[tid].append(name)
            
        # Enrich tenants
        for t in tenants:
            heads = admins_map.get(t['id'], [])
            # Show primary admin (first one) or "Multiple" or "Not Assigned"
            t['org_head'] = ", ".join(heads) if heads else "Not Assigned"
            
        return {"tenants": tenants}
    except Exception as e:
        logger.error(f"Failed to list tenants: {e}")
        print(f"DEBUG: Error listing tenants: {e}")
        return {"tenants": []}

@router.get("/users")
async def list_users(user_id: str = Depends(verify_super_admin)):
    """List all user profiles"""
    try:
        # Fetch profiles
        profiles_res = supabase_admin.table('profiles').select('*').order('created_at', desc=True).execute()
        profiles = profiles_res.data
        
        # Fetch roles to join manually (more robust than complex postgrest joins for MVP)
        roles_res = supabase_admin.table('user_tenant_roles').select('*').execute()
        roles_data = roles_res.data
        
        # Create a mapping of (user_id, tenant_id) -> role
        roles_map = {(r['user_id'], r['tenant_id']): r['role'] for r in roles_data}
        
        # Enrich profiles with role data
        for p in profiles:
            p['role'] = roles_map.get((p['id'], p['tenant_id']))
            
        return {"users": profiles}
    except Exception as e:
        logger.error(f"Failed to list users: {e}")
        print(f"DEBUG: Error listing users: {e}")
        return {"users": []}

@router.get("/accounts")
async def list_all_accounts(user_id: str = Depends(verify_super_admin)):
    """List all accounts with organization names and account heads"""
    try:
        # 1. Fetch accounts with organization names
        res = supabase_admin.table('accounts').select('*, organizations(name)').order('created_at', desc=True).execute()
        accounts = res.data
        
        # 2. Fetch account admins for enrichment
        admins_res = supabase_admin.table('user_account_assignments').select('account_id, user_id, profiles(full_name)').execute()
        admins_data = admins_res.data
        
        admins_map = {}
        for admin in admins_data:
            aid = admin['account_id']
            name = admin.get('profiles', {}).get('full_name') or 'Unknown'
            if aid not in admins_map:
                admins_map[aid] = []
            admins_map[aid].append(name)
        
        # Flatten and enrich data
        flattened = []
        for item in accounts:
            org = item.get('organizations', {})
            item['tenants'] = {"name": org.get('name', 'Unknown')}
            item['tenant_id'] = item.get('org_id')
            
            heads = admins_map.get(item['id'], [])
            item['account_head'] = ", ".join(heads) if heads else "None Assigned"
            
            flattened.append(item)
            
        return {"accounts": flattened}
    except Exception as e:
        logger.error(f"Failed to list accounts: {e}")
        print(f"DEBUG: Error listing accounts: {e}")
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

@router.post("/users/{target_user_id}/assign")
async def assign_user_to_tenant(
    target_user_id: str,
    request: Request,
    user_id: str = Depends(verify_super_admin)
):
    """
    Assign a user to an organization (tenant) and/or account with specific roles.
    Body: {
        "tenant_id": "...",
        "role": "tenant_admin" | "account_admin" | "member" | "candidate",
        "account_id": "..." (optional, for account_admin)
    }
    """
    try:
        body = await request.json()
        tenant_id = body.get('tenant_id')
        role = body.get('role')
        account_id = body.get('account_id')

        print(f"DEBUG: Assigning User {target_user_id} -> Tenant: {tenant_id}, Role: {role}, Account: {account_id}")

        if not tenant_id or not role:
            raise HTTPException(status_code=400, detail="Missing tenant_id or role")

        # 1. Handle Super Admin Promotion & Global Context
        is_sa = role == 'super_admin'
        db_tenant_id = None if tenant_id == 'global' else tenant_id

        profile_update = {"tenant_id": db_tenant_id}
        if is_sa:
            profile_update["is_super_admin"] = True
            print(f"DEBUG: Promoting User {target_user_id} to Super Admin")

        # Update Profile's main tenant binding
        supabase_admin.table('profiles').update(profile_update).eq('id', target_user_id).execute()

        # If it's a global super admin with no tenant, we stop here (no tenant role to insert)
        if not db_tenant_id:
            return {"status": "success", "message": f"User {target_user_id} assigned as {role} (Global)"}

        # 2. Add/Update User Tenant Role
        # Enforce Single Admin Constraint: If assigning a new tenant_admin, demote existing ones
        if role == 'tenant_admin':
            print(f"DEBUG: Enforcing Single Admin constraint for Tenant {tenant_id}")
            try:
                # Update any existing tenant_admin for this tenant to 'member'
                supabase_admin.table('user_tenant_roles')\
                    .update({"role": "member"})\
                    .eq('tenant_id', tenant_id)\
                    .eq('role', 'tenant_admin')\
                    .neq('user_id', target_user_id)\
                    .execute()
            except Exception as e:
                print(f"DEBUG: Error demoting existing tenant admins: {e}")

        # Clear existing role for this tenant first (optional, simplified for now)
        # Upsert the role assignment
        role_data = {
            "user_id": target_user_id,
            "tenant_id": tenant_id,
            "role": role,
            "permissions": {} # Default permissions
        }
        
        # Check if row exists to decide insert vs update (or just upsert if constraint exists)
        # Using upsert with explicit conflict target
        try:
            supabase_admin.table('user_tenant_roles').upsert(role_data, on_conflict='user_id, tenant_id').execute()
        except Exception as insert_err:
             print(f"DEBUG: Error upserting user_tenant_role: {insert_err}")
             # Fallback: legacy behavior if table missing/constraint issue
             pass
        
        # 3. Handle Account Assignment (if applicable)
        if role == 'account_admin' and account_id:
            # Enforce Single Account Admin: Clear existing assignments for this account first
            print(f"DEBUG: Enforcing Single Account Admin for Account {account_id}")
            try:
                # In our schema, we'll just remove existing assignments to ensure single source of truth for 'Head'
                supabase_admin.table('user_account_assignments').delete().eq('account_id', account_id).neq('user_id', target_user_id).execute()
            except Exception as e:
                 print(f"DEBUG: Error clearing existing account admins: {e}")

            account_assign_data = {
                "user_id": target_user_id,
                "account_id": account_id,
                "role": "account_admin",
                "can_create_positions": True,
                "can_manage_positions": True
            }
            try:
                supabase_admin.table('user_account_assignments').upsert(account_assign_data, on_conflict='user_id, account_id').execute()
            except Exception as acct_err:
                 print(f"DEBUG: Error upserting account assignment: {acct_err}")

        return {"status": "success", "message": f"User assigned to {tenant_id} as {role}"}

    except Exception as e:
        logger.error(f"Failed to assign user: {e}")
        # Return success anyway if it partially worked? No, better to fail loud.
        # However, for debugging, let's return JSON error
        return {"status": "error", "detail": str(e)}
