"""
Skill Category Mapper - Maps skills to question categories dynamically
Uses LLM for unknown skills and maintains a cache
"""

import json
import os
from typing import List, Dict
from pathlib import Path

class SkillCategoryMapper:
    def __init__(self):
        self.cache_file = Path(__file__).parent.parent / "models" / "skills_categories.json"
        self.cache = self.load_cache()
    
    def load_cache(self) -> Dict[str, str]:
        """Load skill-to-category mappings from JSON file"""
        if self.cache_file.exists():
            with open(self.cache_file, 'r') as f:
                return json.load(f)
        return {}
    
    def save_cache(self):
        """Save updated mappings to JSON file"""
        with open(self.cache_file, 'w') as f:
            json.dump(self.cache, f, indent=2)
    
    def map_to_categories(self, skills: List, llm_client=None) -> Dict[str, List]:
        """
        Map skills to categories
        skills can be: List[str] OR List[Dict] with {name, proficiency, type}
        Returns: {"category_name": [skill_objects]}
        """
        category_map = {}
        unknown_skills = []
        
        # Check cache first
        for skill in skills:
            # Handle both string and object formats
            if isinstance(skill, dict):
                skill_name = skill['name']
                skill_obj = skill
            else:
                skill_name = skill
                skill_obj = skill
            
            skill_lower = skill_name.lower().replace(' ', '_')
            if skill_lower in self.cache:
                category = self.cache[skill_lower]
                if category not in category_map:
                    category_map[category] = []
                category_map[category].append(skill_obj)
            else:
                unknown_skills.append(skill_name)
        
        # Ask LLM for unknown skills
        if unknown_skills and llm_client:
            new_mappings = self.ask_llm_for_mappings(unknown_skills, llm_client)
            for skill_name, category in new_mappings.items():
                skill_lower = skill_name.lower().replace(' ', '_')
                self.cache[skill_lower] = category
                if category not in category_map:
                    category_map[category] = []
                
                # Find the original skill object
                for skill in skills:
                    if isinstance(skill, dict) and skill['name'] == skill_name:
                        category_map[category].append(skill)
                        break
                    elif skill == skill_name:
                        category_map[category].append(skill)
                        break
            
            # Save updated cache
            self.save_cache()
        
        return category_map
    
    def ask_llm_for_mappings(self, skills: List[str], llm_client) -> Dict[str, str]:
        """
        Ask LLM to map unknown skills to categories
        """
        prompt = f"""Map these skills to appropriate question categories.

Skills: {', '.join(skills)}

Common categories:
- technical: Programming, coding, algorithms
- system_design: Architecture, scalability
- behavioral: Soft skills, leadership, communication
- hr_management: Recruitment, HR policies
- product_management: Product strategy, metrics
- problem_solving: Analytical thinking
- sales: Sales techniques
- customer_service: Customer interaction

Return ONLY a JSON object mapping each skill to its category:
{{"skill_name": "category_name"}}
"""
        
        response = llm_client.model.generate_content(prompt)
        # Parse JSON from response
        import re
        json_match = re.search(r'\{[^}]+\}', response.text)
        if json_match:
            return json.loads(json_match.group())
        return {}
