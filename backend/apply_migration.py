import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('backend/.env')

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
supabase = create_client(url, key)

sql = """
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS org_head TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS account_head TEXT;
"""

print(f"Attempting migration on {url}...")
try:
    # Most Supabase projects don't have this, but worth a shot
    supabase.rpc('exec_sql', {'query': sql}).execute()
    print("✅ Migration successful via RPC.")
except Exception as e:
    print(f"❌ RPC Migration failed: {e}")
    print("Please manually run the following SQL in your Supabase SQL Editor:")
    print(sql)
