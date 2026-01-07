import os
from supabase import create_client, Client
from dotenv import load_dotenv
import uuid

# Load credentials from backend/.env
load_dotenv('backend/.env')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def seed():
    print("🌱 Starting seeding (v2)...")
    
    # 1. Organizations
    orgs = [
        {"name": "Acme Corporation", "slug": "acme-corp", "subscription_tier": "enterprise", "is_active": True},
        {"name": "TechStart Inc", "slug": "techstart", "subscription_tier": "professional", "is_active": True},
        {"name": "Global Solutions Ltd", "slug": "global-solutions", "subscription_tier": "basic", "is_active": True}
    ]
    
    created_orgs = []
    for org in orgs:
        try:
            res = supabase.table('organizations').upsert(org, on_conflict='slug').execute()
            created_orgs.append(res.data[0])
            print(f"✅ Organization: {org['name']}")
        except Exception as e:
            print(f"❌ Error org {org['name']}: {e}")
            
    if not created_orgs: return
    
    acme_id = created_orgs[0]['id']
    tech_id = created_orgs[1]['id']
    
    # 2. Accounts
    accounts = [
        {"name": "Engineering Department", "org_id": acme_id, "is_active": True},
        {"name": "Product Team", "org_id": acme_id, "is_active": True},
        {"name": "Sales Division", "org_id": tech_id, "is_active": True}
    ]
    
    created_accounts = []
    for acc in accounts:
        try:
            res = supabase.table('accounts').upsert(acc, on_conflict='name,org_id').execute()
            created_accounts.append(res.data[0])
            print(f"✅ Account: {acc['name']}")
        except Exception as e:
            print(f"❌ Error account {acc['name']}: {e}")
            
    # 3. Requirements (Positions)
    reqs = [
        {
            "title": "Senior Full Stack Engineer", 
            "org_id": acme_id, 
            "account_id": created_accounts[0]['id'] if created_accounts else None,
            "description": "Expert in React and Python",
            "skills": ["Python", "React", "FastAPI"],
            "experience_level": "senior",
            "status": "active"
        },
        {
            "title": "Frontend Developer", 
            "org_id": acme_id, 
            "account_id": created_accounts[0]['id'] if created_accounts else None,
            "description": "Junior frontend role",
            "skills": ["React", "TypeScript"],
            "experience_level": "mid",
            "status": "active"
        }
    ]
    
    for req in reqs:
        try:
            res = supabase.table('requirements').upsert(req, on_conflict='title,org_id').execute()
            print(f"✅ Requirement: {req['title']}")
        except Exception as e:
            print(f"❌ Error requirement {req['title']}: {e}")
            
    # 4. Admin Access Requests
    requests = [
        {"email": "john.doe@example.com", "full_name": "John Doe", "reason": "Testing admin flow", "status": "pending"},
        {"email": "jane.smith@company.com", "full_name": "Jane Smith", "reason": "Need org access", "status": "pending"}
    ]
    
    for r in requests:
        try:
            res = supabase.table('admin_access_requests').upsert(r, on_conflict='email').execute()
            print(f"✅ Access Request: {r['email']}")
        except Exception as e:
            print(f"❌ Error request {r['email']}: {e}")

    print("\n🚀 Seeding finished successfully!")

if __name__ == "__main__":
    seed()
