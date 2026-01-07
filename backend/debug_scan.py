
import asyncio
import os
import sys

# Add backend to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.auto_doc import AutoDocService

async def main():
    print("Initializing AutoDocService...")
    try:
        service = AutoDocService()
        
        # Calculate root dir (backend)
        root_dir = os.path.dirname(os.path.abspath(__file__))
        print(f"Scanning directory: {root_dir}")
        
        await service.run_scan(root_dir)
        print("Scan completed successfully.")
        
    except Exception as e:
        print(f"ERROR during scan: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
