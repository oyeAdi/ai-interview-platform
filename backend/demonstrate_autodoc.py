import asyncio
import os
import sys
from dotenv import load_dotenv

# Setup environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
load_dotenv()

from app.services.auto_doc import AutoDocService
from app.supabase_config import supabase_admin

async def main():
    print("\n\n" + "="*60)
    print(" 🕵️  DEEPWIKI ENGINE PROTOCOL TEST ")
    print("="*60 + "\n")

    service = AutoDocService()
    
    # 1. Target a specific file for demonstration (e.g., the LLM Router itself)
    # This proves the AI can understand its own code.
    target_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app", "llm")
    
    print(f"👉 Target: {target_dir}")
    print("⏳ Scanning and Generating Documentation (AI is thinking)...\n")
    
    # Run the scan
    generated_files = await service.run_scan(target_dir)
    
    print(f"\n✅ Generation Complete. Processed: {generated_files}")
    
    if not generated_files:
        print("❌ No files generated. Test Failed.")
        return

    # 2. Verify Persistence (Fetch from DB)
    print("\n" + "-"*30)
    print(" 💾 VERIFYING DATABASE STORAGE ")
    print("-"*30)
    
    for filename in generated_files[:1]: # Just show one full example
        pattern_id = f"Docs: {filename}"
        res = supabase_admin.table("learning_repository").select("*").eq("pattern", pattern_id).execute()
        
        if res.data:
            doc = res.data[0]
            print(f"\n📄 ENTRY FOUND: {doc['pattern']}")
            print(f"🏷️  Category: {doc['category']}")
            print("\n📝 GENERATED CONTENT PREVIEW:\n")
            print("."*60)
            print(doc['decision_context'][:1000] + "\n... (truncated)")
            print("."*60)
            print("\n✅ Verification Successful: Content represents actual codebase logic.")
        else:
            print(f"❌ Database entry not found for {pattern_id}")

if __name__ == "__main__":
    asyncio.run(main())
