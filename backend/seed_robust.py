import os
import uuid
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('backend/.env')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def seed():
    print("🚀 Final Seeding (Robust Mode)...")

    # 1. Orgs
    orgs = [
        {"name": "Acme Global Systems", "slug": "acme", "org_head": "Sarah Jenkins"},
        {"name": "HyperSync Tech", "slug": "hypersync", "org_head": "Michael Chen"},
        {"name": "NeuralStack AI", "slug": "neuralstack", "org_head": "Elena Rodriguez"}
    ]
    
    upserted_orgs = []
    for org in orgs:
        try:
            # Check if exists
            existing = supabase.table('organizations').select('id').eq('slug', org['slug']).execute()
            # Try full upsert
            try:
                if existing.data:
                    res = supabase.table('organizations').update(org).eq('slug', org['slug']).execute()
                else:
                    res = supabase.table('organizations').insert(org).execute()
            except Exception as e:
                print(f"⚠️ Full org update failed, trying without heads: {e}")
                org_no_heads = {k: v for k, v in org.items() if k != 'org_head'}
                if existing.data:
                    res = supabase.table('organizations').update(org_no_heads).eq('slug', org['slug']).execute()
                else:
                    res = supabase.table('organizations').insert(org_no_heads).execute()
            
            upserted_orgs.append(res.data[0])
            print(f"✅ Organization Ready: {org['name']}")
        except Exception as e:
            print(f"⚠️ Org error: {e}")

    if not upserted_orgs: return
    acme_id = upserted_orgs[0]['id']
    hyper_id = upserted_orgs[1]['id']

    # 2. Accounts
    accounts = [
        {"name": "Core Engineering", "org_id": acme_id, "account_head": "David Kim"},
        {"name": "Global Sales", "org_id": acme_id, "account_head": "Lisa Wong"},
        {"name": "R&D Lab", "org_id": hyper_id, "account_head": "Alex Rivera"}
    ]
    
    upserted_accounts = []
    for acc in accounts:
        try:
            existing = supabase.table('accounts').select('id').eq('name', acc['name']).eq('org_id', acc['org_id']).execute()
            try:
                if existing.data:
                    res = supabase.table('accounts').update(acc).eq('id', existing.data[0]['id']).execute()
                else:
                    res = supabase.table('accounts').insert(acc).execute()
            except Exception as e:
                print(f"⚠️ Full account update failed, trying without heads: {e}")
                acc_no_heads = {k: v for k, v in acc.items() if k != 'account_head'}
                if existing.data:
                    res = supabase.table('accounts').update(acc_no_heads).eq('id', existing.data[0]['id']).execute()
                else:
                    res = supabase.table('accounts').insert(acc_no_heads).execute()

            upserted_accounts.append(res.data[0])
            print(f"✅ Account Ready: {acc['name']}")
        except Exception as e:
            print(f"⚠️ Account error: {e}")

    if not upserted_accounts: return
    eng_id = upserted_accounts[0]['id']

    # 3. Requirements
    reqs = [
        {"title": "Principal Architect", "org_id": acme_id, "account_id": eng_id, "is_active": True, "skills": ["Python", "AI"]},
        {"title": "Senior UI Designer", "org_id": acme_id, "account_id": eng_id, "is_active": True, "skills": ["Figma", "React"]}
    ]
    
    for req in reqs:
        try:
            existing = supabase.table('requirements').select('id').eq('title', req['title']).eq('org_id', req['org_id']).execute()
            if existing.data:
                supabase.table('requirements').update(req).eq('id', existing.data[0]['id']).execute()
            else:
                supabase.table('requirements').insert(req).execute()
            print(f"✅ Position Ready: {req['title']}")
        except Exception as e:
            print(f"⚠️ Position error: {e}")

    # 4. Profile
    try:
        my_profile = {"id": "5fdf1ac7-af0d-4fd2-a1c4-f6cd9528ac70", "full_name": "Aditya Raj", "email": "aditya_raj@epam.com", "is_super_admin": True}
        supabase.table('profiles').upsert(my_profile).execute()
        print("✅ Super Admin Profile Ready.")
    except Exception as e:
        print(f"⚠️ Profile error: {e}")

    print("\n✨ SEEDING COMPLETE!")

if __name__ == "__main__":
    seed()
