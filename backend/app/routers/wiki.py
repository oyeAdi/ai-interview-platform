from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import List, Optional, Dict
from pydantic import BaseModel
from datetime import datetime
import json

from app.engine.intelligence.dispatch import get_intelligence_dispatch
# We will need to import database client and other utilities
from app.supabase_config import supabase_admin
from app.services.auto_doc import AutoDocService
import os

router = APIRouter(prefix="/wiki", tags=["Wiki", "Documentation"])

# --- Models ---
class WikiEntry(BaseModel):
    id: str
    question: str
    answer: str
    category: str
    code_refs: List[str] = []
    source: str = "cache" # 'cache' or 'pending_llm'
    last_updated: datetime

class AskRequest(BaseModel):
    question: str

class AskResponse(BaseModel):
    question: str
    answer: str
    category: str
    code_refs: List[str] = []
    source: str
    followup_suggestion: Optional[str] = None

# --- Routes ---

@router.get("/categories")
async def get_categories():
    """Get all unique categories from the learning repository."""
    try:
        # Query all categories to calculate counts
        response = supabase_admin.table("learning_repository").select("category").execute()
        
        # Calculate counts in Python (simplest for now without raw SQL)
        counts = {}
        for item in response.data:
            cat = item.get("category", "General")
            if cat:
                counts[cat] = counts.get(cat, 0) + 1
        
        # Format object list for frontend
        categories = [
            {"name": cat, "entry_count": count}
            for cat, count in counts.items()
        ]
        
        # Sort by name
        return {"categories": sorted(categories, key=lambda x: x["name"])}
    except Exception as e:
        print(f"Error fetching categories: {e}")
        return {"categories": []}

@router.get("/entries")
async def get_entries(limit: int = 5):
    """Get recent entries/learnings."""
    try:
        response = supabase_admin.table("learning_repository")\
            .select("*")\
            .order("created_at", desc=True)\
            .limit(limit)\
            .execute()
        
        # Map DB model to Frontend model
        entries = []
        for item in response.data:
            entries.append({
                "id": item.get("id"),
                "pattern": item.get("pattern", "Unknown Pattern"),
                "decision_context": item.get("decision_context", "No context available."),
                "category": item.get("category", "General"),
                "code_refs": item.get("applicable_to", []),
                "keywords": item.get("tags", []),
                "created_at": item.get("created_at"),
                "updated_at": item.get("created_at"), # Frontend expects updated_at
                "auto_generated": True
            })
        print(f"Returning {len(entries)} entries to frontend.")
        return {"entries": entries}
    except Exception as e:
        print(f"Error fetching entries: {e}")
        return {"entries": []}

@router.get("/stats")
async def get_stats():
    """Get documentation system stats."""
    try:
        # Mock stats for now or query DB
        # This matches what the frontend expects: { cache_hit_rate: number; total_entries: number }
        count_res = supabase_admin.table("learning_repository").select("id", count="exact").execute()
        total = count_res.count if hasattr(count_res, 'count') else len(count_res.data)
        
        return {
            "cache_hit_rate": 0.85, # dynamic later
            "total_entries": total
        }
    except Exception as e:
        return {"cache_hit_rate": 0.0, "total_entries": 0}

@router.get("/diagrams")
async def get_diagrams():
    """Get system diagrams."""
    # Return a default architecture diagram for now
    return {"diagrams": [{
        "id": "arch-1",
        "title": "SwarmHire Architecture",
        "category": "System",
        "description": "High-level view of the 6-agent swarm architecture.",
        "mermaid": """graph TD
    User[User/Candidate] --> Frontend
    Frontend --> API[FastAPI Backend]
    API --> Orch[Swarm Orchestrator]
    Orch --> A1[Analyst]
    Orch --> A2[Architect]
    Orch --> A3[Devops]
    Orch --> A4[Security]
    Orch --> A5[QA]
    Orch --> A6[Manager]
    API --> DB[(Supabase)]
    Orch --> Redis[(Redis Cache)]
"""
    }]}

@router.post("/scan")
async def trigger_scan(background_tasks: BackgroundTasks):
    print(f"\n>>>> TRIGGERING DEEPWIKI SCAN AT {datetime.now()} <<<<\n")
    """
    Triggers a DeepWiki codebase scan.
    Runs in background to avoid timeout.
    """
    async def run_scan_task():
        service = AutoDocService()
        # Scan the 'app' directory
        root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) 
        await service.run_scan(root_dir)
    
    background_tasks.add_task(run_scan_task)
    return {"status": "started", "message": "DeepWiki scan initiated in background."}

async def create_learning_from_qa(question: str, answer: str):
    """
    Background task to analyze a Q&A pair and store it as a reusable learning pattern.
    This simulates the "Observer" adding to the knowledge base.
    """
    try:
        dispatch = get_intelligence_dispatch()
        
        prompt = f"""
        Analyze this Question and Answer pair from the documentation system.
        Extract a generalized 'pattern' or 'learning' that can be reused.
        
        Question: {question}
        Answer: {answer}
        
        Respond in JSON:
        {{
            "pattern": "Generalized question matching this topic",
            "category": "High-level category (e.g. Architecture, Features, Pricing)",
            "subcategory": "Specific sub-topic",
            "tags": ["tag1", "tag2"],
            "decision_context": "The concise, reusable answer/knowledge",
            "confidence_score": 0.95
        }}
        """
        
        output = await dispatch.generate_structured(prompt)
        data = output.action_data
        
        if not data:
            # Fallback if structured parsing fails drastically
            return

        # Insert into learning_repository
        supabase_admin.table("learning_repository").insert({
            "learning_id": f"learn_{datetime.now().timestamp()}",
            "pattern": data.get("pattern", question),
            "category": data.get("category", "General"),
            "subcategory": data.get("subcategory"),
            "tags": data.get("tags", []),
            "decision_context": data.get("decision_context", answer),
            "confidence_score": data.get("confidence_score", 0.9),
            "source_sessions": [],
            "status": "active"
        }).execute()
        
        print(f"Created new learning entry for: {question}")
        
    except Exception as e:
        print(f"Failed to create learning: {e}")

