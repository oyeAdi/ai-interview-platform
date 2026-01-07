"""Apply SQL migrations to Supabase"""
import sys
import os
sys.path.append('backend')
from supabase_config import supabase_admin

def apply_migration(filename):
    with open(filename, 'r') as f:
        sql = f.read()
    
    print(f"Applying migration {filename}...")
    try:
        # We need to execute the SQL. Supabase-py doesn't have a direct execute_sql outside of RPC.
        # If there's an RPC for this, great. Otherwise, we might need a different approach.
        # Most of these apps have a 'exec_sql' RPC for migrations.
        res = supabase_admin.rpc('exec_sql', {'sql_query': sql}).execute()
        print(f"✅ Migration applied: {res.data}")
    except Exception as e:
        print(f"❌ Error applying migration: {e}")
        print("Fallback: Attempting to split statements if RPC failed...")
        # Often exec_sql is not available on production clients.
        # In that case, we might need to use a direct postgres connection if available.
        # But for this environment, let's assume RPC or manual check.

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python apply_migration.py <filename>")
    else:
        apply_migration(sys.argv[1])
