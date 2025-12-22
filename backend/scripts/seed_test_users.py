"""
Create test users for all personas in the system
All users will have password: Test@1234
"""
import sys
sys.path.append('backend')

from supabase_config import supabase_admin

PASSWORD = "Test@1234"

# Define test users for each persona
TEST_USERS = {
    "super_admin": {
        "email": "aditya_raj@epam.com",
        "full_name": "Aditya Raj",
        "role": "super_admin",
        "tenant_id": "global",
        "is_super_admin": True
    },
    "tenant_admin": [
        {
            "email": "tenant_admin_b2b@epam.com",
            "full_name": "Sarah Johnson",
            "role": "tenant_admin",
            "tenant_slug": "epam",  # EPAM Systems (B2B)
            "description": "Tenant Admin for EPAM Systems"
        },
        {
            "email": "tenant_admin_b2c@mockpro.com",
            "full_name": "Michael Chen",
            "role": "tenant_admin",
            "tenant_slug": "mock-interview-pro",  # Mock-Interview Pro (B2C)
            "description": "Tenant Admin for Mock-Interview Pro"
        },
        {
            "email": "tenant_admin_c2c@nanny.com",
            "full_name": "Emily Davis",
            "role": "tenant_admin",
            "tenant_slug": "nanny-circle",  # Guardian Nanny Circle (C2C)
            "description": "Tenant Admin for Guardian Nanny Circle"
        }
    ],
    "account_admin": [
        {
            "email": "account_admin_uber@epam.com",
            "full_name": "David Martinez",
            "role": "account_admin",
            "tenant_slug": "epam",
            "account_name": "Uber",
            "description": "Account Admin for Uber at EPAM"
        },
        {
            "email": "account_admin_meta@google.com",
            "full_name": "Lisa Wang",
            "role": "account_admin",
            "tenant_slug": "google",
            "account_name": "Meta",
            "description": "Account Admin for Meta at Google TA"
        },
        {
            "email": "account_admin_coaching@sdcoach.com",
            "full_name": "Robert Taylor",
            "role": "account_admin",
            "tenant_slug": "system-design-coach",
            "account_name": "Senior Level Coaching",
            "description": "Account Admin for Senior Level Coaching"
        }
    ],
    "HITL_expert": [
        {
            "email": "expert_backend@epam.com",
            "full_name": "James Wilson",
            "role": "HITL_expert",
            "tenant_slug": "epam",
            "description": "Backend Engineering Expert"
        },
        {
            "email": "expert_product@google.com",
            "full_name": "Amanda Brown",
            "role": "HITL_expert",
            "tenant_slug": "google",
            "description": "Product Management Expert"
        },
        {
            "email": "expert_coach@sdcoach.com",
            "full_name": "Kevin Lee",
            "role": "HITL_expert",
            "tenant_slug": "system-design-coach",
            "description": "System Design Expert"
        }
    ],
    "candidate": [
        {
            "email": "candidate_john@example.com",
            "full_name": "John Smith",
            "role": "candidate",
            "tenant_slug": "epam",
            "description": "Candidate for Backend Engineer role"
        },
        {
            "email": "candidate_jane@example.com",
            "full_name": "Jane Doe",
            "role": "candidate",
            "tenant_slug": "google",
            "description": "Candidate for Product Manager role"
        },
        {
            "email": "candidate_alex@example.com",
            "full_name": "Alex Thompson",
            "role": "candidate",
            "tenant_slug": "mock-interview-pro",
            "description": "Candidate for Mock Interview"
        }
    ]
}

def get_tenant_id(slug):
    """Get tenant ID from slug"""
    tenant = supabase_admin.table('tenants').select('id').eq('slug', slug).single().execute()
    return tenant.data['id'] if tenant.data else None

def get_account_id(tenant_id, account_name):
    """Get account ID from tenant and account name"""
    account = supabase_admin.table('accounts').select('id').eq('tenant_id', tenant_id).eq('name', account_name).single().execute()
    return account.data['id'] if account.data else None

def delete_existing_test_users():
    """Delete all existing test users"""
    print("Deleting existing test users...")
    
    test_emails = [TEST_USERS["super_admin"]["email"]]
    for persona_users in TEST_USERS.values():
        if isinstance(persona_users, list):
            test_emails.extend([u["email"] for u in persona_users])
    
    # Delete from auth.users
    try:
        auth_users = supabase_admin.auth.admin.list_users()
        for user in auth_users:
            if user.email in test_emails:
                supabase_admin.auth.admin.delete_user(user.id)
                print(f"  ✓ Deleted auth user: {user.email}")
    except Exception as e:
        print(f"  ⚠ Error deleting auth users: {e}")
    
    # Delete from profiles
    try:
        supabase_admin.table('profiles').delete().in_('email', test_emails).execute()
        print(f"  ✓ Deleted {len(test_emails)} profiles")
    except Exception as e:
        print(f"  ⚠ Error deleting profiles: {e}")

