import os
import sys
import redis
import json
from datetime import datetime

# Adjust path to import from app if needed
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# We can mimic get_redis_client logic or just connect directly
# Ideally load envs, but defaults are often localhost:6379 for dev
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)

def main():
    try:
        r = redis.Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            db=REDIS_DB,
            password=REDIS_PASSWORD,
            decode_responses=True
        )
        r.ping()
        print(f"Connected to Redis at {REDIS_HOST}:{REDIS_PORT}")
    except Exception as e:
        print(f"Failed to connect to Redis: {e}")
        return

    # List session keys
    print("\nScanning for 'session:*' keys...")
    keys = r.keys("session:*")
    
    if not keys:
        print("No active sessions found.")
        return

    print(f"Found {len(keys)} session(s):")
    for i, key in enumerate(keys):
        print(f"{i + 1}. {key}")

    # Ask user to pick one or view all (for script simplicity, we'll just check if there's 1 or list summary)
    # We'll dump the first 5 for now to show content
    print("\n--- Session details (showing up to 5) ---")
    for key in keys[:5]:
        print(f"\n[Key: {key}]")
        try:
            val = r.get(key)
            if val:
                data = json.loads(val)
                # Pretty print, but maybe truncate large history
                if "context" in data and "history" in data["context"]:
                    hist_len = len(data["context"]["history"])
                    data["context"]["history"] = f"<List of {hist_len} entries>" 
                
                print(json.dumps(data, indent=2))
            else:
                print("<Empty>")
        except Exception as e:
            print(f"Error reading key: {e}")

if __name__ == "__main__":
    main()
