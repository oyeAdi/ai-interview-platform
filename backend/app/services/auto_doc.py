import os
import glob
from app.supabase_config import supabase_admin
from app.engine.intelligence.dispatch import get_intelligence_dispatch

class AutoDocService:
    def __init__(self):
        self.dispatch = get_intelligence_dispatch()

    def get_python_files(self, root_dir):
        """Recursively get significant python files."""
        files = glob.glob(os.path.join(root_dir, "**/*.py"), recursive=True)
        # Filter out venv, tests, migrations, __pycache__
        default_ignore = ['venv', 'node_modules', 'migrations', '__pycache__', 'tests', 'scripts']
        
        config = self.load_config()
        custom_ignore = config.get('ignore_patterns', [])
        ignore_patterns = list(set(default_ignore + custom_ignore))
        
        valid_files = []
        for f in files:
            if any(part in f for part in ignore_patterns):
                continue
            if os.path.basename(f) == '__init__.py':
                continue
            valid_files.append(f)
        return valid_files

    async def document_file(self, file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                code = f.read()
        except:
            return None

        if not code.strip():
            return None

        rel_path = os.path.basename(file_path)
        
        prompt = f"""
        You are DeepWiki, an expert code documentation AI.
        Analyze the following Python file: `{rel_path}`.
        
        CODE:
        ```python
        {code[:4000]} # Truncated for token limits if necessary
        ```
        
        TASK:
        Generate a comprehensive documentation article for this file.
        
        FORMAT (Markdown):
        # [Filename]
        
        ## Purpose
        (What does this file do?)
        
        ## Key Components
        (List classes/functions with brief explanations. Cite line numbers like `[L10-15]` where possible.)
        
        ## Dependencies
        (What does it import/rely on?)
        
        Return RAW MARKDOWN string. Do not wrap in JSON.
        """

        return output.raw_response

    def load_config(self):
        """Load swarm_wiki.json if it exists."""
        try:
            config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'swarm_wiki.json')
            if os.path.exists(config_path):
                import json
                with open(config_path, 'r') as f:
                    return json.load(f)
        except Exception as e:
            print(f"Error loading swarm_wiki.json: {e}")
        return {}

    async def document_file(self, file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                code = f.read()
        except:
            return None

        if not code.strip():
            return None

        rel_path = os.path.basename(file_path)
        config = self.load_config()
        repo_context = config.get('repo_notes', '')
        
        prompt = f"""
        You are SwarmWiki, an expert technical documentation AI.
        
        CONTEXT:
        {repo_context}
        
        Analyze the following Python file: `{rel_path}`.
        
        CODE:
        ```python
        {code[:6000]} 
        ```
        
        TASK:
        Generate a "Sensible" documentation page for this file.
        It must be rich, visual, and strictly formatted.
        
        REQUIREMENTS:
        1. **Mermaid Diagrams**: You MUST generate at least one Mermaid diagram (class diagram, flow chart, or sequence diagram) to visualize the file's logic.
           - Use ````mermaid` code blocks.
           - Keep diagrams simple and readable.
        2. **Structure**:
           - **# [Filename]** (Title)
           - **## Purpose**: High-level summary.
           - **## Architecture**: A Mermaid diagram showing how this component fits in or works internally.
           - **## Key Components**: Table or list of classes/functions.
           - **## Dependencies**: Bullet points.
        
        Start immediately with the markdown. Do not wrap in JSON.
        """

        # Using structured generation but expecting text fallback
        output = await self.dispatch.generate_structured(prompt)
        
        # Prefer raw text if available
        return output.raw_response

    def log(self, message):
        print(message)
        try:
            with open("autodoc_debug.log", "a") as f:
                f.write(message + "\n")
        except:
            pass

    def determine_category(self, file_path, config):
        """Determine category based on page_structure in config."""
        rel_path = os.path.relpath(file_path, os.path.dirname(os.path.dirname(os.path.dirname(__file__)))).replace('\\', '/')
        
        structure = config.get('page_structure', {})
        for category, patterns in structure.items():
            for pattern in patterns:
                # Simple glob matching
                import fnmatch
                # Handle ** manually or try simple match
                # python glob is for files on disk, we need path matching
                # fnmatch supports * and ? but not ** typically for recursive directory matching in the way we want
                # Let's rely on simple containment or regex for robustness
                if "**" in pattern:
                    # e.g. backend/app/routers/**/*.py
                    prefix = pattern.split("**")[0]
                    if rel_path.startswith(prefix):
                        return category
                elif fnmatch.fnmatch(rel_path, pattern):
                    return category
        
        return "Codebase"

    async def run_scan(self, root_dir, limit=None):
        self.log(f"[AutoDoc] Starting scan in: {root_dir}")
        files = self.get_python_files(root_dir)
        self.log(f"[AutoDoc] Found {len(files)} python files.")
        
        config = self.load_config()
        
        # Prioritize routers and services
        files.sort(key=lambda x: 0 if 'routers' in x or 'services' in x else 1)
        
        if limit:
            target_files = files[:limit]
        else:
            target_files = files
            
        self.log(f"[AutoDoc] Targeting: {len(target_files)} files")
        
        generated_docs = []
        
        for f in target_files: 
            self.log(f"[AutoDoc] Analyzing {f}...")
            doc_content = await self.document_file(f)
            if doc_content:
                self.log(f"[AutoDoc] Generated {len(doc_content)} chars for {os.path.basename(f)}")
                
                category = self.determine_category(f, config)
                
                entry = {
                    # Unique ID per file to allow updates
                    "learning_id": f"autodoc_{os.path.basename(f)}",
                    "pattern": f"Docs: {os.path.basename(f)}",
                    "category": category,
                    "decision_context": doc_content,
                    "tags": ["auto-generated", "code-analysis", category],
                    "confidence_score": 0.9,
                    "status": "active"
                }
                
                try:
                    # Upsert requires Conflict resolution, or we just insert and ignore dups
                    # Better to delete existing for this file first
                    # But for now, we'll just try insert
                    supabase_admin.table("learning_repository").delete().eq("pattern", entry["pattern"]).execute()
                    res = supabase_admin.table("learning_repository").insert(entry).execute()
                    self.log(f"[AutoDoc] Saved to DB: {res}")
                    generated_docs.append(os.path.basename(f))
                except Exception as e:
                    self.log(f"[AutoDoc] Error saving {f}: {e}")
            else:
                self.log(f"[AutoDoc] No content generated for {f}")
                    
        return generated_docs
