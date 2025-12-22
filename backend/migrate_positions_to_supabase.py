"""
Migrate positions from positions.json to Supabase job_descriptions table
"""
import json
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

# Load positions from JSON
positions_file = os.path.join(os.path.dirname(__file__), 'models', 'positions.json')
with open(positions_file, 'r', encoding='utf-8') as f:
    data = json.load(f)
    positions = data.get('positions', [])

print(f"Found {len(positions)} positions to migrate")

# First, get all tenants to map account_id to tenant UUID
print("\nFetching tenants from Supabase...")
tenants_response = supabase.table('tenants').select('id, slug, name').execute()
tenant_map = {}
for tenant in tenants_response.data:
    # Map by slug (lowercase name with hyphens)
    slug = tenant['slug']
    tenant_map[slug] = tenant['id']
    print(f"  - {tenant['name']} ({slug}) -> {tenant['id']}")

print(f"\nMapped {len(tenant_map)} tenants")

# Migrate positions
migrated = 0
skipped = 0
errors = []

for position in positions:
    try:
        account_id = position.get('account_id', '')
        
        # Map account_id to tenant UUID
        tenant_id = tenant_map.get(account_id)
        
        if not tenant_id:
            print(f"⚠ Skipping position '{position.get('title')}' - tenant '{account_id}' not found in Supabase")
            skipped += 1
            continue
        
        # Map status: 'open' -> 'active', 'closed' -> 'archived'
        status_map = {
            'open': 'active',
            'closed': 'archived'
        }
        original_status = position.get('status', 'open')
        mapped_status = status_map.get(original_status, 'active')
        
        # Map experience_level to seniority_level
        data_model = position.get('data_model', {})
        experience_level = data_model.get('experience_level', 'mid')
        
        # Extract skills from data_model
        required_skills = data_model.get('required_skills', [])
        skills_list = [skill.get('skill') for skill in required_skills if skill.get('skill')]
        
        # Prepare position data for Supabase
        new_position = {
            'tenant_id': tenant_id,
            'title': position.get('title', ''),
            'description': position.get('jd_text', ''),
            'status': mapped_status,
            'seniority_level': experience_level,
            'skills': skills_list,
            'analyst_output': data_model,
            'requirements': {
                # Store additional metadata here
                'posted_by': position.get('posted_by'),
                'project_code': position.get('project_code'),
                'work_location': position.get('work_location'),
                'billable': position.get('billable'),
                'published_date': position.get('published_date'),
                'timeline': position.get('timeline'),
                'employment_type': position.get('employment_type'),
                'role_type': position.get('role_type'),
                'legacy_id': position.get('id'),
                'created_at_legacy': position.get('created_at'),
                'updated_at_legacy': position.get('updated_at')
            }
        }
        
        # Insert into Supabase
        response = supabase.table('job_descriptions').insert(new_position).execute()
        
        if response.data:
            migrated += 1
            print(f"✓ Migrated: {position.get('title')} ({account_id})")
        else:
            errors.append(f"Failed to insert: {position.get('title')}")
            
    except Exception as e:
        error_msg = f"Error migrating '{position.get('title', 'unknown')}': {str(e)}"
        errors.append(error_msg)
        print(f"✗ {error_msg}")

# Summary
print("\n" + "="*60)
print("MIGRATION SUMMARY")
print("="*60)
print(f"Total positions in JSON: {len(positions)}")
print(f"Successfully migrated: {migrated}")
print(f"Skipped (tenant not found): {skipped}")
print(f"Errors: {len(errors)}")

if errors:
    print("\nErrors:")
    for error in errors:
        print(f"  - {error}")

print("\n✅ Migration complete!")
