import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.supabase_config import supabase_admin

def check_wiki_data():
    """Quick check to see if wiki entries exist in the database."""
    try:
        result = supabase_admin.table("learning_repository").select("id, pattern, category").limit(5).execute()
        
        print(f"Found {len(result.data)} entries in learning_repository:")
        for entry in result.data:
            print(f"  - {entry.get('pattern')} (Category: {entry.get('category')})")
        
        return len(result.data)
    except Exception as e:
        print(f"Error querying database: {e}")
        import traceback
        traceback.print_exc()
        return 0

if __name__ == "__main__":
    count = check_wiki_data()
    print(f"\nTotal entries: {count}")
