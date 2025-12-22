"""
RBAC Middleware for SwarmHire
Implements Role-Based Access Control with 5 roles:
- super_admin: System-wide control
- tenant_admin: Tenant-scoped control
- account_admin: Account-scoped control
- HITL_expert: Session-scoped control
- candidate: Interview participant
"""

from functools import wraps
from fastapi import HTTPException, Request
from typing import Optional, List
from supabase_config import supabase_admin

# ============================================================================
# PERMISSION CONSTANTS
# ============================================================================

class Permission:
    # Tenant Management
    CREATE_TENANT = "create_tenant"
    MANAGE_TENANT = "manage_tenant"
    DELETE_TENANT = "delete_tenant"
    
    # Account Management
    CREATE_ACCOUNT = "create_account"
    MANAGE_ACCOUNT = "manage_account"
    DELETE_ACCOUNT = "delete_account"
    
    # Position Management
    CREATE_POSITION = "create_position"
    MANAGE_POSITION = "manage_position"
    DELETE_POSITION = "delete_position"
    
    # User Management
    CREATE_USER = "create_user"
    MANAGE_USER = "manage_user"
    ASSIGN_ROLE = "assign_role"
    
    # Session Management
    START_SESSION = "start_session"
    VIEW_SESSION = "view_session"
    HITL_APPROVAL = "hitl_approval"
    
    # System Access
    ACCESS_WIKI = "access_wiki"
    ACCESS_PULSE = "access_pulse"
    ACCESS_GLOBAL_DASHBOARD = "access_global_dashboard"

# ============================================================================
# ROLE DEFINITIONS
# ============================================================================

ROLE_PERMISSIONS = {
    "super_admin": [
        # Super admin has ALL permissions
        Permission.CREATE_TENANT,
        Permission.MANAGE_TENANT,
        Permission.DELETE_TENANT,
        Permission.CREATE_ACCOUNT,
        Permission.MANAGE_ACCOUNT,
        Permission.DELETE_ACCOUNT,
        Permission.CREATE_POSITION,
        Permission.MANAGE_POSITION,
        Permission.DELETE_POSITION,
        Permission.CREATE_USER,
        Permission.MANAGE_USER,
        Permission.ASSIGN_ROLE,
        Permission.START_SESSION,
        Permission.VIEW_SESSION,
        Permission.ACCESS_WIKI,
        Permission.ACCESS_PULSE,
        Permission.ACCESS_GLOBAL_DASHBOARD,
    ],
    "tenant_admin": [
        Permission.CREATE_ACCOUNT,
        Permission.MANAGE_ACCOUNT,
        Permission.DELETE_ACCOUNT,
        Permission.CREATE_POSITION,
        Permission.MANAGE_POSITION,
        Permission.DELETE_POSITION,
        Permission.CREATE_USER,
        Permission.MANAGE_USER,
        Permission.START_SESSION,
        Permission.VIEW_SESSION,
        Permission.ACCESS_PULSE,
    ],
    "account_admin": [
        Permission.CREATE_POSITION,
        Permission.MANAGE_POSITION,
        Permission.START_SESSION,
        Permission.VIEW_SESSION,
        Permission.ACCESS_PULSE,
    ],
    "HITL_expert": [
        Permission.START_SESSION,
        Permission.VIEW_SESSION,
        Permission.HITL_APPROVAL,
        Permission.ACCESS_PULSE,
    ],
    "candidate": [
        Permission.VIEW_SESSION,  # Own sessions only
    ]
}

# ============================================================================
# USER CONTEXT
# ============================================================================

async def get_current_user(request: Request) -> Optional[dict]:
    """Extract current user from request headers"""
    user_id = request.headers.get('X-User-ID')
    
    if not user_id:
        return None
    
    try:
        # Get user profile with role and tenant info
        profile = supabase_admin.table('profiles').select(
            'id, email, full_name, role, tenant_id, is_super_admin, permissions, managed_accounts'
        ).eq('id', user_id).single().execute()
        
        return profile.data if profile.data else None
    except Exception as e:
        print(f"Error fetching user: {e}")
        return None

# ============================================================================
# PERMISSION CHECKS
# ============================================================================

async def check_permission(
    user: dict, 
    permission: str, 
    resource_id: Optional[str] = None,
    resource_type: Optional[str] = None
) -> bool:
    """
    Check if user has permission for a specific action
    
    Args:
        user: User object from get_current_user
        permission: Permission constant from Permission class
        resource_id: Optional resource ID for scoped checks
        resource_type: Optional resource type ('tenant', 'account', 'session')
    """
    # Super admin has all permissions
    if user.get('is_super_admin'):
        return True
    
    # Check role-based permissions
    user_role = user.get('role', 'candidate')
    role_perms = ROLE_PERMISSIONS.get(user_role, [])
    
    if permission not in role_perms:
        return False
    
    # Resource-scoped checks
    if resource_id and resource_type:
        return await check_resource_access(user, resource_type, resource_id)
    
    return True

