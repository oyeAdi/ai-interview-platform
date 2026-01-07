"""
Regenerate demo data with correct structure:
- 6 Tenants (2 per business model: B2B, B2C, C2C)
- 24 Accounts (4 per tenant)
- 192 Positions (8 per account)
"""
import os
import sys
from supabase import create_client
from dotenv import load_dotenv

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env.supabase')
load_dotenv(env_path)

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("Error: Missing Supabase credentials")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Position templates for each role type
POSITION_TEMPLATES = {
    "Backend Engineer": [
        "Senior Backend Engineer", "Backend Engineer", "Junior Backend Engineer",
        "Backend Team Lead", "Backend Architect", "API Engineer",
        "Microservices Engineer", "Backend Developer"
    ],
    "Frontend Engineer": [
        "Senior Frontend Engineer", "Frontend Engineer", "Junior Frontend Engineer",
        "Frontend Team Lead", "UI Engineer", "React Developer",
        "Frontend Architect", "Web Developer"
    ],
    "Product Manager": [
        "Senior Product Manager", "Product Manager", "Associate Product Manager",
        "Product Lead", "Technical Product Manager", "Product Owner",
        "Product Strategy Manager", "Growth Product Manager"
    ],
    "System Design Coach": [
        "Senior System Design Coach", "System Design Mentor", "Architecture Coach",
        "Distributed Systems Coach", "Scalability Coach", "Cloud Architecture Coach",
        "Microservices Coach", "System Design Expert"
    ],
    "Nanny": [
        "Full-time Nanny", "Part-time Nanny", "Live-in Nanny",
        "Weekend Nanny", "Night Nanny", "Newborn Care Specialist",
        "Toddler Care Specialist", "Special Needs Nanny"
    ],
    "Tutor": [
        "Math Tutor", "Science Tutor", "English Tutor",
        "SAT Prep Tutor", "AP Tutor", "Elementary Tutor",
        "High School Tutor", "College Prep Tutor"
    ]
}

def clear_existing_data():
    """Clear existing demo data (keep 'global' tenant)"""
    print("Clearing existing demo data...")
    
    # Get all non-global tenants
    tenants = supabase.table('tenants').select('id').neq('id', 'global').execute()
    tenant_ids = [t['id'] for t in tenants.data]
    
    if tenant_ids:
        # Delete positions first (cascade should handle it, but being explicit)
        accounts = supabase.table('accounts').select('id').in_('tenant_id', tenant_ids).execute()
        account_ids = [a['id'] for a in accounts.data]
        
        if account_ids:
            supabase.table('positions').delete().in_('account_id', account_ids).execute()
            print(f"  ✓ Deleted positions")
        
        # Delete accounts
        supabase.table('accounts').delete().in_('tenant_id', tenant_ids).execute()
        print(f"  ✓ Deleted accounts")
        
        # Delete tenants
        supabase.table('tenants').delete().in_('id', tenant_ids).execute()
        print(f"  ✓ Deleted tenants")

