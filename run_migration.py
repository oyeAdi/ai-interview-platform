"""
Run Supabase Database Migrations
Executes the initial schema migration for SwarmHire multi-tenant database
"""

import os
from supabase import create_client
from dotenv import load_dotenv

# Load Supabase configuration
load_dotenv('.env.supabase')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

# Create admin client (bypasses RLS)
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def run_migration(sql_file_path: str):
    """
    Execute SQL migration file
    
    Args:
        sql_file_path: Path to SQL file
    """
    print(f"📂 Reading migration file: {sql_file_path}")
    
    with open(sql_file_path, 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    # Split by statement (simple approach - split on semicolons)
    statements = [s.strip() for s in sql_content.split(';') if s.strip() and not s.strip().startswith('--')]
    
    print(f"📊 Found {len(statements)} SQL statements to execute\n")
    
    success_count = 0
    error_count = 0
    
    for i, statement in enumerate(statements, 1):
        # Skip comments and empty statements
        if not statement or statement.startswith('--'):
            continue
            
        try:
            print(f"⏳ [{i}/{len(statements)}] Executing statement...")
            
            # Execute via RPC (Supabase doesn't expose direct SQL execution)
            # We'll use the SQL Editor approach instead
            result = supabase.rpc('exec_sql', {'sql': statement}).execute()
            
            print(f"✅ [{i}/{len(statements)}] Success")
            success_count += 1
            
        except Exception as e:
            print(f"❌ [{i}/{len(statements)}] Error: {str(e)}")
            error_count += 1
            
            # Show the statement that failed
            print(f"   Statement: {statement[:100]}...")
            print()
    
    print(f"\n{'='*60}")
    print(f"✅ Successful: {success_count}")
    print(f"❌ Failed: {error_count}")
    print(f"{'='*60}\n")

def verify_tables():
    """Verify that tables were created successfully"""
    print("🔍 Verifying table creation...\n")
    
    tables = [
        'tenants',
        'users',
        'job_descriptions',
        'resumes',
        'interviews',
        'questions',
        'agent_logs',
        'hitl_events',
        'observer_learning_events'
    ]
    
    for table in tables:
        try:
            result = supabase.table(table).select('count', count='exact').execute()
            count = result.count
            print(f"✅ {table}: {count} rows")
        except Exception as e:
            print(f"❌ {table}: Error - {str(e)}")
    
    print()

def check_tenants():
    """Check if EPAM and Google tenants were seeded"""
    print("🏢 Checking tenant data...\n")
    
    try:
        result = supabase.table('tenants').select('*').execute()
        
        if result.data:
            for tenant in result.data:
                print(f"✅ Tenant: {tenant['name']} ({tenant['slug']})")
        else:
            print("⚠️  No tenants found - seed data may not have been inserted")
    except Exception as e:
        print(f"❌ Error checking tenants: {str(e)}")
    
    print()

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 SwarmHire Database Migration")
    print("="*60 + "\n")
    
    # Note: Supabase doesn't allow direct SQL execution via client library
    # You need to run the migration in Supabase SQL Editor
    print("⚠️  IMPORTANT: Supabase client library doesn't support direct SQL execution")
    print("📋 Please follow these steps:\n")
    project_id = os.getenv('SUPABASE_PROJECT_ID', 'bhqvzyqwkyszeaoonvok')
    print(f"1. Go to: https://supabase.com/dashboard/project/{project_id}/sql/new")
    print("2. Copy the contents of: migrations/001_initial_schema.sql")
    print("3. Paste into the SQL Editor")
    print("4. Click 'Run' button")
    print("5. Come back here and run this script again to verify\n")
    
    input("Press Enter after you've run the migration in Supabase SQL Editor...")
    
    print("\n" + "="*60)
    print("🔍 Verification")
    print("="*60 + "\n")
    
    verify_tables()
    check_tenants()
    
    print("✅ Migration verification complete!")
    print("\nNext steps:")
    print("1. Update backend to use Supabase instead of JSON files")
    print("2. Test multi-tenancy with EPAM and Google")
    print("3. Migrate existing interview data\n")
