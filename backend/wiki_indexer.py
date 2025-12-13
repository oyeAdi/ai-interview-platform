"""
Wiki Indexer - Pre-populates the wiki with documentation for all categories.
Run manually: python -m backend.wiki_indexer
"""

import os
import json
import uuid
from datetime import datetime
from typing import Dict, List

# Index categories from WIKI_INDEX_CATEGORIES.md
WIKI_CATEGORIES = {
    "Interview Flow": [
        {
            "name": "Interview Lifecycle",
            "files": ["backend/core/interview_controller.py"],
            "description": "How interviews progress from start to end"
        },
        {
            "name": "Session Management", 
            "files": ["backend/core/interview_controller.py"],
            "description": "How interview sessions are created and managed"
        },
        {
            "name": "WebSocket Communication",
            "files": ["backend/websocket/message_handler.py"],
            "description": "Real-time message routing between candidate and admin"
        }
    ],
    "Candidate Matching": [
        {
            "name": "Match Score Algorithm",
            "files": ["backend/main.py"],
            "description": "How candidates are matched to positions"
        },
        {
            "name": "Skill Comparison",
            "files": ["backend/main.py"],
            "description": "How skills are compared between positions and candidates"
        }
    ],
    "Question Generation": [
        {
            "name": "Question Bank Structure",
            "files": ["backend/questions/python.json", "backend/questions/java.json"],
            "description": "How questions are organized and stored"
        },
        {
            "name": "Question Selection",
            "files": ["backend/core/question_manager.py"],
            "description": "How questions are selected for interviews"
        },
        {
            "name": "AI Question Generation",
            "files": ["backend/llm/gemini_client.py"],
            "description": "How AI generates follow-up questions"
        }
    ],
    "Follow-up Strategies": [
        {
            "name": "Strategy Factory",
            "files": ["backend/strategies/strategy_factory.py"],
            "description": "How follow-up strategies are selected"
        },
        {
            "name": "Depth Focused Strategy",
            "files": ["backend/strategies/depth_focused.py"],
            "description": "Deep dive strategy for weak areas"
        },
        {
            "name": "Breadth Focused Strategy",
            "files": ["backend/strategies/breadth_focused.py"],
            "description": "Strategy to cover more topics"
        }
    ],
    "Evaluation & Scoring": [
        {
            "name": "Evaluator Engine",
            "files": ["backend/evaluation/evaluator.py"],
            "description": "How responses are evaluated"
        },
        {
            "name": "Scoring Algorithms",
            "files": ["backend/evaluation/scoring_algorithms.py"],
            "description": "Scoring methods for different question types"
        }
    ],
    "Data Models": [
        {
            "name": "Organization Structure",
            "files": ["backend/models/organizations.json"],
            "description": "How organizations are structured"
        },
        {
            "name": "Account Model",
            "files": ["backend/models/accounts.json"],
            "description": "Client account data structure"
        },
        {
            "name": "Position Model",
            "files": ["backend/models/positions.json"],
            "description": "Job position data structure with interview configuration"
        }
    ],
    "Expert Mode": [
        {
            "name": "Expert Mode Flow",
            "files": ["backend/core/interview_controller.py", "backend/main.py"],
            "description": "How admin approval system works"
        },
        {
            "name": "Approve/Edit/Override",
            "files": ["backend/main.py"],
            "description": "Expert actions on follow-up questions"
        }
    ],
    "LLM Integration": [
        {
            "name": "Gemini Client",
            "files": ["backend/llm/gemini_client.py"],
            "description": "How AI models are integrated"
        },
        {
            "name": "Follow-up Generation",
            "files": ["backend/llm/gemini_client.py"],
            "description": "AI-generated interview follow-ups"
        }
    ],
    "API Endpoints": [
        {
            "name": "Organization APIs",
            "files": ["backend/main.py"],
            "description": "REST endpoints for organization management"
        },
        {
            "name": "Account CRUD",
            "files": ["backend/main.py"],
            "description": "Create, Read, Update, Delete operations for accounts"
        },
        {
            "name": "Position CRUD",
            "files": ["backend/main.py"],
            "description": "Position management REST endpoints"
        },
        {
            "name": "Interview Session APIs",
            "files": ["backend/main.py"],
            "description": "Create interview sessions and generate unique links"
        },
        {
            "name": "Wiki APIs",
            "files": ["backend/main.py"],
            "description": "Wiki search, ask, and reindex endpoints"
        }
    ],
    "Frontend Components": [
        {
            "name": "Dashboard Page",
            "files": ["frontend/src/app/page.tsx"],
            "description": "Main admin dashboard with accounts and positions"
        },
        {
            "name": "Interview Page",
            "files": ["frontend/src/app/interview/page.tsx"],
            "description": "Live interview UI for candidates and admins"
        },
        {
            "name": "Candidate View",
            "files": ["frontend/src/components/CandidateView.tsx"],
            "description": "Candidate-facing interview interface"
        },
        {
            "name": "Admin Dashboard",
            "files": ["frontend/src/components/AdminDashboard.tsx"],
            "description": "Expert controls and interview monitoring"
        },
        {
            "name": "Code Editor",
            "files": ["frontend/src/components/CodeEditor.tsx"],
            "description": "Monaco editor for coding questions"
        }
    ],
    "UI/UX Features": [
        {
            "name": "Theme Toggle",
            "files": ["frontend/src/components/ThemeToggle.tsx", "frontend/src/contexts/ThemeContext.tsx"],
            "description": "Dark/Light mode switching"
        },
        {
            "name": "EPAM Branding",
            "files": ["frontend/tailwind.config.js", "frontend/src/app/globals.css"],
            "description": "EPAM-inspired color scheme and styling"
        },
        {
            "name": "Search and Filters",
            "files": ["frontend/src/components/SearchBar.tsx", "frontend/src/components/FilterChips.tsx"],
            "description": "Reusable search and filter components"
        },
        {
            "name": "Detail Sidebars",
            "files": ["frontend/src/components/AccountDetail.tsx", "frontend/src/components/PositionDetail.tsx"],
            "description": "Inline panels for viewing and editing details"
        }
    ],
    "Logging & Analytics": [
        {
            "name": "Interview Logger",
            "files": ["backend/utils/logger.py"],
            "description": "Session logging and transcript storage"
        },
        {
            "name": "Time Metrics",
            "files": ["frontend/src/components/TimeMetrics.tsx"],
            "description": "Response time tracking and visualization"
        },
        {
            "name": "Live Scores",
            "files": ["frontend/src/components/LiveScores.tsx"],
            "description": "Real-time scoring display during interviews"
        }
    ]
}

