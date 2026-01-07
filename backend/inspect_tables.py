import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('backend/.env')
s = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

def inspect(table_name):
    print(f"\n--- Inspecting {table_name} ---")
    try:
        # Get one row to see keys
        res = s.table(table_name).select('*').limit(1).execute()
        if res.data:
            print(f"Columns: {list(res.data[0].keys())}")
        else:
            # Table is empty, try to get schema via an insert that fails?
            # Or just try to select id
            print("Table empty. Trying individual selects...")
            cols = ['id', 'title', 'org_id', 'account_id', 'status', 'skills', 'created_at']
            found = []
            for col in cols:
                try:
                    s.table(table_name).select(col).limit(1).execute()
                    found.append(col)
                except:
                    pass
            print(f"Detected columns: {found}")
    except Exception as e:
        print(f"Error: {e}")

inspect('requirements')
inspect('organizations')
inspect('accounts')
inspect('profiles')
