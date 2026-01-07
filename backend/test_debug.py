import asyncio
import os
import sys
from dotenv import load_dotenv

load_dotenv()

# Ensure backend dir is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.auto_doc import AutoDocService

async def main():
    print("Testing AutoDocService...")
    try:
        service = AutoDocService()
        # Scan 'app/services' as a small test
        root_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app", "services")
        print(f"Scanning {root_dir}")
        res = await service.run_scan(root_dir)
        print("Result:", res)
    except Exception as e:
        print("Error:", e)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