def create_user(email, full_name, role, tenant_id, is_super_admin=False, managed_accounts=None):
    """Create a user in both auth and profiles"""
    try:
        # Check if user already exists in auth
        existing_auth_users = supabase_admin.auth.admin.list_users()
        existing_user = next((u for u in existing_auth_users if u.email == email), None)
        
        if existing_user:
            user_id = existing_user.id
            # Update password
            supabase_admin.auth.admin.update_user_by_id(user_id, {"password": PASSWORD})
        else:
            # Create in Supabase Auth
            auth_res = supabase_admin.auth.admin.create_user({
                "email": email,
                "password": PASSWORD,
                "email_confirm": True,
                "user_metadata": {"full_name": full_name}
            })
            user_id = auth_res.user.id
        
        # Upsert in Profiles (handles both create and update)
        profile_data = {
            "id": user_id,
            "email": email,
            "full_name": full_name,
            "role": role,
            "tenant_id": tenant_id,
            "is_super_admin": is_super_admin,
            "managed_accounts": managed_accounts or []
        }
        
        supabase_admin.table('profiles').upsert(profile_data, on_conflict='id').execute()
        return user_id
    except Exception as e:
        print(f"    ✗ Error creating {email}: {e}")
        return None

def seed_test_users():
    """Create all test users"""
    print("\n" + "="*60)
    print("Creating Test Users")
    print("="*60)
    print(f"Password for all users: {PASSWORD}\n")
    
    # 1. Super Admin
    print("1. SUPER ADMIN")
    user = TEST_USERS["super_admin"]
    user_id = create_user(
        user["email"], user["full_name"], user["role"],
        user["tenant_id"], is_super_admin=True
    )
    if user_id:
        print(f"   ✓ {user['email']} - {user['full_name']}")
    
    # 2. Tenant Admins
    print("\n2. TENANT ADMINS (3 users)")
    for user in TEST_USERS["tenant_admin"]:
        tenant_id = get_tenant_id(user["tenant_slug"])
        if tenant_id:
            user_id = create_user(
                user["email"], user["full_name"], user["role"], tenant_id
            )
            if user_id:
                print(f"   ✓ {user['email']} - {user['full_name']}")
                print(f"     Tenant: {user['tenant_slug']}")
    
    # 3. Account Admins
    print("\n3. ACCOUNT ADMINS (3 users)")
    for user in TEST_USERS["account_admin"]:
        tenant_id = get_tenant_id(user["tenant_slug"])
        if tenant_id:
            account_id = get_account_id(tenant_id, user["account_name"])
            if account_id:
                user_id = create_user(
                    user["email"], user["full_name"], user["role"],
                    tenant_id, managed_accounts=[account_id]
                )
                if user_id:
                    print(f"   ✓ {user['email']} - {user['full_name']}")
                    print(f"     Account: {user['account_name']} at {user['tenant_slug']}")
    
    # 4. HITL Experts
    print("\n4. HITL EXPERTS (3 users)")
    for user in TEST_USERS["HITL_expert"]:
        tenant_id = get_tenant_id(user["tenant_slug"])
        if tenant_id:
            user_id = create_user(
                user["email"], user["full_name"], user["role"], tenant_id
            )
            if user_id:
                print(f"   ✓ {user['email']} - {user['full_name']}")
                print(f"     Specialty: {user['description']}")
    
    # 5. Candidates
    print("\n5. CANDIDATES (3 users)")
    for user in TEST_USERS["candidate"]:
        tenant_id = get_tenant_id(user["tenant_slug"])
        if tenant_id:
            user_id = create_user(
                user["email"], user["full_name"], user["role"], tenant_id
            )
            if user_id:
                print(f"   ✓ {user['email']} - {user['full_name']}")
                print(f"     Tenant: {user['tenant_slug']}")
    
    print("\n" + "="*60)
    print("✅ Test Users Created Successfully!")
    print("="*60)
    print(f"\nTotal Users: 13")
    print(f"  - 1 Super Admin")
    print(f"  - 3 Tenant Admins (B2B, B2C, C2C)")
    print(f"  - 3 Account Admins")
    print(f"  - 3 HITL Experts")
    print(f"  - 3 Candidates")
    print(f"\nAll users have password: {PASSWORD}")
    print("="*60)

if __name__ == "__main__":
    delete_existing_test_users()
    seed_test_users()
