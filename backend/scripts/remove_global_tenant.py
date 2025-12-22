"""Execute the removal of global tenant"""
import sys
sys.path.append('backend')
from supabase_config import supabase_admin

def remove_global():
    try:
        print("1. Checking for accounts linked to 'global'...")
        acc_res = supabase_admin.table('accounts').select('id').eq('tenant_id', 'global').execute()
        if acc_res.data:
            print(f"   Found {len(acc_res.data)} accounts linked to 'global'. Deleting them...")
            for acc in acc_res.data:
                # Delete linked positions first if they exist
                supabase_admin.table('positions').delete().eq('account_id', acc['id']).execute()
                supabase_admin.table('accounts').delete().eq('id', acc['id']).execute()
            print("   ✅ Accounts and positions cleared.")
        else:
            print("   No accounts linked to 'global'.")

        print("2. Setting tenant_id to NULL for all Super Admins...")
        # Get all super admins
        admins = supabase_admin.table('profiles').select('id, email').eq('role', 'super_admin').execute()
        for admin in admins.data:
            print(f"   Updating {admin['email']}...")
            supabase_admin.table('profiles').update({'tenant_id': None}).eq('id', admin['id']).execute()
        print("   ✅ Super Admins decoupled.")

        print("3. Deleting 'global' tenant from tenants table...")
        del_res = supabase_admin.table('tenants').delete().eq('id', 'global').execute()
        if not del_res.data:
            # Try by slug if ID failed
            del_res = supabase_admin.table('tenants').delete().eq('slug', 'global').execute()
            
        print("   ✅ Tenant 'global' removed successfully.")

    except Exception as e:
        print(f"❌ Error during removal: {e}")

if __name__ == "__main__":
    remove_global()
