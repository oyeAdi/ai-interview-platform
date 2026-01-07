import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load credentials from .env
load_dotenv('backend/.env')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_schema():
    # We can use the information_schema or just try to get one row from each table
    # Since we want to know the columns, querying information_schema is best
    try:
        # Query to list tables in public schema
        result = supabase.rpc('get_tables_and_columns', {}).execute()
        if result.data:
            for row in result.data:
                print(f"Table: {row['table_name']}")
                print(f"Columns: {row['columns']}")
        else:
            # Fallback if RPC doesn't exist
            print("RPC 'get_tables_and_columns' not found. Trying information_schema query...")
            query = "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name"
            # Supabase Python client doesn't support raw SQL easily unless we use postgrest features
            # Let's try to query 'tenants', 'accounts', 'positions', 'profiles' directly for structure
            tables = ['tenants', 'accounts', 'positions', 'profiles', 'admin_access_requests']
            for table in tables:
                try:
                    res = supabase.table(table).select("*").limit(1).execute()
                    if len(res.data) > 0:
                        print(f"\nTable: {table}")
                        print(f"Columns (from data): {list(res.data[0].keys())}")
                    else:
                        print(f"\nTable: {table} (Empty)")
                        # If empty, we might not see all columns if they are null
                except Exception as e:
                    print(f"Error querying table {table}: {e}")
                    
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_schema()