async def check_resource_access(user: dict, resource_type: str, resource_id: str) -> bool:
    """Check if user has access to a specific resource"""
    user_role = user.get('role')
    user_id = user.get('id')
    tenant_id = user.get('tenant_id')
    
    try:
        if resource_type == 'tenant':
            # tenant_admin can access their own tenant
            if user_role == 'tenant_admin':
                return tenant_id == resource_id
            return False
        
        elif resource_type == 'account':
            # account_admin can access assigned accounts
            if user_role == 'account_admin':
                managed_accounts = user.get('managed_accounts', [])
                return resource_id in managed_accounts
            
            # tenant_admin can access accounts in their tenant
            if user_role == 'tenant_admin':
                account = supabase_admin.table('accounts').select('tenant_id').eq('id', resource_id).single().execute()
                return account.data and account.data.get('tenant_id') == tenant_id
            
            return False
        
        elif resource_type == 'session':
            # HITL_expert can access assigned sessions
            # tenant_admin can access sessions in their tenant
            # account_admin can access sessions for their accounts
            # candidate can access their own sessions
            session = supabase_admin.table('interview_sessions').select('*').eq('id', resource_id).single().execute()
            if not session.data:
                return False
            
            if user_role == 'candidate':
                return session.data.get('candidate_id') == user_id
            
            if user_role == 'HITL_expert':
                return session.data.get('expert_id') == user_id
            
            if user_role == 'account_admin':
                position = supabase_admin.table('positions').select('account_id').eq('id', session.data.get('position_id')).single().execute()
                if position.data:
                    managed_accounts = user.get('managed_accounts', [])
                    return position.data.get('account_id') in managed_accounts
            
            if user_role == 'tenant_admin':
                # Check if session's account belongs to user's tenant
                position = supabase_admin.table('positions').select('account_id').eq('id', session.data.get('position_id')).single().execute()
                if position.data:
                    account = supabase_admin.table('accounts').select('tenant_id').eq('id', position.data.get('account_id')).single().execute()
                    return account.data and account.data.get('tenant_id') == tenant_id
            
            return False
    
    except Exception as e:
        print(f"Error checking resource access: {e}")
        return False
    
    return False

# ============================================================================
# DECORATORS
# ============================================================================

def require_permission(permission: str, resource_type: Optional[str] = None):
    """
    Decorator to enforce permission checks on API endpoints
    
    Usage:
        @require_permission(Permission.CREATE_TENANT)
        async def create_tenant(request: Request):
            ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract request from args/kwargs
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            if not request and 'request' in kwargs:
                request = kwargs['request']
            
            if not request:
                raise HTTPException(status_code=500, detail="Request object not found")
            
            # Get current user
            user = await get_current_user(request)
            if not user:
                raise HTTPException(status_code=401, detail="Unauthorized")
            
            # Extract resource_id from path params if needed
            resource_id = kwargs.get(f'{resource_type}_id') if resource_type else None
            
            # Check permission
            has_permission = await check_permission(user, permission, resource_id, resource_type)
            if not has_permission:
                raise HTTPException(
                    status_code=403, 
                    detail=f"Forbidden: Missing permission '{permission}'"
                )
            
            # Add user to kwargs for endpoint use
            kwargs['current_user'] = user
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

def require_super_admin():
    """Decorator to enforce super_admin role"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            if not request and 'request' in kwargs:
                request = kwargs['request']
            
            if not request:
                raise HTTPException(status_code=500, detail="Request object not found")
            
            user = await get_current_user(request)
            if not user:
                raise HTTPException(status_code=401, detail="Unauthorized")
            
            if not user.get('is_super_admin'):
                raise HTTPException(
                    status_code=403, 
                    detail="Forbidden: super_admin role required"
                )
            
            kwargs['current_user'] = user
            return await func(*args, **kwargs)
        return wrapper
    return decorator

# ============================================================================
# AUDIT LOGGING
# ============================================================================

async def log_admin_action(
    user_id: str,
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    details: Optional[dict] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """Log administrative actions for audit trail"""
    try:
        log_entry = {
            "user_id": user_id,
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "details": details or {},
            "ip_address": ip_address,
            "user_agent": user_agent
        }
        
        supabase_admin.table('admin_audit_log').insert(log_entry).execute()
    except Exception as e:
        print(f"Error logging admin action: {e}")
