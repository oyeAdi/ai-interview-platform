import sys
sys.path.insert(0, '.')
from supabase_config import supabase_admin

email = "shreya_raj@epam.com"
full_name = "Shreya Raj"

print(f"Looking for existing auth user for {email}...")

try:
    # Get the user from auth
    users = supabase_admin.auth.admin.list_users()
    user = next((u for u in users if u.email == email), None)
    
    if user:
        user_id = user.id
        print(f"✅ Found existing auth user: {user_id}")
        
        # Check if profile exists
        profile_check = supabase_admin.table('profiles').select('*').eq('id', user_id).execute()
        
        if profile_check.data:
            print(f"Profile exists, updating...")
            # Update existing profile
            supabase_admin.table('profiles').update({
                "role": "super_admin",
                "is_super_admin": True,
                "tenant_id": None,
                "preferred_vision": None,
                "is_onboarded": True
            }).eq('id', user_id).execute()
            print(f"✅ Updated profile to super_admin")
        else:
            print(f"No profile found, creating...")
            # Create profile
            supabase_admin.table('profiles').insert({
                "id": user_id,
                "email": email,
                "full_name": full_name,
                "role": "super_admin",
                "is_super_admin": True,
                "tenant_id": None,
                "preferred_vision": None,
                "is_onboarded": True
            }).execute()
            print(f"✅ Created super_admin profile")
        
        # Reset password to default
        supabase_admin.auth.admin.update_user_by_id(
            user_id,
            {"password": "Test@1234"}
        )
        print(f"✅ Reset password to Test@1234")
        
        print(f"\n{'='*60}")
        print(f"Super Admin Account Ready!")
        print(f"Email: {email}")
        print(f"Password: Test@1234")
        print(f"{'='*60}\n")
    else:
        print(f"❌ No auth user found for {email}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
