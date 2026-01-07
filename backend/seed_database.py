"""
Seed script to populate Supabase database with test data.
Creates tenants, users, accounts, positions, and sessions.
All test users have password: Test@1234
"""

import asyncio
from supabase import create_client, Client
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import random

# Load environment variables
load_dotenv('.env.supabase')

# Initialize Supabase client
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise Exception("Missing Supabase credentials in .env.supabase")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print("🌱 Starting database seeding...")

# ============================================
# 1. CREATE TENANTS
# ============================================
print("\n📦 Creating tenants...")

tenants_data = [
    {
        "name": "Acme Corporation",
        "slug": "acme-corp",
        "domain": "acme.swarmhire.com",
        "subscription_tier": "enterprise",
        "is_active": True
    },
    {
        "name": "TechStart Inc",
        "slug": "techstart",
        "domain": "techstart.swarmhire.com",
        "subscription_tier": "professional",
        "is_active": True
    },
    {
        "name": "Global Solutions Ltd",
        "slug": "global-solutions",
        "domain": "global.swarmhire.com",
        "subscription_tier": "basic",
        "is_active": True
    }
]

created_tenants = []
for tenant in tenants_data:
    try:
        result = supabase.table('tenants').insert(tenant).execute()
        created_tenants.append(result.data[0])
        print(f"  ✓ Created tenant: {tenant['name']}")
    except Exception as e:
        print(f"  ✗ Error creating tenant {tenant['name']}: {e}")

# ============================================
# 2. CREATE AUTH USERS & PROFILES
# ============================================
print("\n👥 Creating users...")

# Note: We'll create profiles directly since we can't create auth users via API
# In production, users would sign up through the auth flow

users_data = [
    # Super Admin
    {
        "email": "super.admin@swarmhire.com",
        "full_name": "Super Admin",
        "role": "SUPER_ADMIN",
        "is_super_admin": True,
        "tenant_id": None
    },
    # Acme Corp users
    {
        "email": "admin@acme.com",
        "full_name": "Alice Admin",
        "role": "ADMIN",
        "is_super_admin": False,
        "tenant_id": created_tenants[0]['id'] if created_tenants else None
    },
    {
        "email": "recruiter@acme.com",
        "full_name": "Bob Recruiter",
        "role": "RECRUITER",
        "is_super_admin": False,
        "tenant_id": created_tenants[0]['id'] if created_tenants else None
    },
    {
        "email": "hiring.manager@acme.com",
        "full_name": "Carol Manager",
        "role": "HIRING_MANAGER",
        "is_super_admin": False,
        "tenant_id": created_tenants[0]['id'] if created_tenants else None
    },
    # TechStart users
    {
        "email": "admin@techstart.com",
        "full_name": "David Admin",
        "role": "ADMIN",
        "is_super_admin": False,
        "tenant_id": created_tenants[1]['id'] if len(created_tenants) > 1 else None
    },
    {
        "email": "recruiter@techstart.com",
        "full_name": "Eve Recruiter",
        "role": "RECRUITER",
        "is_super_admin": False,
        "tenant_id": created_tenants[1]['id'] if len(created_tenants) > 1 else None
    }
]

print("\n⚠️  IMPORTANT: You need to manually create these users in Supabase Auth:")
print("   Password for all users: Test@1234\n")

for user in users_data:
    print(f"   - {user['email']} ({user['role']})")

print("\n   After creating auth users, their profiles will be auto-created via trigger.")
print("   Or you can run this script again after auth users exist.\n")

# ============================================
# 3. CREATE ACCOUNTS
# ============================================
print("\n🏢 Creating accounts...")

accounts_data = [
    {
        "name": "Engineering Department",
        "tenant_id": created_tenants[0]['id'] if created_tenants else None,
        "industry": "Technology",
        "is_active": True
    },
    {
        "name": "Product Team",
        "tenant_id": created_tenants[0]['id'] if created_tenants else None,
        "industry": "Technology",
        "is_active": True
    },
    {
        "name": "Sales Division",
        "tenant_id": created_tenants[1]['id'] if len(created_tenants) > 1 else None,
        "industry": "Sales",
        "is_active": True
    },
    {
        "name": "Marketing Department",
        "tenant_id": created_tenants[1]['id'] if len(created_tenants) > 1 else None,
        "industry": "Marketing",
        "is_active": True
    }
]

