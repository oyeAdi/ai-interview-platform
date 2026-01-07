import requests
import time

def test_api():
    """Test the wiki API endpoint with a timeout."""
    url = "http://localhost:8000/api/wiki/entries?limit=5"
    
    print(f"Testing: {url}")
    print("Waiting for response (10s timeout)...")
    
    try:
        start = time.time()
        response = requests.get(url, timeout=10)
        elapsed = time.time() - start
        
        print(f"\n✓ Response received in {elapsed:.2f}s")
        print(f"Status Code: {response.status_code}")
        print(f"Response Length: {len(response.text)} bytes")
        
        if response.status_code == 200:
            data = response.json()
            entries = data.get('entries', [])
            print(f"\nEntries found: {len(entries)}")
            for i, entry in enumerate(entries[:3], 1):
                print(f"{i}. {entry.get('pattern')} (Category: {entry.get('category')})")
        else:
            print(f"Error: {response.text}")
            
    except requests.Timeout:
        print("\n✗ Request timed out after 10 seconds")
    except requests.ConnectionError:
        print("\n✗ Could not connect to backend")
    except Exception as e:
        print(f"\n✗ Error: {e}")

if __name__ == "__main__":
    test_api()
