import requests
import json

BASE_URL = "http://localhost:8000/api/super-admin"
# Aditya Raj's ID from profiles table
USER_ID = "3c7b1084-2fb7-422c-a40c-7d3c36770176"

HEADERS = {
    "X-User-ID": USER_ID
}

def test_endpoint(path):
    url = f"{BASE_URL}{path}"
    print(f"\nTesting {url}...")
    try:
        response = requests.get(url, headers=HEADERS)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Data Sample: {json.dumps(data, indent=2)[:500]}...")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    # Check health first
    health_url = "http://localhost:8000/api/health"
    print(f"Testing {health_url}...")
    try:
        res = requests.get(health_url)
        print(f"Status: {res.status_code}, Data: {res.text}")
    except Exception as e:
        print(f"Health failed: {e}")

    test_endpoint("/stats")
    test_endpoint("/tenants")
    test_endpoint("/accounts")
    test_endpoint("/positions")
    test_endpoint("/users")
