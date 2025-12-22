"""
Fix Super Admin Preferred Vision
This script ensures all super_admin users have preferred_vision set to NULL
so they can log in from any vision tab.
"""

from supabase_config import supabase_admin

def fix_super_admin_vision():
    """Set preferred_vision to NULL for all super_admin users"""
    try:
        # Update all users with role='super_admin' or is_super_admin=true
        result = supabase_admin.table('profiles').update({
            'preferred_vision': None,
            'tenant_id': None
        }).or_('role.eq.super_admin,is_super_admin.eq.true').execute()
        
        print(f"✅ Updated {len(result.data)} super_admin profiles")
        print("\nUpdated users:")
        for user in result.data:
            print(f"  - {user['email']} (role: {user['role']})")
        
        return result.data
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

if __name__ == "__main__":
    print("Fixing super_admin preferred_vision...\n")
    fix_super_admin_vision()
