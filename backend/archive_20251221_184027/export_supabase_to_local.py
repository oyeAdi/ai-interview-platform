"""
Export Supabase data to local JSON files for backward compatibility
"""
import os
import json
from supabase import create_client
from dotenv import load_dotenv

# Load environment
env_path = os.path.join(os.path.dirname(__file__), '..', '.env.supabase')
load_dotenv(env_path)

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise Exception("Missing Supabase credentials")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

print("Fetching data from Supabase...")

# Fetch all tenants
tenants_response = supabase.table('tenants').select('*').execute()
all_tenants = tenants_response.data

# Fetch all positions
positions_response = supabase.table('job_descriptions').select('*').execute()
all_positions = positions_response.data

print(f"Found {len(all_tenants)} tenants")
print(f"Found {len(all_positions)} positions")

# Separate parent tenants and child accounts
parent_tenants = [t for t in all_tenants if t.get('parent_tenant_id') is None]
child_accounts = [t for t in all_tenants if t.get('parent_tenant_id') is not None]

print(f"Parent tenants: {len(parent_tenants)}")
print(f"Child accounts: {len(child_accounts)}")

# Build accounts JSON
accounts_data = []
for account in child_accounts:
    # Get positions for this account
    account_positions = [p['id'] for p in all_positions if str(p.get('tenant_id')) == str(account['id'])]
    
    # Get parent tenant to determine org_id
    parent = next((t for t in parent_tenants if t['id'] == account.get('parent_tenant_id')), None)
    org_id = parent['slug'] if parent else 'unknown'
    
    accounts_data.append({
        "id": account['slug'],
        "name": account['name'],
        "org_id": org_id,
        "description": account.get('settings', {}).get('description', ''),
        "positions": account_positions
    })

# Build positions JSON
positions_data = []
for position in all_positions:
    # Find the account (child tenant) this position belongs to
    account = next((a for a in child_accounts if a['id'] == position.get('tenant_id')), None)
    
    if not account:
        print(f"Warning: Position '{position.get('title')}' has no account")
        continue
    
    # Map status back: active -> open, archived -> closed
    status_map = {'active': 'open', 'archived': 'closed', 'draft': 'open'}
    original_status = status_map.get(position.get('status', 'active'), 'open')
    
    positions_data.append({
        "id": str(position['id']),
        "title": position.get('title', ''),
        "account_id": account['slug'],
        "status": original_status,
        "created_at": position.get('created_at', ''),
        "jd_text": position.get('description', ''),
        "data_model": position.get('analyst_output', {}),
        "updated_at": position.get('updated_at', ''),
        "posted_by": position.get('requirements', {}).get('posted_by', ''),
        "project_code": position.get('requirements', {}).get('project_code', ''),
        "work_location": position.get('requirements', {}).get('work_location', ''),
        "billable": position.get('requirements', {}).get('billable', False),
        "published_date": position.get('requirements', {}).get('published_date', ''),
        "timeline": position.get('requirements', {}).get('timeline', ''),
        "employment_type": position.get('requirements', {}).get('employment_type', ''),
        "role_type": position.get('requirements', {}).get('role_type', '')
    })

# Write to files
accounts_file = os.path.join(os.path.dirname(__file__), 'models', 'accounts.json')
positions_file = os.path.join(os.path.dirname(__file__), 'models', 'positions.json')

with open(accounts_file, 'w', encoding='utf-8') as f:
    json.dump({"accounts": accounts_data}, f, indent=2, ensure_ascii=False)

with open(positions_file, 'w', encoding='utf-8') as f:
    json.dump({"positions": positions_data}, f, indent=2, ensure_ascii=False)

print(f"\n✅ Exported to local files:")
print(f"  - {len(accounts_data)} accounts → {accounts_file}")
print(f"  - {len(positions_data)} positions → {positions_file}")
