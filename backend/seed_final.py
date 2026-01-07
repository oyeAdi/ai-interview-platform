import os
import uuid
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('backend/.env')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Missing credentials")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def seed_final():
    print("🚀 Starting Final System Seeding (Schema Adjusted)...")

    # 1. Organizations (Found columns: id, name, slug, logo_url)
    orgs = [
        {"id": str(uuid.uuid4()), "name": "Acme Global Systems", "slug": "acme"},
        {"id": str(uuid.uuid4()), "name": "HyperSync Tech", "slug": "hypersync"},
        {"id": str(uuid.uuid4()), "name": "NeuralStack AI", "slug": "neuralstack"}
    ]
    
    upserted_orgs = []
    for org in orgs:
        try:
            res = supabase.table('organizations').upsert(org, on_conflict='slug').execute()
            upserted_orgs.append(res.data[0])
            print(f"✅ Org: {org['name']}")
        except Exception as e:
            print(f"❌ Error org {org['name']}: {e}")

    if not upserted_orgs:
        # Fallback: maybe the table is 'tenants'?
        print("Trying 'tenants' table fallback...")
        try:
            for org in orgs:
                res = supabase.table('tenants').upsert(org, on_conflict='slug').execute()
                upserted_orgs.append(res.data[0])
            print("✅ 'tenants' table used instead.")
        except:
            print("❌ 'tenants' table also failed.")

    if not upserted_orgs: return

    acme = upserted_orgs[0]
    hyper = upserted_orgs[1]

    # 2. Accounts (Columns unknown, but trying common ones)
    accounts = [
        {"name": "Core Engineering", "org_id": acme['id']},
        {"name": "Global Sales", "org_id": acme['id']},
        {"name": "R&D Lab", "org_id": hyper['id']},
        {"name": "Cloud Operations", "org_id": hyper['id']}
    ]
    
    upserted_accounts = []
    for acc in accounts:
        try:
            res = supabase.table('accounts').upsert(acc, on_conflict='name,org_id').execute()
            upserted_accounts.append(res.data[0])
            print(f"✅ Account: {acc['name']}")
        except Exception as e:
            print(f"❌ Error account {acc['name']}: {e}")

    if not upserted_accounts: return
    eng = upserted_accounts[0]
    rd = upserted_accounts[2]

    # 3. Requirements (Positions) (Columns: id, org_id, title, description, skills, is_active, account_id)
    reqs = [
        {
            "title": "Principal Architect (Swarm System)", 
            "org_id": acme['id'], 
            "account_id": eng['id'],
            "description": "Lead the architecture of the distributed swarm agents.",
            "skills": ["Distributed Systems", "Python", "Rust", "LlamaIndex"],
            "is_active": True
        },
        {
            "title": "Senior Product Designer", 
            "org_id": acme['id'], 
            "account_id": eng['id'],
            "description": "Design high-fidelity glassmorphism UIs.",
            "skills": ["Figma", "React", "TailwindCSS"],
            "is_active": True
        },
        {
            "title": "Neural Researcher", 
            "org_id": hyper['id'], 
            "account_id": rd['id'],
            "description": "Research new inference patterns.",
            "skills": ["PyTorch", "Transformers", "CUDA"],
            "is_active": True
        }
    ]
    
    for req in reqs:
        try:
            supabase.table('requirements').upsert(req, on_conflict='title,org_id').execute()
            print(f"✅ Position: {req['title']}")
        except Exception as e:
            print(f"❌ Position error: {e}")

    # 4. Access Requests
    requests = [
        {"email": "mark.admin@acme.com", "full_name": "Mark Admin", "reason": "Deploying SwarmHire for Acme Global.", "status": "pending"},
        {"email": "sarah.tech@hypersync.io", "full_name": "Sarah Tech", "reason": "Evaluation of NeuralStack integration.", "status": "pending"}
    ]
    
    for req in requests:
        try:
            supabase.table('admin_access_requests').upsert(req, on_conflict='email').execute()
            print(f"✅ Request: {req['email']}")
        except Exception as e:
            print(f"❌ Request error: {e}")

    print("\n✨ SYSTEM SEEDING COMPLETE!")

if __name__ == "__main__":
    seed_final()
