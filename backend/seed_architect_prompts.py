"""
Seed Prompt Templates to Supabase.
Reads JSON templates from backend/prompts/templates and upserts them into prompt_templates table.
"""

import os
import json
from supabase_config import supabase_admin

def seed_prompts():
    template_dir = "backend/prompts/templates/question_generation"
    
    templates = [
        "personalized.json",
        "personalized_coding.json"
    ]
    
    for filename in templates:
        filepath = os.path.join(template_dir, filename)
        if not os.path.exists(filepath):
            print(f"Skipping {filename}, file not found.")
            continue
            
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        # Prepare for Supabase (mapping camelCase to snake_case if needed, but the model matches)
        prompt_record = {
            "id": data["id"],
            "name": data["name"],
            "category": data["category"],
            "variant": data["variant"],
            "version": data["version"],
            "template": data["template"],
            "variables": data["variables"],
            "generation_config": data["generation_config"],
            "knobs": data["knobs"],
            "author": data.get("author", "system"),
            "status": "active"
        }
        
        try:
            res = supabase_admin.table("prompt_templates").upsert(prompt_record).execute()
            if res.data:
                print(f"Successfully seeded/updated prompt: {data['id']}")
            else:
                print(f"Failed to seed prompt: {data['id']}")
        except Exception as e:
            print(f"Error seeding {data['id']}: {e}")

if __name__ == "__main__":
    seed_prompts()
