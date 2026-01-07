
import os
import sys
from dotenv import load_dotenv
from supabase import create_client

# Add backend to path to find .env or config if needed
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Try to load from .env file in root or backend
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(env_path)

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    sys.exit(1)

supabase = create_client(url, key)

try:
    # Try to select 1 row from learning_repository
    # If table doesn't exist, this will throw a specific error
    res = supabase.table("learning_repository").select("id").limit(1).execute()
    print("Table 'learning_repository' exists.")
except Exception as e:
    print(f"Error checking table: {e}")
    if "relation" in str(e) and "does not exist" in str(e):
        print("Table 'learning_repository' DOES NOT exist.")
    else:
        print("Table might exist but query failed.")
