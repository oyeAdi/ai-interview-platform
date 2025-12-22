"""Quick test script to verify super admin API endpoints"""
import sys
sys.path.append('backend')

from supabase_config import supabase_admin

print("=== Testing Super Admin Data Access ===\n")

# Test 1: Direct database access
print("1. Testing direct database access...")
try:
    tenants = supabase_admin.table('tenants').select('*').execute()
    print(f"   ✓ Found {len(tenants.data)} tenants")
    for t in tenants.data[:3]:
        print(f"     - {t['name']} (ID: {t['id']})")
except Exception as e:
    print(f"   ✗ Error: {e}")

print()

# Test 2: Accounts
print("2. Testing accounts access...")
try:
    accounts = supabase_admin.table('accounts').select('*').execute()
    print(f"   ✓ Found {len(accounts.data)} accounts")
    for a in accounts.data[:3]:
        print(f"     - {a['name']} (Tenant: {a['tenant_id']})")
except Exception as e:
    print(f"   ✗ Error: {e}")

print()

# Test 3: Profiles
print("3. Testing profiles access...")
try:
    profiles = supabase_admin.table('profiles').select('id, email, full_name, role, is_super_admin').execute()
    print(f"   ✓ Found {len(profiles.data)} profiles")
    super_admins = [p for p in profiles.data if p.get('is_super_admin')]
    print(f"   ✓ Found {len(super_admins)} super admins:")
    for p in super_admins:
        print(f"     - {p.get('email', 'N/A')} ({p.get('full_name', 'N/A')})")
except Exception as e:
    print(f"   ✗ Error: {e}")

print("\n=== Test Complete ===")