def seed_demo_data():
    """Seed with correct structure: 6 tenants, 4 accounts each, 8 positions each"""
    print("\nSeeding demo data with correct structure...")
    print("Target: 6 tenants, 24 accounts, 192 positions\n")
    
    # Get role templates
    templates = supabase.table('role_templates').select('*').execute()
    role_map = {t['slug']: t['id'] for t in templates.data}
    
    models = {
        "B2B": [
            {
                "name": "EPAM Systems", "slug": "epam", "domain": "epam.com",
                "accounts": [
                    {"name": "Uber", "industry": "Mobility", "role": "Backend Engineer"},
                    {"name": "Amazon", "industry": "E-commerce", "role": "Frontend Engineer"},
                    {"name": "Netflix", "industry": "Streaming", "role": "Backend Engineer"},
                    {"name": "Airbnb", "industry": "Hospitality", "role": "Product Manager"}
                ]
            },
            {
                "name": "Google TA", "slug": "google", "domain": "google.com",
                "accounts": [
                    {"name": "Meta", "industry": "Social Media", "role": "Frontend Engineer"},
                    {"name": "OpenAI", "industry": "AI", "role": "Backend Engineer"},
                    {"name": "Stripe", "industry": "FinTech", "role": "Backend Engineer"},
                    {"name": "Shopify", "industry": "E-commerce", "role": "Product Manager"}
                ]
            }
        ],
        "B2C": [
            {
                "name": "System Design Coach", "slug": "system-design-coach", "domain": "sdcoach.com",
                "accounts": [
                    {"name": "Senior Level Coaching", "industry": "Education", "role": "System Design Coach"},
                    {"name": "Mid Level Coaching", "industry": "Education", "role": "System Design Coach"},
                    {"name": "Junior Level Coaching", "industry": "Education", "role": "System Design Coach"},
                    {"name": "Executive Coaching", "industry": "Education", "role": "System Design Coach"}
                ]
            },
            {
                "name": "Mock-Interview Pro", "slug": "mock-interview-pro", "domain": "mockpro.com",
                "accounts": [
                    {"name": "Technical Mock", "industry": "Career Services", "role": "Backend Engineer"},
                    {"name": "Behavioral Mock", "industry": "Career Services", "role": "Product Manager"},
                    {"name": "System Design Mock", "industry": "Career Services", "role": "System Design Coach"},
                    {"name": "Frontend Mock", "industry": "Career Services", "role": "Frontend Engineer"}
                ]
            }
        ],
        "C2C": [
            {
                "name": "Guardian Nanny Circle", "slug": "nanny-circle", "domain": "nannycircle.com",
                "accounts": [
                    {"name": "The Johnson Family", "industry": "Personal", "role": "Nanny"},
                    {"name": "The Martinez Family", "industry": "Personal", "role": "Nanny"},
                    {"name": "The Chen Family", "industry": "Personal", "role": "Nanny"},
                    {"name": "The Patel Family", "industry": "Personal", "role": "Nanny"}
                ]
            },
            {
                "name": "Private Home Tutor", "slug": "home-tutor", "domain": "hometutor.com",
                "accounts": [
                    {"name": "The Anderson Family", "industry": "Personal", "role": "Tutor"},
                    {"name": "The Williams Family", "industry": "Personal", "role": "Tutor"},
                    {"name": "The Brown Family", "industry": "Personal", "role": "Tutor"},
                    {"name": "The Davis Family", "industry": "Personal", "role": "Tutor"}
                ]
            }
        ]
    }
    
    total_tenants = 0
    total_accounts = 0
    total_positions = 0
    
    for model_name, tenants in models.items():
        print(f"\n{model_name} Model:")
        for t_data in tenants:
            # Create Tenant
            tenant = {
                "name": t_data['name'],
                "slug": t_data['slug'],
                "domain": t_data['domain'],
                "subscription_tier": "enterprise" if model_name == "B2B" else "pro",
                "settings": {"model": model_name}
            }
            res = supabase.table('tenants').upsert(tenant, on_conflict='slug').execute()
            if res.data:
                t_id = res.data[0]['id']
                total_tenants += 1
                print(f"  ✓ Tenant: {t_data['name']}")
                
                # Create 4 Accounts per Tenant
                for acc_data in t_data['accounts']:
                    account = {
                        "tenant_id": t_id,
                        "name": acc_data['name'],
                        "industry": acc_data['industry']
                    }
                    acc_res = supabase.table('accounts').insert(account).execute()
                    if acc_res.data:
                        a_id = acc_res.data[0]['id']
                        total_accounts += 1
                        print(f"    ✓ Account: {acc_data['name']}")
                        
                        # Create 8 Positions per Account
                        role_slug = acc_data['role'].lower().replace(' ', '_')
                        role_id = role_map.get(role_slug)
                        
                        if role_id and acc_data['role'] in POSITION_TEMPLATES:
                            position_titles = POSITION_TEMPLATES[acc_data['role']]
                            for pos_title in position_titles:
                                pos = {
                                    "account_id": a_id,
                                    "role_template_id": role_id,
                                    "title": f"{pos_title} at {acc_data['name']}",
                                    "description": f"Join {acc_data['name']} as a {pos_title}"
                                }
                                supabase.table('positions').insert(pos).execute()
                                total_positions += 1
                            print(f"      ✓ Created 8 positions")
    
    print(f"\n{'='*60}")
    print(f"✅ Demo Data Seeding Complete!")
    print(f"{'='*60}")
    print(f"  Tenants:   {total_tenants}/6")
    print(f"  Accounts:  {total_accounts}/24")
    print(f"  Positions: {total_positions}/192")
    print(f"{'='*60}")

if __name__ == "__main__":
    clear_existing_data()
    seed_demo_data()
