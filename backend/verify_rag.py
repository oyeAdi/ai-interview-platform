import requests
import json
import time

def test_ask():
    print("Testing DeepWiki RAG Endpoint...")
    
    url = "http://localhost:8000/api/wiki/ask"
    payload = {
        "question": "What is the SwarmOrchestrator?"
    }
    
    try:
        start = time.time()
        res = requests.post(url, json=payload)
        duration = time.time() - start
        
        if res.status_code == 200:
            data = res.json()
            print(f"✅ Status 200 OK ({duration:.2f}s)")
            print(f"Source: {data.get('source')}")
            print(f"Context Refs: {data.get('code_refs')}")
            print(f"Answer Snippet: {data.get('answer')[:100]}...")
            
            if data.get('source') == 'rag_generation' and data.get('code_refs'):
                print("✅ RAG Verified: Context was used.")
            elif data.get('source') == 'cache':
                print("✅ Cache Verified: Returned stored logic.")
            else:
                print("⚠️ Warning: Source was", data.get('source'))
                
        else:
            print(f"❌ Failed: {res.status_code}")
            print(res.text)
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_ask()
