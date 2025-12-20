
import os
import requests
import json
from dotenv import load_dotenv

# Load env from .env.supabase in root
load_dotenv('.env.supabase')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("Error: Missing Supabase credentials in .env.supabase")
    exit(1)

def seed_personas():
    print("Starting persona seeding via REST API...")
    
    url = f"{SUPABASE_URL}/rest/v1/tenants"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }
    
    personas = [
        # B2B: Enterprise Hub
        {
            "name": "Google Talent Acquisition",
            "slug": "google",
            "settings": {"industry": "Tech", "branding": {"primary_color": "#4285F4"}},
            "subscription_tier": "enterprise"
        },
        {
            "name": "EPAM Systems",
            "slug": "epam",
            "settings": {"industry": "Software Engineering Services", "branding": {"primary_color": "#76BC21"}},
            "subscription_tier": "enterprise"
        },
        # B2C: Expert Studio
        {
            "name": "System Design Coach",
            "slug": "system-design-coach",
            "settings": {"expert_type": "Technical", "focus": "Architecture", "persona": "B2C"},
            "subscription_tier": "professional"
        },
        {
            "name": "Soft Skills Expert",
            "slug": "soft-skills-expert",
            "settings": {"expert_type": "Behavioral", "focus": "Communication", "persona": "B2C"},
            "subscription_tier": "professional"
        },
        # C2C: Private Circle
        {
            "name": "Nanny Circle",
            "slug": "nanny-circle",
            "settings": {"safe_hiring": True, "context": "Home", "persona": "C2C"},
            "subscription_tier": "standard"
        },
        {
            "name": "Home Tutor Network",
            "slug": "home-tutor",
            "settings": {"safe_hiring": True, "context": "Education", "persona": "C2C"},
            "subscription_tier": "standard"
        }
    ]
    
    for persona in personas:
        print(f"Upserting tenant: {persona['slug']}")
        response = requests.post(url, headers=headers, data=json.dumps(persona))
        if response.status_code in [200, 201]:
            print(f"Successfully upserted {persona['slug']}")
        else:
            print(f"Error upserting {persona['slug']}: {response.status_code} - {response.text}")

if __name__ == "__main__":
    seed_personas()
    print("Seeding complete.")
