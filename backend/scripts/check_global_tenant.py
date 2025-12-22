"""Check profile and tenant table details"""
import sys
sys.path.append('backend')
from supabase_config import supabase_admin

try:
    print("Fetching profile detail for Super Admin...")
    res = supabase_admin.table('profiles').select('id, email, tenant_id, is_super_admin').eq('is_super_admin', True).execute()
    print(f"Super Admins found: {len(res.data)}")
    for p in res.data:
        print(f"- {p['email']}: tenant_id={p['tenant_id']}")
    
    print("\nFetching 'global' tenant detail...")
    res_t = supabase_admin.table('tenants').select('*').eq('slug', 'global').execute()
    if res_t.data:
        print(f"Global Tenant found: {res_t.data[0]['id']}")
    else:
        print("Global Tenant NOT found.")

except Exception as e:
    print(f"❌ Error: {e}")
