import sys
sys.path.insert(0, '.')
from supabase_config import supabase_admin

# Check for shreya_raj
print("Searching for shreya_raj...")
result = supabase_admin.table('profiles').select('*').ilike('email', '%shreya%').execute()

if result.data:
    print(f"\nFound {len(result.data)} profile(s):")
    for profile in result.data:
        print(f"\nEmail: {profile['email']}")
        print(f"Role: {profile.get('role')}")
        print(f"is_super_admin: {profile.get('is_super_admin')}")
        print(f"preferred_vision: {profile.get('preferred_vision')}")
        print(f"tenant_id: {profile.get('tenant_id')}")
        
        # Fix if needed
        if profile.get('role') == 'super_admin' or profile.get('is_super_admin'):
            if profile.get('preferred_vision') is not None:
                print(f"\n🔧 Fixing {profile['email']}...")
                supabase_admin.table('profiles').update({
                    'preferred_vision': None,
                    'tenant_id': None
                }).eq('id', profile['id']).execute()
                print("✅ Fixed!")
else:
    print("No profiles found matching 'shreya'")
