
import asyncio
import os
import sys

# Add backend to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.auto_doc import AutoDocService

async def main():
    print("Initializing AutoDocService for Ingestion...")
    try:
        service = AutoDocService()
        
        # Calculate root dir (backend)
        root_dir = os.path.dirname(os.path.abspath(__file__))
        print(f"Scanning directory: {root_dir}")
        print("Starting ingestion of up to 20 KEY files...")
        
        # Ingest 20 files to populate the wiki
        docs = await service.run_scan(root_dir, limit=20)
        
        print(f"Ingestion complete. {len(docs)} files documented.")
        print(f"Files: {docs}")
        
    except Exception as e:
        print(f"ERROR during ingestion: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
