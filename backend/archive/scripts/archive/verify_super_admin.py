import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))
from supabase_config import supabase_admin

# Read migration file
migration_path = os.path.join(os.getcwd(), 'migrations', '009_rbac_permissions.sql')
with open(migration_path, 'r') as f:
    sql = f.read()

def verify_and_update():
    email = "aditya_raj@epam.com"
    print(f"Checking for user: {email}")
    
    # Check profiles
    try:
        # Note: email column might be missing, so we check username or full_name too
        res = supabase_admin.table('profiles').select('*').limit(10).execute()
        profiles = res.data
        
        target_user = None
        for p in profiles:
            if p.get('email') == email or p.get('full_name') == "Aditya Raj" or "aditya" in p.get('username', '').lower():
                target_user = p
                break
        
        if target_user:
            user_id = target_user['id']
            print(f"Found user {user_id}. Attempting to update to super_admin...")
            
            # Since raw DDL is hard via SDK, we'll suggest the user runs the migration in Supabase UI
            # but try to update role anyway if column exists
            try:
                supabase_admin.table('profiles').update({
                    "is_super_admin": True,
                    "role": "super_admin",
                    "tenant_id": "global"
                }).eq('id', user_id).execute()
                print("Successfully updated user to super_admin!")
            except Exception as e:
                print(f"Could not update (schema might be outdated): {e}")
        else:
            print("User not found in top 10 profiles.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify_and_update()
