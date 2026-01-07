import os
import uuid
from supabase import create_client, Client
from dotenv import load_dotenv

# Universal Design: SwarmHire matches ANY role to ANY industry.
# Modeling uses abstract entities: Organizations, Accounts, Requirements.

load_dotenv('backend/.env')
supabase: Client = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

def seed():
    print("🧹 Final Sync: Universal Platform Alignment...")

    # 1. Purge Clutter
    try:
        supabase.table('requirements').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        supabase.table('accounts').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        supabase.table('organizations').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
    except Exception as e:
        print(f"⚠️ Cleanup note: {e}")

    # 2. Seed Primary Org (EPAM)
    try:
        org_res = supabase.table('organizations').insert({"name": "EPAM Systems", "slug": "epam"}).execute()
        org_id = org_res.data[0]['id']
        print(f"✅ Organization: {org_id} (Universal Core)")

        # 3. Seed Account (Uber) - Agnostic Industry
        acc_res = supabase.table('accounts').insert({
            "name": "Uber", 
            "org_id": org_id, 
            "description": "Global Mobility & logistics Account"
        }).execute()
        acc_id = acc_res.data[0]['id']
        print(f"✅ Account: {acc_id} (Unit Allocation)")

        # 4. Seed Specialized Role (Requirement)
        # Using ONLY universal hiring fields. 
        # Domain-specific intelligence is handled by the Swarm Agents, not the DB schema.
        requirement = {
            "title": "Senior Software Engineer Java",
            "org_id": org_id,
            "account_id": acc_id,
            "skills": ["Domain Expertise", "Java Architecture", "Strategic Problem Solving"]
        }
        supabase.table('requirements').insert(requirement).execute()
        print("✅ Requirement established (Role Agnostic Structure).")

        # 5. Verified Identities (Super Admins)
        admins = ['aditya_raj@epam.com', 'shreya_raj@epam.com']
        for email in admins:
            # We use existing profiles to avoid FK violations with Auth
            supabase.table('profiles').update({"is_super_admin": True}).eq('email', email).execute()
        print(f"✅ Identity Registry: {len(admins)} Super Admins verified.")

    except Exception as e:
        print(f"❌ Universal Sync Failed: {e}")

    print("\n✨ SWARMHIRE CORE SYNCED TO UNIVERSAL STATE.")

if __name__ == "__main__":
    seed()
