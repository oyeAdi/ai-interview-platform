"""
Admin API Endpoints for Organization Management
Provides CRUD operations for managing B2B organizations and tenant relationships.
Protected by super_admin role check.
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional, List
from supabase_config import supabase_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])

# ============================================================================
# MODELS
# ============================================================================

class OrganizationCreate(BaseModel):
    name: str
    slug: str
    domain: Optional[str] = None
    logo_url: Optional[str] = None
    subscription_tier: str = "enterprise"

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    logo_url: Optional[str] = None
    subscription_tier: Optional[str] = None
    is_active: Optional[bool] = None

class UserTenantAssignment(BaseModel):
    user_id: str
    tenant_id: str

# ============================================================================
# MIDDLEWARE: Super Admin Check
# ============================================================================

async def verify_super_admin(request: Request):
    """Verify that the current user has super_admin role"""
    # Extract user from request (set by auth middleware)
    user_id = request.headers.get('X-User-ID')
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Check user role in profiles table
    try:
        profile = supabase_admin.table('profiles').select('role').eq('id', user_id).single().execute()
        if not profile.data or profile.data.get('role') != 'super_admin':
            raise HTTPException(status_code=403, detail="Forbidden: Super admin access required")
    except Exception as e:
        raise HTTPException(status_code=403, detail=f"Access denied: {str(e)}")

# ============================================================================
# PUBLIC ENDPOINTS (No Auth Required)
# ============================================================================

@router.get("/public/organizations")
async def list_organizations_public():
    """List all B2B organizations (public endpoint for signup)"""
    try:
        response = supabase_admin.table('tenants').select('id, name, slug').is_('parent_tenant_id', 'null').execute()
        return {"organizations": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# ORGANIZATION CRUD
# ============================================================================

@router.get("/organizations")
async def list_organizations(request: Request):
    """List all B2B organizations (top-level tenants)"""
    await verify_super_admin(request)
    
    try:
        response = supabase_admin.table('tenants').select('*').is_('parent_tenant_id', 'null').execute()
        return {"organizations": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/organizations")
async def create_organization(org: OrganizationCreate, request: Request):
    """Create a new B2B organization"""
    await verify_super_admin(request)
    
    try:
        new_org = {
            "name": org.name,
            "slug": org.slug,
            "domain": org.domain,
            "logo_url": org.logo_url,
            "subscription_tier": org.subscription_tier,
            "parent_tenant_id": None,  # Top-level org
            "settings": {"type": "b2b"}
        }
        
        response = supabase_admin.table('tenants').insert(new_org).execute()
        return {"status": "created", "organization": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/organizations/{org_id}")
async def update_organization(org_id: str, org: OrganizationUpdate, request: Request):
    """Update an existing organization"""
    await verify_super_admin(request)
    
    try:
        update_data = {k: v for k, v in org.dict().items() if v is not None}
        response = supabase_admin.table('tenants').update(update_data).eq('id', org_id).execute()
        return {"status": "updated", "organization": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/organizations/{org_id}")
async def delete_organization(org_id: str, request: Request):
    """Delete an organization (soft delete by setting is_active=false)"""
    await verify_super_admin(request)
    
    try:
        # Soft delete: set is_active to false
        response = supabase_admin.table('tenants').update({"is_active": False}).eq('id', org_id).execute()
        return {"status": "deleted", "organization_id": org_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# USER MANAGEMENT
# ============================================================================

@router.get("/users")
async def list_users(request: Request):
    """List all users with their tenant assignments"""
    await verify_super_admin(request)
    
    try:
        response = supabase_admin.table('profiles').select('id, full_name, role, tenant_id, created_at').execute()
        return {"users": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users/assign-tenant")
async def assign_user_to_tenant(assignment: UserTenantAssignment, request: Request):
    """Assign a user to a specific tenant"""
    await verify_super_admin(request)
    
    try:
        response = supabase_admin.table('profiles').update({"tenant_id": assignment.tenant_id}).eq('id', assignment.user_id).execute()
        return {"status": "assigned", "user_id": assignment.user_id, "tenant_id": assignment.tenant_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# TENANT HIERARCHY
# ============================================================================

@router.get("/tenant-hierarchy")
async def get_tenant_hierarchy(request: Request):
    """Get the complete tenant hierarchy tree"""
    await verify_super_admin(request)
    
    try:
        # Get all tenants
        all_tenants = supabase_admin.table('tenants').select('id, name, slug, parent_tenant_id').execute()
        
        # Build hierarchy tree
        tenants_by_id = {t['id']: {**t, 'children': []} for t in all_tenants.data}
        root_tenants = []
        
        for tenant in all_tenants.data:
            if tenant['parent_tenant_id']:
                parent = tenants_by_id.get(tenant['parent_tenant_id'])
                if parent:
                    parent['children'].append(tenants_by_id[tenant['id']])
            else:
                root_tenants.append(tenants_by_id[tenant['id']])
        
        return {"hierarchy": root_tenants}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
