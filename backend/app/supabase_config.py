"""
Supabase Configuration for SwarmHire
Secure configuration management for multi-tenant database
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env.supabase in root
# Walk up until we find backend folder or root
current_dir = os.path.dirname(os.path.abspath(__file__))
# app is in backend/app, so root is up 2 levels
root_dir = os.path.abspath(os.path.join(current_dir, '..', '..'))
env_path = os.path.join(root_dir, '.env.supabase')

if not os.path.exists(env_path):
    # Try one level up if structure is different
    env_path = os.path.join(current_dir, '..', '.env.supabase')
    
load_dotenv(env_path)

# Supabase Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

# Validate configuration
if not all([SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY]):
    raise ValueError("Missing Supabase configuration. Check .env.supabase file.")

# Create Supabase clients
def get_supabase_client(use_service_role: bool = False) -> Client:
    """
    Get Supabase client instance
    
    Args:
        use_service_role: If True, uses service role key (bypasses RLS)
                         If False, uses anon key (respects RLS)
    
    Returns:
        Supabase client instance
    """
    key = SUPABASE_SERVICE_ROLE_KEY if use_service_role else SUPABASE_ANON_KEY
    return create_client(SUPABASE_URL, key)

# Default client (respects RLS)
supabase: Client = get_supabase_client(use_service_role=False)

# Admin client (bypasses RLS - use carefully!)
supabase_admin: Client = get_supabase_client(use_service_role=True)

# Tenant context management
class TenantContext:
    """Manage tenant context for multi-tenancy"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
    
    def __enter__(self):
        """Set tenant context when entering context manager"""
        # This will be used to set RLS context in database
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Clear tenant context when exiting"""
        pass

# Helper functions
def set_tenant_context(client: Client, tenant_id: str):
    """
    Set tenant context for RLS policies
    
    Args:
        client: Supabase client
        tenant_id: UUID of the tenant
    """
    # Execute RPC to set tenant context
    client.rpc('set_tenant_context', {'tenant_id': tenant_id}).execute()

def get_tenant_by_slug(slug: str) -> dict:
    """
    Get tenant by slug (e.g., 'epam', 'google')
    
    Args:
        slug: Tenant slug
    
    Returns:
        Tenant data
    """
    response = supabase_admin.table('tenants').select('*').eq('slug', slug).single().execute()
    return response.data

# Export configuration
__all__ = [
    'supabase',
    'supabase_admin',
    'get_supabase_client',
    'TenantContext',
    'set_tenant_context',
    'get_tenant_by_slug',
    'SUPABASE_URL',
]
