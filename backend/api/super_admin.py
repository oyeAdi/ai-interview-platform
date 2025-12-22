"""
Super Admin API Endpoints
Provides tenant management, user management, and system administration.
Protected by super_admin role check using RBAC middleware.
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, List
from supabase_config import supabase_admin
import sys
sys.path.append('..')
from middleware.rbac import require_super_admin, Permission, require_permission, log_admin_action

router = APIRouter(prefix="/api/super-admin", tags=["super-admin"])

# ============================================================================
# MODELS
# ============================================================================

class TenantCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    domain: Optional[str] = None
    logo_url: Optional[str] = None
    subscription_tier: str = "enterprise"

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    domain: Optional[str] = None
    logo_url: Optional[str] = None
    subscription_tier: Optional[str] = None
    is_active: Optional[bool] = None

class AdminRequestAction(BaseModel):
    action: str  # 'approve' or 'reject'
    description: Optional[str] = None
    domain: Optional[str] = None
    logo_url: Optional[str] = None
    subscription_tier: Optional[str] = None
    is_active: Optional[bool] = None

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: str
    tenant_id: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    tenant_id: Optional[str] = None
    is_active: Optional[bool] = None

class AccountAssignment(BaseModel):
    user_id: str
    account_ids: List[str]

class AccountCreate(BaseModel):
    name: str
    tenant_id: str
    description: Optional[str] = None

# ============================================================================
# TENANT MANAGEMENT
# ============================================================================

@router.get("/tenants")
@require_super_admin()
async def list_tenants(request: Request, current_user: dict = None):
    """List all tenants (super_admin only)"""
    try:
        response = supabase_admin.table('tenants').select('*').order('created_at', desc=True).execute()
        return {"tenants": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tenants")
@require_super_admin()
async def create_tenant(tenant: TenantCreate, request: Request, current_user: dict = None):
    """Create a new tenant (super_admin only)"""
    try:
        new_tenant = {
            "name": tenant.name,
            "slug": tenant.slug,
            "description": tenant.description,
            "domain": tenant.domain,
            "logo_url": tenant.logo_url,
            "subscription_tier": tenant.subscription_tier,
            "settings": {"type": "b2b"},
            "created_by": current_user['id']
        }
        
        response = supabase_admin.table('tenants').insert(new_tenant).execute()
        
        # Log action
        await log_admin_action(
            user_id=current_user['id'],
            action="CREATE_TENANT",
            resource_type="tenant",
            resource_id=response.data[0]['id'],
            details={"tenant_name": tenant.name},
            ip_address=request.client.host if request.client else None
        )
        
        return {"status": "created", "tenant": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/tenants/{tenant_id}")
@require_super_admin()
async def update_tenant(tenant_id: str, tenant: TenantUpdate, request: Request, current_user: dict = None):
    """Update a tenant (super_admin only)"""
    try:
        update_data = {k: v for k, v in tenant.dict().items() if v is not None}
        response = supabase_admin.table('tenants').update(update_data).eq('id', tenant_id).execute()
        
        await log_admin_action(
            user_id=current_user['id'],
            action="UPDATE_TENANT",
            resource_type="tenant",
            resource_id=tenant_id,
            details=update_data
        )
        
        return {"status": "updated", "tenant": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/tenants/{tenant_id}")
@require_super_admin()
async def delete_tenant(tenant_id: str, request: Request, current_user: dict = None):
    """Soft delete a tenant (super_admin only)"""
    try:
        response = supabase_admin.table('tenants').update({"is_active": False}).eq('id', tenant_id).execute()
        
        await log_admin_action(
            user_id=current_user['id'],
            action="DELETE_TENANT",
            resource_type="tenant",
            resource_id=tenant_id
        )
        
        return {"status": "deleted", "tenant_id": tenant_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# USER MANAGEMENT
# ============================================================================

@router.get("/users")
@require_super_admin()
async def list_users(request: Request, current_user: dict = None):
    """List all users (super_admin only)"""
    try:
        response = supabase_admin.table('profiles').select(
            'id, email, full_name, role, tenant_id, is_super_admin, created_at'
        ).order('created_at', desc=True).execute()
        return {"users": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users")
@require_super_admin()
async def create_user(user: UserCreate, request: Request, current_user: dict = None):
    """Create a new user across any persona (super_admin only)"""
    try:
        # 1. Create in Supabase Auth
        auth_res = supabase_admin.auth.admin.create_user({
            "email": user.email,
            "password": user.password,
            "user_metadata": {"full_name": user.full_name},
            "email_confirm": True
        })
        
        new_user_id = auth_res.user.id
        
        # 2. Create in Profiles
        profile_data = {
            "id": new_user_id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "tenant_id": user.tenant_id,
            "is_onboarded": True
        }
        
        supabase_admin.table('profiles').insert(profile_data).execute()
        
        await log_admin_action(
            user_id=current_user['id'],
            action="CREATE_USER",
            resource_type="user",
            resource_id=new_user_id,
            details={"email": user.email, "role": user.role}
        )
        
        return {"status": "created", "user_id": new_user_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/users/{user_id}")
@require_super_admin()
async def update_user(user_id: str, user_update: UserUpdate, request: Request, current_user: dict = None):
    """Update any user profile (super_admin only)"""
    try:
        update_data = {k: v for k, v in user_update.dict().items() if v is not None}
        response = supabase_admin.table('profiles').update(update_data).eq('id', user_id).execute()
        
        await log_admin_action(
            user_id=current_user['id'],
            action="UPDATE_USER",
            resource_type="user",
            resource_id=user_id,
            details=update_data
        )
        
        return {"status": "updated", "user": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/users/{user_id}")
@require_super_admin()
async def delete_user(user_id: str, request: Request, current_user: dict = None):
    """Delete a user (super_admin only)"""
    try:
        # Delete from Supabase Auth
        supabase_admin.auth.admin.delete_user(user_id)
        
        # Profile deletion will happen via cascade or handled here
        supabase_admin.table('profiles').delete().eq('id', user_id).execute()
        
        await log_admin_action(
            user_id=current_user['id'],
            action="DELETE_USER",
            resource_type="user",
            resource_id=user_id
        )
        
        return {"status": "deleted", "user_id": user_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users/{user_id}/assign-accounts")
@require_super_admin()
async def assign_accounts_to_user(user_id: str, assignment: AccountAssignment, request: Request, current_user: dict = None):
    """Assign accounts to an account_admin user (super_admin only)"""
    try:
        # Update managed_accounts array
        response = supabase_admin.table('profiles').update({
            "managed_accounts": assignment.account_ids
        }).eq('id', user_id).execute()
        
        # Create user_account_assignments records
        for account_id in assignment.account_ids:
            supabase_admin.table('user_account_assignments').upsert({
                "user_id": user_id,
                "account_id": account_id,
                "role": "account_admin"
            }).execute()
        
        await log_admin_action(
            user_id=current_user['id'],
            action="ASSIGN_ACCOUNTS",
            resource_type="user",
            resource_id=user_id,
            details={"account_ids": assignment.account_ids}
        )
        
        return {"status": "assigned", "user_id": user_id, "account_ids": assignment.account_ids}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# ACCOUNT MANAGEMENT (Cross-Tenant)
# ============================================================================

@router.get("/accounts")
@require_super_admin()
async def list_all_accounts(request: Request, current_user: dict = None):
    """List all accounts across all tenants (super_admin only)"""
    try:
        response = supabase_admin.table('accounts').select('*, tenants(name)').execute()
        return {"accounts": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# AUDIT LOG
# ============================================================================

@router.get("/audit-log")
@require_super_admin()
async def get_audit_log(request: Request, limit: int = 100, current_user: dict = None):
    """Get admin audit log (super_admin only)"""
    try:
        response = supabase_admin.table('admin_audit_log').select(
            '*, profiles(email, full_name)'
        ).order('created_at', desc=True).limit(limit).execute()
        return {"logs": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# SYSTEM STATS
# ============================================================================

@router.get("/stats")
@require_super_admin()
async def get_system_stats(request: Request, current_user: dict = None):
    """Get system-wide statistics (super_admin only)"""
    try:
        # Count tenants
        tenants_count = supabase_admin.table('tenants').select('id', count='exact').execute()
        
        # Count users by role
        users_count = supabase_admin.table('profiles').select('role', count='exact').execute()
        
        # Count accounts
        accounts_count = supabase_admin.table('accounts').select('id', count='exact').execute()
        
        # Count positions
        positions_count = supabase_admin.table('positions').select('id', count='exact').execute()
        
        # Sessions count - using interviews table instead
        try:
            sessions_count = supabase_admin.table('interviews').select('id', count='exact').execute()
            sessions = sessions_count.count or 0
        except:
            sessions = 0
        
        return {
            "tenants": tenants_count.count or 0,
            "users": users_count.count or 0,
            "accounts": accounts_count.count or 0,
            "positions": positions_count.count or 0,
            "sessions": sessions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# ACCESS REQUESTS MANAGEMENT
# ============================================================================

@router.get("/access-requests")
@require_super_admin()
async def list_access_requests(request: Request, current_user: dict = None):
    """List all admin access requests"""
    try:
        response = supabase_admin.table('admin_access_requests').select('*').order('created_at', desc=True).execute()
        return {"requests": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/access-requests/{request_id}/approve")
@require_super_admin()
async def approve_access_request(request_id: str, request: Request, current_user: dict = None):
    """Approve an admin access request"""
    print(f"\n>>> DEBUG: HIT APPROVE ENDPOINT for {request_id} <<<\n")
    try:
        # Get request details
        req_res = supabase_admin.table('admin_access_requests').select('*').eq('id', request_id).single().execute()
        if not req_res.data:
            raise HTTPException(status_code=404, detail="Request not found")
        
        req_data = req_res.data
        
        # 1. Update request status
        supabase_admin.table('admin_access_requests').update({"status": "approved"}).eq('id', request_id).execute()
        
        # 2. Check if user already exists in profiles
        user_res = supabase_admin.table('profiles').select('id').eq('email', req_data['email']).execute()
        
        if user_res.data:
            # Case A: User already has a profile (maybe they were a regular user)
            # Promote them to super_admin
            user_id = user_res.data[0]['id']
            supabase_admin.table('profiles').update({
                "role": "super_admin",
                "is_super_admin": True,
                "tenant_id": None,
                "preferred_vision": None  # Clear vision restriction for super_admin
            }).eq('id', user_id).execute()
            status = "profile_promoted"
        else:
            # Case B: New user entirely
            # Create the user with auto-confirmation and default password
            try:
                # Create user via Supabase Auth Admin with default password
                auth_res = supabase_admin.auth.admin.create_user({
                    "email": req_data['email'],
                    "password": "Test@1234",  # Default password
                    "email_confirm": True,  # Auto-confirm the email
                    "user_metadata": {
                        "full_name": req_data['full_name'],
                        "role": "super_admin",
                        "is_super_admin": True
                    }
                })
                
                new_user_id = auth_res.user.id
                
                # Create profile manually
                supabase_admin.table('profiles').insert({
                    "id": new_user_id,
                    "email": req_data['email'],
                    "full_name": req_data['full_name'],
                    "role": "super_admin",
                    "is_super_admin": True,
                    "tenant_id": None,
                    "preferred_vision": None,  # Super admins have no vision restriction
                    "is_onboarded": True
                }).execute()
                
                # Print credentials to console for admin reference
                print(f"\n" + "="*80)
                print(f" ✅ Super Admin Account Created")
                print(f" Email: {req_data['email']}")
                print(f" Default Password: Test@1234")
                print(f" User can now sign in with these credentials.")
                print(f"="*80 + "\n")
                
                status = "user_created_with_default_password"
                invitation_sent = True
            except Exception as auth_e:
                print(f"User creation failed: {auth_e}")
                status = "approved_manual_onboarding_required"
                invitation_sent = False

        await log_admin_action(
            user_id=current_user['id'],
            action="approve_admin_request",
            resource_type="access_request",
            resource_id=request_id,
            details={
                "email": req_data['email'], 
                "status": status,
                "invitation_sent": invitation_sent
            }
        )
        
        return {
            "status": "approved", 
            "email": req_data['email'], 
            "detail": "Request approved. " + ("Invitation email sent." if invitation_sent else "Existing profile promoted.")
        }
    except Exception as e:
        print(f"Error approving request: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/access-requests/{request_id}/reject")
@require_super_admin()
async def reject_access_request(request_id: str, request: Request, current_user: dict = None):
    """Reject an admin access request"""
    try:
        supabase_admin.table('admin_access_requests').update({"status": "rejected"}).eq('id', request_id).execute()
        
        await log_admin_action(
            user_id=current_user['id'],
            action="reject_admin_request",
            resource_type="access_request",
            resource_id=request_id
        )
        
        return {"status": "rejected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

