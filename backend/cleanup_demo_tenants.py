"""
Clean up demo tenants from Supabase - keep only real tenants (EPAM, Google TA, B2C, C2C)
"""
import os
from supabase import create_client
from dotenv import load_dotenv

# Load from parent directory where .env.supabase is located
env_path = os.path.join(os.path.dirname(__file__), '..', '.env.supabase')
load_dotenv(env_path)

# Initialize Supabase client
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise Exception("Missing Supabase credentials in .env.supabase")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Demo tenants to delete (these are just sample data, not real tenants)
demo_tenants_to_delete = [
    'uber',
    'servicenow',
    'amazon',
    'expedia',
    'microsoft',
    'meta',
    'spotify'
]

# Real tenants to KEEP
real_tenants_to_keep = [
    'epam',
    'google',
    'system-design-coach',
    'mock-interview-pro',
    'nanny-circle',
    'home-tutor'
]

print("Fetching all tenants from Supabase...")
tenants_response = supabase.table('tenants').select('id, slug, name').execute()

tenant_map = {}
for tenant in tenants_response.data:
    tenant_map[tenant['slug']] = tenant
    status = "✓ KEEP" if tenant['slug'] in real_tenants_to_keep else "✗ DELETE"
    print(f"  {status} - {tenant['name']} ({tenant['slug']})")

print(f"\nFound {len(tenant_map)} tenants")

print("\n" + "="*60)
print("CLEANING UP DEMO TENANTS")
print("="*60)

deleted_count = 0
skipped_count = 0

for demo_slug in demo_tenants_to_delete:
    try:
        if demo_slug not in tenant_map:
            print(f"⚠ Skipping '{demo_slug}' - not found in Supabase")
            skipped_count += 1
            continue
        
        tenant_id = tenant_map[demo_slug]['id']
        tenant_name = tenant_map[demo_slug]['name']
        
        # Delete the tenant (CASCADE will delete associated job_descriptions)
        response = supabase.table('tenants').delete().eq('id', tenant_id).execute()
        
        if response.data:
            deleted_count += 1
            print(f"✓ Deleted: {tenant_name} ({demo_slug})")
        else:
            print(f"✗ Failed to delete: {tenant_name} ({demo_slug})")
            
    except Exception as e:
        print(f"✗ Error deleting '{demo_slug}': {str(e)}")

# Summary
print("\n" + "="*60)
print("CLEANUP SUMMARY")
print("="*60)
print(f"Demo tenants to delete: {len(demo_tenants_to_delete)}")
print(f"Successfully deleted: {deleted_count}")
print(f"Skipped: {skipped_count}")

print("\n✅ Cleanup complete!")
print("\nRemaining tenants (real ones):")
for slug in real_tenants_to_keep:
    if slug in tenant_map:
        print(f"  ✓ {tenant_map[slug]['name']} ({slug})")
