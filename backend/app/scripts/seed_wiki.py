
import os
import re
import sys
from datetime import datetime
from app.supabase_config import supabase_admin

# Files to seed
FILES_TO_SEED = [
    {
        "path": "../../../SIMPLIFIED_CORE.md", 
        "category": "Core Concept",
        "default_tag": "vision"
    },
    {
        "path": "../../archive/root_doc/ARCHITECTURE.md", 
        "category": "Architecture", 
        "default_tag": "technical"
    }
]

def parse_markdown(file_path):
    """
    Parses a markdown file into chunks based on headers.
    Returns list of dicts: { "pattern": str, "context": str }
    """
    try:
        abs_path = os.path.join(os.path.dirname(__file__), file_path)
        with open(abs_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"File not found: {file_path}")
        return []

    # Regex to find headers and content
    # Matches: named group 'header' (## Toppic) and 'content' (everything until next ##)
    chunks = []
    
    # Simple splitting by header lines
    # valid headers: #, ##, ###
    sections = re.split(r'(^#{1,3}\s+.+$)', content, flags=re.MULTILINE)
    
    current_header = "Introduction"
    current_content = []
    
    for section in sections:
        section = section.strip()
        if not section:
            continue
            
        if re.match(r'^#{1,3}\s+', section):
            # Save previous section if exists
            if current_content:
                chunks.append({
                    "pattern": current_header,
                    "context": "\n".join(current_content)
                })
            
            # Start new section
            # Remove # chars and emojis
            clean_header = re.sub(r'[#]+', '', section).strip()
            # Optional: remove emojis if basic
            current_header = clean_header
            current_content = []
        else:
            current_content.append(section)
            
    # Add last section
    if current_content:
        chunks.append({
            "pattern": current_header,
            "context": "\n".join(current_content)
        })
        
    return chunks

def seed():
    print("Starting Knowledge Injection...")
    
    total_added = 0
    
    for file_info in FILES_TO_SEED:
        print(f"Processing {file_info['path']}...")
        chunks = parse_markdown(file_info['path'])
        
        for chunk in chunks:
            pattern = chunk['pattern']
            context = chunk['context']
            
            if len(context) < 10: # Skip empty/tiny sections
                continue
                
            # Create a "Learning" entry
            entry = {
                "learning_id": f"seed_{datetime.now().timestamp()}_{total_added}",
                "pattern": pattern, 
                "category": file_info['category'],
                # "subcategory": "General", # Removed due to schema mismatch
                # "tags": [file_info['default_tag'], "official-docs"], # Removed
                "decision_context": context,
                "confidence_score": 1.0, 
                "status": "active"
            }
            
            try:
                # Upsert based on pattern? Or just insert.
                # Just insert for now, we can clear table manually if needed or use unique constraint
                supabase_admin.table("learning_repository").insert(entry).execute()
                print(f"  [+] Added: {pattern[:50]}...")
                total_added += 1
            except Exception as e:
                print(f"  [-] Failed to add {pattern}: {e}")

    print(f"\nKnowledge Injection Complete. Added {total_added} entries.")

if __name__ == "__main__":
    # Add parent dir to path so we can import 'app'
    sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    seed()
