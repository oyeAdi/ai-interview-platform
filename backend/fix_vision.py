import sys
sys.path.insert(0, '.')
from supabase_config import supabase_admin

# Update all super_admin users to have NULL preferred_vision
result = supabase_admin.table('profiles').update({
    'preferred_vision': None,
    'tenant_id': None
}).or_('role.eq.super_admin,is_super_admin.eq.true').execute()

print(f'✅ Updated {len(result.data)} super_admin profiles')
for u in result.data:
    print(f'  - {u["email"]} (role: {u["role"]})')
