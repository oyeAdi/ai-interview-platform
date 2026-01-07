import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('backend/.env')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def inspect():
    tables = ['organizations', 'accounts', 'requirements', 'profiles', 'organization_members']
    for table in tables:
        print(f"\n--- Table: {table} ---")
        try:
            res = supabase.table(table).select("*").limit(1).execute()
            if res.data:
                for col in res.data[0].keys():
                    print(f"Col: {col}")
            else:
                print("Table is empty. Cannot determine columns via select *.")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    inspect()
