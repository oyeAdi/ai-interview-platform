"""
Fix tenant hierarchy in Supabase - set parent_tenant_id for child accounts
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

print("Fetching all tenants from Supabase...")
tenants_response = supabase.table('tenants').select('id, slug, name, parent_tenant_id').execute()

# Create a map of slug -> tenant
tenant_map = {}
for tenant in tenants_response.data:
    tenant_map[tenant['slug']] = tenant
    print(f"  - {tenant['name']} ({tenant['slug']}) - Parent: {tenant.get('parent_tenant_id', 'None')}")

print(f"\nFound {len(tenant_map)} tenants")

# Define the hierarchy
# Format: child_slug -> parent_slug
hierarchy = {
    # EPAM's clients (B2B corporate accounts)
    'uber': 'epam',
    'servicenow': 'epam',
    'amazon': 'epam',
    'expedia': 'epam',
    'microsoft': 'epam',
    'meta': 'epam',
    'spotify': 'epam',
    
    # You can also add Google TA's clients here if needed
    # 'some-client': 'google',
}

print("\n" + "="*60)
print("UPDATING TENANT HIERARCHY")
print("="*60)

updated = 0
skipped = 0
errors = []

for child_slug, parent_slug in hierarchy.items():
    try:
        # Check if child exists
        if child_slug not in tenant_map:
            print(f"⚠ Skipping '{child_slug}' - not found in Supabase")
            skipped += 1
            continue
        
        # Check if parent exists
        if parent_slug not in tenant_map:
            print(f"⚠ Skipping '{child_slug}' - parent '{parent_slug}' not found")
            skipped += 1
            continue
        
        child_id = tenant_map[child_slug]['id']
        parent_id = tenant_map[parent_slug]['id']
        child_name = tenant_map[child_slug]['name']
        parent_name = tenant_map[parent_slug]['name']
        
        # Update the child's parent_tenant_id
        response = supabase.table('tenants').update({
            'parent_tenant_id': parent_id
        }).eq('id', child_id).execute()
        
        if response.data:
            updated += 1
            print(f"✓ Updated: {child_name} ({child_slug}) -> Parent: {parent_name} ({parent_slug})")
        else:
            errors.append(f"Failed to update {child_slug}")
            
    except Exception as e:
        error_msg = f"Error updating '{child_slug}': {str(e)}"
        errors.append(error_msg)
        print(f"✗ {error_msg}")

# Summary
print("\n" + "="*60)
print("HIERARCHY UPDATE SUMMARY")
print("="*60)
print(f"Total relationships to update: {len(hierarchy)}")
print(f"Successfully updated: {updated}")
print(f"Skipped: {skipped}")
print(f"Errors: {len(errors)}")

if errors:
    print("\nErrors:")
    for error in errors:
        print(f"  - {error}")

print("\n✅ Hierarchy update complete!")
print("\nCurrent structure:")
print("EPAM Systems")
for child_slug, parent_slug in hierarchy.items():
    if parent_slug == 'epam' and child_slug in tenant_map:
        print(f"  └── {tenant_map[child_slug]['name']}")