@router.post("/ask", response_model=AskResponse)
async def ask_wiki(payload: AskRequest, background_tasks: BackgroundTasks):
    """
    The core 'Living Documentation' endpoint (RAG Enabled).
    1. Search for existing exact matches (Cache Hit).
    2. If no exact match, RETRIEVE relevant context from DB (RAG).
    3. GENERATE answer using context.
    4. Background: Store new learning.
    """
    question = payload.question
    
    # 1. Search for Exact High-Confidence Match first (Cache)
    try:
        response = supabase_admin.table("learning_repository")\
            .select("*")\
            .textSearch("pattern", question)\
            .limit(1)\
            .execute()
            
        if response.data:
            # Check if it's a really good match
            learning = response.data[0]
            # If pattern is very similar to question, return it directly
            if len(learning['pattern']) - len(question) < 20: 
                return {
                    "question": question,
                    "answer": learning.get("decision_context") or "Found a relevant pattern.",
                    "category": learning.get("category"),
                    "source": "cache",
                    "code_refs": learning.get("applicable_to", []),
                    "followup_suggestion": "Is this what you were looking for?"
                }
    except Exception as e:
        print(f"Cache search failed: {e}")

    # 2. RAG Retrieval Step
    context = ""
    related_docs = []
    try:
        # Broader search for context (simple keyword matching for now)
        # In production, use vector embeddings (pgvector).
        # Here we fetch last 20 entries and filter in python or simple search
        # Using a simple 'or' filter for demo purposes
        keywords = question.split()
        keyword_filter = ",".join([f"decision_context.ilike.%{k}%" for k in keywords if len(k) > 4])
        
        if keyword_filter:
            res = supabase_admin.table("learning_repository").select("pattern, decision_context, category")\
                .or_(keyword_filter).limit(3).execute()
            
            for item in res.data:
                context += f"\n--- Doc: {item.get('pattern')} ---\n{item.get('decision_context')[:1500]}\n"
                related_docs.append(item.get('pattern'))
        
        # If simple search yielded nothing, maybe fetch recent generic docs?
        if not context:
            res = supabase_admin.table("learning_repository").select("pattern, decision_context").limit(2).execute()
            for item in res.data:
                context += f"\n--- Doc: {item.get('pattern')} ---\n{item.get('decision_context')[:500]}\n"
    except Exception as e:
        print(f"RAG retrieval failed: {e}")

    # 3. Generation Step
    try:
        dispatch = get_intelligence_dispatch()
        system_prompt = f"""You are the SwarmHire technical documentation assistant. 
        Answer the user's question using ONLY the provided Context below. 
        If the context doesn't contain the answer, say "I don't have enough information in the codebase yet." and offer a best guess based on general knowledge, but flag it as such.
        
        Context from Codebase:
        {context}
        """
        
        # Use generate_structured as generate_text is not available
        ai_response = await dispatch.generate_structured(f"{system_prompt}\n\nQuestion: {question}")
        
        # Extract text from the structured response
        # It usually falls back to action_data={'text': ...} for unstructured prompts
        answer_text = ai_response.action_data.get('text') if ai_response.action_data else ai_response.raw_response
        if not answer_text and ai_response.raw_response:
            answer_text = ai_response.raw_response

        # 4. Background: Store new learning (Self-Updating Doc)
        # Only store if it was a meaningful answer
        if "I don't have enough information" not in answer_text:
            background_tasks.add_task(create_learning_from_qa, question, answer_text)

        return {
            "question": question,
            "answer": answer_text,
            "category": "Generated",
            "source": "rag_generation",
            "code_refs": related_docs,
            "followup_suggestion": "I generated this from the codebase."
        }
    except Exception as e:
        print(f"LLM Generation failed: {e}")
        return {
            "question": question,
            "answer": "Sorry, I encountered an error generating the answer.",
            "category": "Error",
            "source": "error",
            "code_refs": [],
            "followup_suggestion": "Please try again later."
        }
        

# --- Configuration Endpoints ---

CONFIG_FILE = "swarm_wiki.json"

class ConfigRequest(BaseModel):
    config: Dict

@router.get("/config")
async def get_wiki_config():
    """Read the SwarmWiki configuration file."""
    try:
        root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        config_path = os.path.join(root_dir, CONFIG_FILE)
        
        if os.path.exists(config_path):
            with open(config_path, "r") as f:
                return json.load(f)
        else:
            # Return default template if not exists
            return {
                "repo_notes": [{"content": ""}],
                "pages": [
                    {
                        "title": "Overview",
                        "purpose": "General overview of the repository.",
                        "page_notes": [{"content": ""}]
                    }
                ]
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read config: {e}")

@router.post("/config")
async def save_wiki_config(payload: ConfigRequest):
    """Save the SwarmWiki configuration file."""
    try:
        root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        config_path = os.path.join(root_dir, CONFIG_FILE)
        
        with open(config_path, "w") as f:
            json.dump(payload.config, f, indent=2)
            
        return {"status": "saved", "message": "SwarmWiki configuration updated."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save config: {e}")