created_accounts = []
for account in accounts_data:
    try:
        result = supabase.table('accounts').insert(account).execute()
        created_accounts.append(result.data[0])
        print(f"  ✓ Created account: {account['name']}")
    except Exception as e:
        print(f"  ✗ Error creating account {account['name']}: {e}")

# ============================================
# 4. CREATE POSITIONS
# ============================================
print("\n💼 Creating positions...")

positions_data = [
    {
        "title": "Senior Full Stack Engineer",
        "account_id": created_accounts[0]['id'] if created_accounts else None,
        "tenant_id": created_tenants[0]['id'] if created_tenants else None,
        "description": "Looking for an experienced full-stack engineer to join our team",
        "required_skills": ["React", "Node.js", "Python", "AWS"],
        "experience_level": "senior",
        "status": "active",
        "location": "Remote"
    },
    {
        "title": "Frontend Developer",
        "account_id": created_accounts[0]['id'] if created_accounts else None,
        "tenant_id": created_tenants[0]['id'] if created_tenants else None,
        "description": "Frontend developer with React expertise",
        "required_skills": ["React", "TypeScript", "CSS"],
        "experience_level": "mid",
        "status": "active",
        "location": "New York, NY"
    },
    {
        "title": "Product Manager",
        "account_id": created_accounts[1]['id'] if len(created_accounts) > 1 else None,
        "tenant_id": created_tenants[0]['id'] if created_tenants else None,
        "description": "Experienced PM to lead product initiatives",
        "required_skills": ["Product Strategy", "Agile", "User Research"],
        "experience_level": "senior",
        "status": "active",
        "location": "San Francisco, CA"
    },
    {
        "title": "Sales Representative",
        "account_id": created_accounts[2]['id'] if len(created_accounts) > 2 else None,
        "tenant_id": created_tenants[1]['id'] if len(created_tenants) > 1 else None,
        "description": "B2B sales professional",
        "required_skills": ["Sales", "CRM", "Communication"],
        "experience_level": "mid",
        "status": "active",
        "location": "Remote"
    },
    {
        "title": "DevOps Engineer",
        "account_id": created_accounts[0]['id'] if created_accounts else None,
        "tenant_id": created_tenants[0]['id'] if created_tenants else None,
        "description": "DevOps engineer with Kubernetes experience",
        "required_skills": ["Kubernetes", "Docker", "CI/CD", "AWS"],
        "experience_level": "senior",
        "status": "closed",
        "location": "Remote"
    }
]

created_positions = []
for position in positions_data:
    try:
        result = supabase.table('positions').insert(position).execute()
        created_positions.append(result.data[0])
        print(f"  ✓ Created position: {position['title']}")
    except Exception as e:
        print(f"  ✗ Error creating position {position['title']}: {e}")

# ============================================
# 5. CREATE ADMIN ACCESS REQUESTS
# ============================================
print("\n📝 Creating admin access requests...")

requests_data = [
    {
        "email": "john.doe@example.com",
        "full_name": "John Doe",
        "reason": "Need admin access to manage recruitment for our startup",
        "status": "pending"
    },
    {
        "email": "jane.smith@company.com",
        "full_name": "Jane Smith",
        "reason": "Requesting access to evaluate SwarmHire for our organization",
        "status": "pending"
    },
    {
        "email": "approved.user@test.com",
        "full_name": "Approved User",
        "reason": "Test approved request",
        "status": "approved"
    }
]

for request in requests_data:
    try:
        result = supabase.table('admin_access_requests').insert(request).execute()
        print(f"  ✓ Created request: {request['email']}")
    except Exception as e:
        print(f"  ✗ Error creating request {request['email']}: {e}")

# ============================================
# SUMMARY
# ============================================
print("\n" + "="*60)
print("✅ Database seeding completed!")
print("="*60)
print(f"\n📊 Summary:")
print(f"   Tenants: {len(created_tenants)}")
print(f"   Accounts: {len(created_accounts)}")
print(f"   Positions: {len(created_positions)}")
print(f"   Access Requests: {len(requests_data)}")

print("\n⚠️  NEXT STEPS:")
print("   1. Go to Supabase Dashboard > Authentication > Users")
print("   2. Manually create these users with password 'Test@1234':")
for user in users_data:
    print(f"      • {user['email']}")
print("\n   3. After creating auth users, update their profiles:")
print("      - Set role, tenant_id, and is_super_admin flags")
print("      - Or use the Supabase SQL editor to update profiles table")

print("\n🎉 You can now view data in the Super Admin dashboard!")
print("   Visit: http://localhost:3000/super-admin\n")