def load_json_file(filepath: str) -> dict:
    """Load JSON file with error handling"""
    if not os.path.exists(filepath):
        return {}
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json_file(filepath: str, data: dict):
    """Save data to JSON file"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def read_file_content(filepath: str, max_lines: int = 100) -> str:
    """Read file content for context"""
    try:
        # Handle relative paths from backend directory
        if not os.path.isabs(filepath):
            base_dir = os.path.dirname(os.path.dirname(__file__))
            full_path = os.path.join(base_dir, filepath)
        else:
            full_path = filepath
            
        if not os.path.exists(full_path):
            return f"# File not found: {filepath}"
            
        with open(full_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()[:max_lines]
            return ''.join(lines)
    except Exception as e:
        return f"# Error reading {filepath}: {e}"

def generate_documentation_without_llm(entry_name: str, files: List[str], description: str) -> Dict:
    """Generate documentation entry without LLM (template-based)"""
    file_contents = []
    for f in files:
        content = read_file_content(f, max_lines=50)
        file_contents.append(f"### {f}\n{content[:500]}...")
    
    return {
        "question": f"How does {entry_name} work?",
        "answer": f"{description}\n\nThis feature is implemented in: {', '.join(files)}",
        "code_refs": files,
        "keywords": entry_name.lower().split() + description.lower().split()[:5]
    }

def index_with_llm(entry_name: str, files: List[str], description: str, category: str) -> Dict:
    """Generate documentation using LLM"""
    try:
        from llm.gemini_client import GeminiClient
        
        # Gather code context from files
        code_context = f"Entry: {entry_name}\nDescription: {description}\n\n"
        for f in files:
            content = read_file_content(f, max_lines=80)
            code_context += f"### {f}\n{content}\n\n"
        
        gemini = GeminiClient()
        result = gemini.generate_wiki_documentation(
            entry_name=entry_name,
            code_context=code_context,
            focus="business_logic"
        )
        
        return result
        
    except Exception as e:
        print(f"LLM indexing failed for {entry_name}: {e}")
        return generate_documentation_without_llm(entry_name, files, description)

def run_indexer(use_llm: bool = False, categories_to_index: List[str] = None):
    """
    Run the wiki indexer to populate documentation.
    
    Args:
        use_llm: If True, use LLM to generate rich documentation (costs API calls)
        categories_to_index: Optional list of categories to index. If None, indexes all.
    """
    print("=" * 60)
    print("Wiki Indexer - Pre-populating codebase documentation")
    print("=" * 60)
    
    # Load existing wiki
    wiki_file = os.path.join(os.path.dirname(__file__), "models", "wiki.json")
    wiki_data = load_json_file(wiki_file)
    
    if "entries" not in wiki_data:
        wiki_data["entries"] = []
    if "metadata" not in wiki_data:
        wiki_data["metadata"] = {}
    
    # Track existing entries to avoid duplicates
    existing_questions = set(e.get("question", "").lower() for e in wiki_data["entries"])
    
    entries_added = 0
    categories_processed = 0
    
    for category, entries in WIKI_CATEGORIES.items():
        # Skip if not in the filter list
        if categories_to_index and category not in categories_to_index:
            continue
            
        print(f"\nIndexing category: {category}")
        categories_processed += 1
        
        for entry in entries:
            entry_name = entry["name"]
            
            # Check for duplicate
            check_question = f"how does {entry_name.lower()} work?"
            if check_question in existing_questions:
                print(f"  - Skipping '{entry_name}' (already exists)")
                continue
            
            print(f"  - Indexing '{entry_name}'...")
            
            if use_llm:
                doc = index_with_llm(
                    entry_name=entry_name,
                    files=entry["files"],
                    description=entry["description"],
                    category=category
                )
            else:
                doc = generate_documentation_without_llm(
                    entry_name=entry_name,
                    files=entry["files"],
                    description=entry["description"]
                )
            
            # Create wiki entry
            new_entry = {
                "id": f"wiki_{uuid.uuid4().hex[:8]}",
                "question": doc.get("question", f"How does {entry_name} work?"),
                "answer": doc.get("answer", entry["description"]),
                "category": category,
                "code_refs": doc.get("code_refs", entry["files"]),
                "keywords": doc.get("keywords", []),
                "created_at": datetime.now().isoformat(),
                "auto_generated": True,
                "indexed_from": entry_name
            }
            
            wiki_data["entries"].append(new_entry)
            entries_added += 1
    
    # Update metadata
    wiki_data["metadata"]["last_indexed"] = datetime.now().isoformat()
    wiki_data["metadata"]["indexer_version"] = "1.0"
    
    # Save wiki
    save_json_file(wiki_file, wiki_data)
    
    print("\n" + "=" * 60)
    print(f"Indexing complete!")
    print(f"  Categories processed: {categories_processed}")
    print(f"  Entries added: {entries_added}")
    print(f"  Total wiki entries: {len(wiki_data['entries'])}")
    print(f"  Wiki saved to: {wiki_file}")
    print("=" * 60)

def main():
    """CLI entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Wiki Indexer - Pre-populate codebase documentation")
    parser.add_argument("--llm", action="store_true", help="Use LLM for rich documentation (costs API calls)")
    parser.add_argument("--category", type=str, help="Index only specific category")
    parser.add_argument("--list-categories", action="store_true", help="List available categories")
    
    args = parser.parse_args()
    
    if args.list_categories:
        print("Available categories:")
        for cat in WIKI_CATEGORIES.keys():
            entries = WIKI_CATEGORIES[cat]
            print(f"  - {cat} ({len(entries)} entries)")
        return
    
    categories = [args.category] if args.category else None
    run_indexer(use_llm=args.llm, categories_to_index=categories)

if __name__ == "__main__":
    main()

