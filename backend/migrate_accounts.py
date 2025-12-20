"""
Account Migration Script
Migrates legacy accounts from accounts.json to Supabase tenants table
with hierarchical parent-child relationships.
"""

import json
import os
from supabase_config import supabase_admin

# Load legacy accounts
ACCOUNTS_FILE = os.path.join(os.path.dirname(__file__), "models", "accounts.json")

def migrate_accounts():
    """Migrate accounts from JSON to Supabase with parent relationships"""
    
    # Load legacy data
    with open(ACCOUNTS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Get parent tenant IDs
    epam_response = supabase_admin.table('tenants').select('id').eq('slug', 'epam').single().execute()
    google_response = supabase_admin.table('tenants').select('id').eq('slug', 'google').single().execute()
    
    epam_id = epam_response.data['id'] if epam_response.data else None
    google_id = google_response.data['id'] if google_response.data else None
    
    if not epam_id or not google_id:
        print("[ERROR] Parent tenants (EPAM/Google) not found in database!")
        return
    
    # Distribution mapping
    epam_clients = ['uber', 'servicenow', 'expedia']
    google_clients = ['meta', 'spotify', 'amazon']
    
    migrated_count = 0
    
    for account in data.get('accounts', []):
        account_id = account['id']
        
        # Determine parent
        if account_id in epam_clients:
            parent_id = epam_id
        elif account_id in google_clients:
            parent_id = google_id
        else:
            # Skip or assign to EPAM by default
            print(f"[WARN] Account '{account_id}' not in distribution map, assigning to EPAM")
            parent_id = epam_id
        
        # Create tenant record
        new_tenant = {
            'name': account['name'],
            'slug': account_id,
            'logo_url': account.get('logo', ''),
            'parent_tenant_id': parent_id,
            'settings': {
                'description': account.get('description', ''),
                'org_id': account.get('org_id', 'epam'),
                'positions': account.get('positions', [])
            }
        }
        
        try:
            supabase_admin.table('tenants').insert(new_tenant).execute()
            migrated_count += 1
            print(f"✓ Migrated: {account['name']} -> Parent: {'EPAM' if parent_id == epam_id else 'Google'}")
        except Exception as e:
            print(f"✗ Failed to migrate {account['name']}: {e}")
    
    print(f"\n[SUCCESS] Migrated {migrated_count}/{len(data.get('accounts', []))} accounts")

if __name__ == "__main__":
    print("Starting account migration...")
    migrate_accounts()
