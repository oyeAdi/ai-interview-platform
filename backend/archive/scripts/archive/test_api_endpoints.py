"""
Quick diagnostic to check if the API is responding correctly
"""
import requests
import json

# Test user ID (aditya_raj@epam.com)
USER_ID = "5fdf1ac7-af0d-4fd2-a1c4-f6cd9528ac70"

print("=== Testing Super Admin API Endpoints ===\n")

# Test 1: Stats endpoint
print("1. Testing /api/super-admin/stats")
try:
    response = requests.get(
        'http://localhost:8000/api/super-admin/stats',
        headers={'X-User-ID': USER_ID}
    )
    print(f"   Status: {response.status_code}")
    if response.ok:
        data = response.json()
        print(f"   Response: {json.dumps(data, indent=2)}")
    else:
        print(f"   Error: {response.text}")
except Exception as e:
    print(f"   ✗ Connection failed: {e}")
print()

# Test 2: Tenants endpoint
print("2. Testing /api/super-admin/tenants")
try:
    response = requests.get(
        'http://localhost:8000/api/super-admin/tenants',
        headers={'X-User-ID': USER_ID}
    )
    print(f"   Status: {response.status_code}")
    if response.ok:
        data = response.json()
        print(f"   Tenants count: {len(data.get('tenants', []))}")
        print(f"   First 3 tenants:")
        for t in data.get('tenants', [])[:3]:
            print(f"     - {t['name']} ({t['slug']})")
    else:
        print(f"   Error: {response.text}")
except Exception as e:
    print(f"   ✗ Connection failed: {e}")
print()

# Test 3: Users endpoint
print("3. Testing /api/super-admin/users")
try:
    response = requests.get(
        'http://localhost:8000/api/super-admin/users',
        headers={'X-User-ID': USER_ID}
    )
    print(f"   Status: {response.status_code}")
    if response.ok:
        data = response.json()
        print(f"   Users count: {len(data.get('users', []))}")
    else:
        print(f"   Error: {response.text}")
except Exception as e:
    print(f"   ✗ Connection failed: {e}")

print("\n=== Diagnostic Complete ===")
