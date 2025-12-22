import sys
sys.path.insert(0, '.')
from supabase_config import supabase_admin

# Check admin access requests
print("Checking admin access requests for shreya...")
result = supabase_admin.table('admin_access_requests').select('*').ilike('email', '%shreya%').execute()

if result.data:
    print(f"\nFound {len(result.data)} request(s):")
    for req in result.data:
        print(f"\nEmail: {req['email']}")
        print(f"Full Name: {req.get('full_name')}")
        print(f"Status: {req.get('status')}")
        print(f"Created: {req.get('created_at')}")
        print(f"Request ID: {req['id']}")
else:
    print("No requests found matching 'shreya'")
