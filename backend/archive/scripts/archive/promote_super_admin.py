"""Find and promote the correct user to super admin"""
import sys
sys.path.append('backend')

from supabase_config import supabase_admin

print("=== Finding User to Promote ===\n")

# Step 1: Get all profiles
print("1. Checking profiles table...")
profiles = supabase_admin.table('profiles').select('*').execute()
print(f"   Found {len(profiles.data)} profiles:")
for p in profiles.data:
    print(f"   - ID: {p['id']}")
    print(f"     Name: {p.get('full_name', 'N/A')}")
    print(f"     Email: {p.get('email', 'N/A')}")
    print(f"     Role: {p.get('role', 'N/A')}")
    print(f"     Is Super Admin: {p.get('is_super_admin', False)}")
    print()

# Step 2: Get auth users
print("\n2. Checking auth.users table...")
try:
    # Try to get the current authenticated user from auth
    auth_users = supabase_admin.auth.admin.list_users()
    print(f"   Found {len(auth_users)} auth users:")
    for user in auth_users:
        print(f"   - ID: {user.id}")
        print(f"     Email: {user.email}")
        print()
        
        # If this is aditya_raj@epam.com, promote their profile
        if user.email == "aditya_raj@epam.com":
            print(f"\n3. Promoting profile for {user.email}...")
            update_result = supabase_admin.table('profiles').update({
                'is_super_admin': True,
                'role': 'super_admin',
                'tenant_id': 'global',
                'email': user.email  # Also set the email
            }).eq('id', user.id).execute()
            
            if update_result.data:
                print(f"   ✓ Successfully promoted!")
                print(f"   - Email: {update_result.data[0].get('email')}")
                print(f"   - Role: {update_result.data[0].get('role')}")
                print(f"   - Is Super Admin: {update_result.data[0].get('is_super_admin')}")
            else:
                print(f"   ❌ Update failed")
except Exception as e:
    print(f"   Error accessing auth.users: {e}")
    print("\n   Falling back: Promoting first profile...")
    if profiles.data:
        first_profile = profiles.data[0]
        update_result = supabase_admin.table('profiles').update({
            'is_super_admin': True,
            'role': 'super_admin',
            'tenant_id': 'global',
            'email': 'aditya_raj@epam.com'
        }).eq('id', first_profile['id']).execute()
        
        if update_result.data:
            print(f"   ✓ Promoted profile {first_profile['id']}")
        else:
            print(f"   ❌ Failed to promote")
