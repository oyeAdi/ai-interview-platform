import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load credentials from backend/.env
load_dotenv('backend/.env')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def list_tables():
    # Since we can't easily list tables without RPC or direct SQL, 
    # and the Python client doesn't expose it easily, 
    # we'll check the ones we suspect exist.
    suspected_tables = [
        'tenants', 'organizations', 'accounts', 'positions', 
        'requirements', 'profiles', 'organization_members',
        'admin_access_requests', 'interview_sessions'
    ]
    
    print("Checking suspected tables:")
    for table in suspected_tables:
        try:
            # Try to get count or 1 row
            res = supabase.table(table).select("count", count="exact").limit(1).execute()
            print(f"✅ Table exists: {table} (Rows: {res.count if hasattr(res, 'count') else '?'})")
            
            # Show columns if possible
            row_res = supabase.table(table).select("*").limit(1).execute()
            if row_res.data:
                print(f"   Columns: {list(row_res.data[0].keys())}")
            else:
                print("   Columns: (Table is empty)")
        except Exception as e:
            if "does not exist" in str(e) or "404" in str(e):
                print(f"❌ Table DOES NOT exist: {table}")
            else:
                print(f"⚠️ Error checking {table}: {e}")

if __name__ == "__main__":
    list_tables()
