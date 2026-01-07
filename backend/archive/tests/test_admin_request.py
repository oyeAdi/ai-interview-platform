import requests
import json

def test_admin_request():
    url = "http://localhost:8000/api/admin/public/admin-request"
    payload = {
        "email": "test-admin@example.com",
        "full_name": "Test Administrator",
        "reason": "Testing the diagnostic script."
    }
    
    print(f"Testing POST {url}...")
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        print("Response Body:")
        print(json.dumps(response.json(), indent=2))
        
        if response.status_code == 200:
            print("\n✅ Success! The backend and database are working correctly.")
        else:
            print(f"\n❌ Failed! Backend returned an error.")
            
    except Exception as e:
        print(f"\n❌ Error connecting to server: {e}")
        print("Is the backend running on http://localhost:8000?")

if __name__ == "__main__":
    test_admin_request()
