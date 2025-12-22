import sys
sys.path.insert(0, '.')
from supabase_config import supabase_admin

print("Fetching all tables from Supabase...\n")

# Get all tables from information_schema
query = """
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
"""

result = supabase_admin.rpc('exec_sql', {'query': query}).execute()

if result.data:
    print(f"Found {len(result.data)} tables:\n")
    for table in result.data:
        print(f"  - {table['table_name']} ({table['column_count']} columns)")
else:
    # Fallback: try to query each known table
    known_tables = [
        'profiles', 'tenants', 'accounts', 'positions', 'interviews',
        'admin_access_requests', 'admin_audit_log', 'user_account_assignments',
        'interview_sessions', 'feedback', 'candidates', 'questions'
    ]
    
    print("Using fallback method to check tables:\n")
    existing_tables = []
    
    for table_name in known_tables:
        try:
            result = supabase_admin.table(table_name).select('*', count='exact').limit(0).execute()
            existing_tables.append(table_name)
            print(f"  ✓ {table_name}")
        except:
            pass
    
    print(f"\nTotal: {len(existing_tables)} tables found")
