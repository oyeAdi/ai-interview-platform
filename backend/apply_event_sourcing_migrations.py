"""Migration script for SwarmHire Event Sourcing (Phase 2)."""
import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent
sys.path.append(str(backend_path))

try:
    from supabase_config import supabase_admin
    print("Supabase admin client initialized.")
except ImportError as e:
    print(f"Error importing supabase_config: {e}")
    sys.exit(1)

# Read the SQL from file
MIGRATION_FILE = Path(__file__).parent.parent / "migrations" / "008_event_sourcing.sql"

def apply_migration():
    if not MIGRATION_FILE.exists():
        print(f"Migration file not found: {MIGRATION_FILE}")
        return

    with open(MIGRATION_FILE, 'r', encoding='utf-8') as f:
        sql = f.read()

    print(f"Applying Event Sourcing migrations from {MIGRATION_FILE.name}...")
    
    # Try to execute via RPC
    try:
        supabase_admin.rpc('exec_sql', {'sql': sql}).execute()
        print("Migration applied successfully via RPC.")
    except Exception as e:
        print(f"RPC execution failed: {e}")
        print("\nIMPORTANT: Please run the contents of migrations/008_event_sourcing.sql manually in your Supabase SQL Editor.")
        sys.exit(1)

if __name__ == "__main__":
    apply_migration()
