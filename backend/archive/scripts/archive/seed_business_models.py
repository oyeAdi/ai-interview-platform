"""
Seed the new RBAC schema with business model tenants, accounts, and positions.
Correctly handles the new Tenant > Account > Position hierarchy.
"""
import os
import sys
from supabase import create_client
from dotenv import load_dotenv

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Load environment
env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env.supabase')
load_dotenv(env_path)

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("Error: Missing Supabase credentials in .env.supabase")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def seed_roles():
    print("Seeding role categories and templates...")
    
    # 1. Seed Categories
    categories = [
        {"name": "Software Engineering", "slug": "software_engineering", "description": "Technical roles for developers, architects, and engineers"},
        {"name": "Product & Design", "slug": "product_design", "description": "Product management and UX/UI design roles"},
        {"name": "Coaching & Mentoring", "slug": "coaching", "description": "Professional coaching and mock interview roles"},
        {"name": "Domestic Services", "slug": "domestic", "description": "Nannies, caregivers, and tutors"}
    ]
    
    cat_map = {}
    for cat in categories:
        res = supabase.table('role_categories').upsert(cat, on_conflict='slug').execute()
        if res.data:
            cat_map[cat['slug']] = res.data[0]['id']
            print(f"  ✓ Category: {cat['name']}")

    # 2. Seed Templates
    templates = [
        {"category_id": cat_map['software_engineering'], "name": "Backend Engineer", "slug": "backend_engineer", "description": "Focus on server-side logic and APIs"},
        {"category_id": cat_map['software_engineering'], "name": "Frontend Engineer", "slug": "frontend_engineer", "description": "Focus on user interface and experience"},
        {"category_id": cat_map['product_design'], "name": "Product Manager", "slug": "product_manager", "description": "Focus on strategy and delivery"},
        {"category_id": cat_map['coaching'], "name": "System Design Coach", "slug": "system_design_coach", "description": "Expert in distributed systems coaching"},
        {"category_id": cat_map['domestic'], "name": "Nanny", "slug": "nanny", "description": "Professional childcare services"},
        {"category_id": cat_map['domestic'], "name": "Tutor", "slug": "tutor", "description": "Private academic tutoring"}
    ]
    
    temp_map = {}
    for temp in templates:
        res = supabase.table('role_templates').upsert(temp, on_conflict='slug').execute()
        if res.data:
            temp_map[temp['slug']] = res.data[0]['id']
            print(f"  ✓ Template: {temp['name']}")
            
    return temp_map

def seed_business_models(role_map):
    print("\nSeeding business model tenants...")
    
    models = {
        "B2B": [
            {"name": "EPAM Systems", "slug": "epam", "domain": "epam.com", "accounts": [
                {"name": "Uber", "industry": "Mobility", "positions": ["Backend Engineer", "Frontend Engineer"]},
                {"name": "Amazon", "industry": "E-commerce", "positions": ["Backend Engineer", "Product Manager"]}
            ]},
            {"name": "Google TA", "slug": "google", "domain": "google.com", "accounts": [
                {"name": "Meta", "industry": "Social Media", "positions": ["Frontend Engineer", "Backend Engineer"]},
                {"name": "OpenAI", "industry": "AI", "positions": ["Backend Engineer", "Product Manager"]}
            ]}
        ],
        "B2C": [
            {"name": "System Design Coach", "slug": "system-design-coach", "domain": "sdcoach.com", "accounts": [
                {"name": "Senior Level Coaching", "industry": "Education", "positions": ["System Design Coach"]},
                {"name": "Mid Level Coaching", "industry": "Education", "positions": ["System Design Coach"]}
            ]},
            {"name": "Mock-Interview Pro", "slug": "mock-interview-pro", "domain": "mockpro.com", "accounts": [
                {"name": "Technical Mock", "industry": "Career Services", "positions": ["Backend Engineer"]},
                {"name": "Behavioral Mock", "industry": "Career Services", "positions": ["Product Manager"]}
            ]}
        ],
        "C2C": [
            {"name": "Guardian Nanny Circle", "slug": "nanny-circle", "domain": "nannycircle.com", "accounts": [
                {"name": "The Johnson Family", "industry": "Personal", "positions": ["Nanny"]},
                {"name": "The Martinez Family", "industry": "Personal", "positions": ["Nanny"]}
            ]},
            {"name": "Private Home Tutor", "slug": "home-tutor", "domain": "hometutor.com", "accounts": [
                {"name": "The Anderson Family", "industry": "Personal", "positions": ["Tutor"]},
                {"name": "The Williams Family", "industry": "Personal", "positions": ["Tutor"]}
            ]}
        ]
    }

    for model_name, tenants in models.items():
        print(f"\nProcessing {model_name}...")
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
                print(f"  ✓ Tenant: {t_data['name']}")
                
                # Create Accounts
                for acc_data in t_data['accounts']:
                    account = {
                        "tenant_id": t_id,
                        "name": acc_data['name'],
                        "industry": acc_data['industry']
                    }
                    acc_res = supabase.table('accounts').insert(account).execute()
                    if acc_res.data:
                        a_id = acc_res.data[0]['id']
                        print(f"    ✓ Account: {acc_data['name']}")
                        
                        # Create Positions
                        for pos_title in acc_data['positions']:
                            # Map position title to slug
                            slug = pos_title.lower().replace(' ', '_')
                            role_id = role_map.get(slug)
                            if role_id:
                                pos = {
                                    "account_id": a_id,
                                    "role_template_id": role_id,
                                    "title": f"{pos_title} for {acc_data['name']}",
                                    "description": f"Exciting {pos_title} opportunity at {acc_data['name']}"
                                }
                                supabase.table('positions').insert(pos).execute()
                                print(f"      ✓ Position: {pos_title}")

if __name__ == "__main__":
    role_map = seed_roles()
    seed_business_models(role_map)
    print("\n✅ All data restored successfully for the new RBAC schema.")
