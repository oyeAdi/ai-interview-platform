"""FastAPI server with WebSocket support"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, UploadFile, File, Form, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional, List, Any
from pydantic import BaseModel
import json
import os
import uuid
import asyncio
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables from backend/.env
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

import logging
from supabase_config import supabase_admin, supabase

# Configure debug logging
debug_logger = logging.getLogger("debug_logger")
debug_logger.setLevel(logging.DEBUG)
handler = logging.FileHandler(os.path.join(os.path.dirname(__file__), "logs", "server_debug.log"))
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
debug_logger.addHandler(handler)
from core.interview_controller import InterviewController
from utils.file_parser import FileParser
from utils.logger import Logger
from websocket.connection_manager import ConnectionManager
from websocket.message_handler import MessageHandler
from llm.jd_resume_analyzer import JDResumeAnalyzer
from llm.feedback_agent import FeedbackGenerator

# Import admin router
from api.admin import router as admin_router

app = FastAPI(title="AI Interviewer API")

# Configure CORS to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register admin router
app.include_router(admin_router)

# Pydantic models for request/response
class SkillRequirement(BaseModel):
    skill: str
    proficiency: str
    weight: float

class QuestionDistribution(BaseModel):
    easy: float
    medium: float
    hard: float

class DataModel(BaseModel):
    duration_minutes: int = 45
    experience_level: str = "mid"
    expectations: str = "medium"
    required_skills: List[SkillRequirement] = []
    interview_flow: List[str] = ["coding", "conceptual"]
    question_distribution: QuestionDistribution = QuestionDistribution(easy=0.3, medium=0.5, hard=0.2)

class PositionCreate(BaseModel):
    title: str
    data_model: DataModel
    jd_text: str = ""
    status: str = "open"

class PositionUpdate(BaseModel):
    title: Optional[str] = None
    data_model: Optional[DataModel] = None
    jd_text: Optional[str] = None
    status: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    token: str
    username: str
    role: str

class CategoryConfig(BaseModel):
    enabled: bool
    difficulty_level: str  # 'easy', 'medium', or 'hard'

class AnalyzeJDRequest(BaseModel):
    jd_text: str
    position_title: str

class AnalyzeJDResponse(BaseModel):
    question_categories: dict[str, CategoryConfig]
    analysis_summary: str

class ExtractSkillsRequest(BaseModel):
    jd_text: str

class MapSkillsRequest(BaseModel):
    skills: List[dict]  # List of skill dictionaries
    
    class Config:
        arbitrary_types_allowed = True

# Helper functions for data file operations
def load_json_file(filepath: str) -> dict:
    """Load JSON file with error handling"""
    if not os.path.exists(filepath):
        return {}
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # Ensure we return a dict, not None
            return data if isinstance(data, dict) else {}
    except (json.JSONDecodeError, IOError) as e:
        print(f"Error loading {filepath}: {e}")
        return {}

def save_json_file(filepath: str, data: dict):
    """Save data to JSON file"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

# Data file paths
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
ORGANIZATIONS_FILE = os.path.join(MODELS_DIR, "organizations.json")
ACCOUNTS_FILE = os.path.join(MODELS_DIR, "accounts.json")
POSITIONS_FILE = os.path.join(MODELS_DIR, "positions.json")
QUESTION_BANK_FILE = os.path.join(MODELS_DIR, "question_bank.json")
WIKI_FILE = os.path.join(MODELS_DIR, "wiki.json")
SESSIONS_FILE = os.path.join(MODELS_DIR, "interview_sessions.json")
RESULTS_FILE = os.path.join(MODELS_DIR, "interview_results.json")
CANDIDATE_RESULTS_DIR = os.path.join(os.path.dirname(__file__), "candidate_results")

# Schema version for candidate result files
RESULT_SCHEMA_VERSION = "1.0"

def get_candidate_filename(name: str, date_str: str = None, candidate_id: str = None) -> str:
    """Sanitize candidate name for use as filename"""
    # Replace spaces with underscores, remove special characters except specific allowed ones
    import re
    # Allow alphanumeric, spaces, hyphens
    sanitized = re.sub(r'[^\w\s-]', '', name.lower())
    sanitized = re.sub(r'[-\s]+', '_', sanitized)
    
    # Validation for Anonymous candidates to ensure unique files
    if "anonymous" in sanitized and candidate_id:
        sanitized = f"{sanitized}_{candidate_id[:8]}"
    
    if date_str:
        return f"{sanitized}+{date_str}_result.json"
    return f"{sanitized}_result.json"

def save_candidate_result(candidate_name: str, candidate_id: str, result: dict, session_id: str = None):
    """Save result to per-candidate file, merging with existing data"""
    # Ensure directory exists
    os.makedirs(CANDIDATE_RESULTS_DIR, exist_ok=True)
    
    # Get date for filename
    date_str = result.get("date") or datetime.now().strftime("%Y-%m-%d")
    # Ensure simplified date format if it's a full timestamp
    if "T" in date_str:
        date_str = date_str.split("T")[0]
        
    # Use session_id/candidate_id for uniqueness if name is generic
    unique_id = session_id or candidate_id
    filename = get_candidate_filename(candidate_name, date_str, unique_id)
    filepath = os.path.join(CANDIDATE_RESULTS_DIR, filename)
    print(f"[DEBUG] Saving candidate result to: {filepath} (Name: {candidate_name}, ID: {unique_id})")
    
    # Load existing data or create new
    candidate_data = {
        "schema_version": RESULT_SCHEMA_VERSION,
        "candidate": {
            "id": candidate_id,
            "name": candidate_name
        },
        "interviews": []
    }
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                candidate_data = json.load(f)
        except Exception as e:
            print(f"[WARN] Failed to load existing candidate file {filepath}: {e}")
            # candidate_data uses default initialized above
            
    # If file didn't exist or load failed, ensuring structure is set (which it is by initialization above)
    # Re-verify critical fields if loaded from file but empty
    if "interviews" not in candidate_data:
        candidate_data["interviews"] = []

    
    # Add new interview result
    # Check if this session result already exists to avoid duplicates
    existing_sessions = [i.get("session_id") for i in candidate_data["interviews"]]
    if result.get("session_id") not in existing_sessions:
        candidate_data["interviews"].append(result)
    else:
        # Update existing
        for i, interview in enumerate(candidate_data["interviews"]):
            if interview.get("session_id") == result.get("session_id"):
                candidate_data["interviews"][i] = result
                break
    
    # Save updated file
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(candidate_data, f, indent=2, ensure_ascii=False)
    
    return filepath

# CORS middleware - allow all subdomains of swarmhire.ai and local dev
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=os.getenv("CORS_ORIGIN_REGEX", r"https://.*\.swarmhire\.ai|http://localhost:3000|http://.*\.lvh\.me:3000"),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_tenant_from_session(session_id: str) -> str:
    """Helper to get tenant_id from session metadata in Supabase"""
    try:
        # Check Supabase first (interview_sessions table should be in 002/003 migrations)
        # For now, we might fall back to JSON if table doesn't exist yet
        response = supabase_admin.table('interviews').select('tenant_id').eq('id', session_id).execute()
        if response.data:
            return str(response.data[0]['tenant_id'])
    except Exception as e:
        # Fallback to local file during migration
        try:
            sessions_data = load_json_file(SESSIONS_FILE)
            session = sessions_data.get("sessions", {}).get(session_id)
            if session:
                return session.get("tenant_id", "global")
        except:
            pass
    return "global"
def initialize_data_files():
    """Ensure all required data files exist with proper initial structure"""
    if not os.path.exists(MODELS_DIR):
        os.makedirs(MODELS_DIR)
    
    if not os.path.exists(CANDIDATE_RESULTS_DIR):
        os.makedirs(CANDIDATE_RESULTS_DIR)
        
    data_files = {
        ORGANIZATIONS_FILE: {"organizations": {}},
        ACCOUNTS_FILE: {"accounts": {}},
        POSITIONS_FILE: {"positions": {}},
        QUESTION_BANK_FILE: {"questions": {}},
        WIKI_FILE: {"articles": {}},
        SESSIONS_FILE: {"sessions": {}},
        RESULTS_FILE: {"results": {}}
    }
    
    for filepath, default_data in data_files.items():
        if not os.path.exists(filepath):
            save_json_file(filepath, default_data)
        else:
            try:
                data = load_json_file(filepath)
                if not data or not isinstance(data, dict):
                    save_json_file(filepath, default_data)
            except:
                save_json_file(filepath, default_data)

# Initialize data files on startup
initialize_data_files()

# Global managers
connection_manager = ConnectionManager()
message_handler = MessageHandler(connection_manager)
# Initialize logger instance for result processing
logger = Logger()
jd_analyzer = JDResumeAnalyzer()
file_parser = FileParser()
feedback_generator = FeedbackGenerator()

# Store active interviews
active_interviews: dict = {}

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "AI Interviewer API"}

@app.post("/api/analyze-jd-categories")
async def analyze_jd_categories(
    jd_text: Optional[str] = Form(None),
    jd_file: Optional[UploadFile] = File(None)
):
    """Analyze JD and suggest appropriate question categories using Gemini"""
    try:
        # Extract JD text
        jd_content = jd_text or ""
        
        if jd_file:
            import tempfile
            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(jd_file.filename)[1]) as tmp:
                content = await jd_file.read()
                tmp.write(content)
                temp_path = tmp.name
            jd_content = file_parser.parse_file(temp_path)
            os.remove(temp_path)
        
        if not jd_content:
            raise HTTPException(status_code=400, detail="JD text or file must be provided")
        
        # Use Gemini to analyze JD
        prompt = f"""Analyze this job description and determine which interview question categories are most appropriate.

Job Description:
{jd_content}

Question Categories:
1. coding - Programming, algorithms, data structures
2. conceptual - Theoretical knowledge, fundamentals  
3. system_design - Architecture, scalability, design patterns
4. problem_solving - Analytical thinking, real-world scenarios
5. behavioral - Soft skills, teamwork, conflict resolution
6. communication - Presentation, clarity, articulation

Return ONLY valid JSON:
{{
    "job_type": "technical" | "non-technical" | "hybrid",
    "suggested_categories": {{
        "coding": true/false,
        "conceptual": true/false,
        "system_design": true/false,
        "problem_solving": true/false,
        "behavioral": true/false,
        "communication": true/false
    }},
    "reasoning": "Brief explanation"
}}

Examples:
- Software Engineer → technical, coding=true, conceptual=true, system_design=true, problem_solving=true
- Helper/Admin → non-technical, behavioral=true, communication=true, others=false
- Product Manager → hybrid, problem_solving=true, behavioral=true, communication=true, system_design=true"""
        
        response = GeminiClient().model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(temperature=0.3, max_output_tokens=500)
        )
        
        # Extract JSON
        response_text = ""
        if hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
            if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                parts = candidate.content.parts
                if parts:
                    response_text = ''.join([part.text for part in parts if hasattr(part, 'text')]).strip()
        
        if not response_text and hasattr(response, 'text'):
            response_text = response.text.strip()
        
        # Clean markdown
        response_text = response_text.replace('```json', '').replace('```', '').strip()
        
        # Parse JSON
        result = json.loads(response_text)
        return result
        
    except json.JSONDecodeError as e:
        print(f"Error parsing Gemini response: {e}")
        # Fallback
        return {
            "job_type": "hybrid",
            "suggested_categories": {
                "coding": False, "conceptual": False, "system_design": False,
                "problem_solving": True, "behavioral": True, "communication": True
            },
            "reasoning": "Unable to analyze JD, using safe defaults"
        }
    except Exception as e:
        print(f"Error analyzing JD: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze-language")
async def analyze_language(
    jd_text: Optional[str] = Form(None),
    jd_file: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None),
    resume_file: Optional[UploadFile] = File(None),
    jd_id: Optional[str] = Form(None),
    resume_id: Optional[str] = Form(None),
    expert_mode: Optional[str] = Form(None),
    question_categories: Optional[str] = Form(None),
    candidate_account: Optional[str] = Form(None),
    candidate_role: Optional[str] = Form(None)
):
    """Analyze JD and Resume to determine language"""
    try:
        # Extract text from files if provided
        jd_content = jd_text or ""
        resume_content = resume_text or ""
        
        if jd_file:
            import tempfile
            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(jd_file.filename)[1]) as tmp:
                content = await jd_file.read()
                tmp.write(content)
                temp_path = tmp.name
            jd_content = file_parser.parse_file(temp_path)
            os.remove(temp_path)
            
        if resume_file:
            import tempfile
            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(resume_file.filename)[1]) as tmp:
                content = await resume_file.read()
                tmp.write(content)
                temp_path = tmp.name
            resume_content = file_parser.parse_file(temp_path)
            os.remove(temp_path)
        
        if not jd_content and not resume_content:
            raise HTTPException(status_code=400, detail="JD or Resume must be provided")

        # Analyze language and extracting candidate info
        result = jd_analyzer.analyze(
            jd_text=jd_content,
            resume_text=resume_content
        )
        
        language = result["language"]
        candidate_info = result.get("candidate_info", {})
        candidate_name = candidate_info.get("name", "Anonymous Candidate")

        # Create interview controller with expert mode flag
        is_expert_mode = expert_mode == 'true'
        controller = InterviewController(language, jd_id, expert_mode=is_expert_mode)
        session_id = controller.context_manager.session_id
        
        # Calculate duration based on categories if provided
        calculated_duration = 30 # Default
        if question_categories:
            try:
                cats = json.loads(question_categories)
                controller.question_categories = cats
                
                total_mins = 0
                total_q = 0
                difficulty_map = {"easy": 10, "medium": 15, "hard": 20}
                for cat_conf in cats.values():
                    if cat_conf.get("enabled"):
                        diff = cat_conf.get("difficulty", "medium")
                        total_mins += difficulty_map.get(diff, 15)
                        total_q += int(cat_conf.get("count", 0))
                
                if total_mins > 0:
                    calculated_duration = total_mins
                
                if total_q > 0:
                    controller.total_questions = total_q
            except json.JSONDecodeError:
                print(f"Warning: Invalid question_categories JSON: {question_categories}")
        
        # Attach resume text to controller
        if resume_content:
            controller.resume_text = resume_content

        # Store controller
        active_interviews[session_id] = controller
        
        # Save session to file
        try:
            sessions_data = load_json_file(SESSIONS_FILE)
            if "sessions" not in sessions_data:
                sessions_data["sessions"] = {}
            
            # Combine all session data into one update
            sessions_data["sessions"][session_id] = {
                "session_id": session_id,
                "created_at": datetime.utcnow().isoformat(),
                "expires_at": (datetime.now() + timedelta(minutes=60)).isoformat(), # Default 1h for QS
                "status": "pending",
                "mode": "quick_start",
                "jd_id": jd_id,
                "language": language,
                "duration_minutes": calculated_duration,
                "expert_mode": is_expert_mode,
                "question_categories": json.loads(question_categories) if question_categories else None,
                "candidate_name": candidate_name,
                "candidate_info": candidate_info,
                "candidate_account": candidate_account,
                "candidate_role": candidate_role
            }
            save_json_file(SESSIONS_FILE, sessions_data)
            print(f"[INFO] Saved quick start session config: duration={calculated_duration}min, candidate={candidate_name}")
        except Exception as save_e:
            print(f"[WARN] Failed to save session config: {save_e}")
        
        return {
            "session_id": session_id,
            "language": language,
            "confidence": result["confidence"],
            "candidate_name": candidate_name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/jds")
async def get_jds():
    """Get list of available JDs"""
    jds_file = os.path.join(Config.JDS_DIR, "jds.json")
    if not os.path.exists(jds_file):
        return {"jds": []}
    
    with open(jds_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
        return {"jds": data.get("jds", [])}

@app.get("/api/expert/results")  # Changed from /api/admin/results to /api/expert/results
async def get_results():
    """Get list of all interview results"""
    data = load_json_file(RESULTS_FILE)
    results = data.get("results", {})
    
    # Convert dict to list if needed (results stored as {session_id: data})
    if isinstance(results, dict):
        results_list = list(results.values())
    else:
        results_list = results
    
    return {"results": results_list}

@app.get("/api/resumes")
async def get_resumes():
    """Get list of available Resumes"""
    resumes_file = os.path.join(Config.RESUMES_DIR, "resumes.json")
    if not os.path.exists(resumes_file):
        return {"resumes": []}
    
    with open(resumes_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
        return {"resumes": data.get("resumes", [])}

# ==================== Organization/Account/Position APIs ====================

@app.get("/api/organizations")
async def get_organizations():
    """Get list of all organizations"""
    data = load_json_file(ORGANIZATIONS_FILE)
    return {"organizations": data.get("organizations", [])}

@app.get("/api/organizations/{org_id}")
async def get_organization(org_id: str):
    """Get specific organization details"""
    data = load_json_file(ORGANIZATIONS_FILE)
    for org in data.get("organizations", []):
        if org["id"] == org_id:
            return org
    raise HTTPException(status_code=404, detail="Organization not found")

@app.get("/api/organizations/{org_id}/accounts")
async def get_organization_accounts(org_id: str):
    """Get all accounts for an organization from Supabase"""
    try:
        # We store org_id in settings for now in our Supabase schema
        response = supabase_admin.table('tenants').select('*').contains('settings', {"org_id": org_id}).execute()
        return {"accounts": response.data}
    except Exception as e:
        print(f"[ERROR] Failed to fetch organization {org_id} accounts: {e}")
        data = load_json_file(ACCOUNTS_FILE)
        accounts = [acc for acc in data.get("accounts", []) if acc.get("org_id") == org_id]
        return {"accounts": accounts}

@app.get("/api/accounts")
async def get_all_accounts(request: Request):
    """Get all accounts (tenants) from Supabase, filtered by parent_tenant_id"""
    try:
        # Extract tenant context from header (set by middleware)
        tenant_slug = request.headers.get('X-Tenant-Slug', 'global')
        
        # Get the current tenant ID from slug
        tenant_response = supabase_admin.table('tenants').select('id').eq('slug', tenant_slug).single().execute()
        current_tenant_id = tenant_response.data['id'] if tenant_response.data else None
        
        if not current_tenant_id:
            # Fallback: return all top-level tenants (parent_tenant_id is NULL)
            response = supabase_admin.table('tenants').select('*').is_('parent_tenant_id', 'null').execute()
        else:
            # Return only child accounts of the current tenant
            response = supabase_admin.table('tenants').select('*').eq('parent_tenant_id', current_tenant_id).execute()
        
        return {"accounts": response.data}
    except Exception as e:
        print(f"[ERROR] Failed to fetch accounts from Supabase: {e}")
        # Fallback to local file during transition
        data = load_json_file(ACCOUNTS_FILE)
        return {"accounts": data.get("accounts", [])}


class AccountCreate(BaseModel):
    name: str
    description: str = ""
    org_id: str = "epam"  # Legacy field, kept for compatibility
    parent_tenant_id: Optional[str] = None  # UUID of parent tenant for hierarchical isolation


@app.post("/api/accounts")
async def create_account(account: AccountCreate, request: Request):
    """Create a new account (tenant) in Supabase with hierarchical support"""
    try:
        # Generate slug from name
        slug = account.name.lower().replace(" ", "-").replace("_", "-")
        
        # Determine parent_tenant_id
        parent_id = None
        if account.parent_tenant_id:
            parent_id = account.parent_tenant_id
        else:
            # Auto-assign parent based on current tenant context
            tenant_slug = request.headers.get('X-Tenant-Slug', 'global')
            if tenant_slug != 'global':
                tenant_response = supabase_admin.table('tenants').select('id').eq('slug', tenant_slug).single().execute()
                parent_id = tenant_response.data['id'] if tenant_response.data else None
        
        new_account = {
            "name": account.name,
            "slug": slug,
            "description": account.description,
            "parent_tenant_id": parent_id,
            "settings": {"org_id": account.org_id}
        }
        
        response = supabase_admin.table('tenants').insert(new_account).execute()
        return {"status": "created", "account": response.data[0]}
    except Exception as e:
        print(f"[ERROR] Failed to create account in Supabase: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

@app.put("/api/accounts/{account_id}")
async def update_account(account_id: str, account_update: AccountUpdate):
    """Update an account's details"""
    data = load_json_file(ACCOUNTS_FILE)
    
    for i, acc in enumerate(data.get("accounts", [])):
        if acc["id"] == account_id:
            if account_update.name is not None:
                acc["name"] = account_update.name
            if account_update.description is not None:
                acc["description"] = account_update.description
            
            data["accounts"][i] = acc
            save_json_file(ACCOUNTS_FILE, data)
            return {"status": "updated", "account": acc}
    
    raise HTTPException(status_code=404, detail="Account not found")

@app.delete("/api/accounts/{account_id}")
async def delete_account(account_id: str):
    """Delete an account and all its positions"""
    # First delete all positions for this account
    positions_data = load_json_file(POSITIONS_FILE)
    positions_data["positions"] = [p for p in positions_data.get("positions", []) if p.get("account_id") != account_id]
    save_json_file(POSITIONS_FILE, positions_data)
    
    # Then delete the account
    data = load_json_file(ACCOUNTS_FILE)
    
    for i, acc in enumerate(data.get("accounts", [])):
        if acc["id"] == account_id:
            data["accounts"].pop(i)
            save_json_file(ACCOUNTS_FILE, data)
            return {"status": "deleted", "account_id": account_id}
    
    raise HTTPException(status_code=404, detail="Account not found")

@app.get("/api/accounts/{account_id}")
async def get_account(account_id: str):
    """Get specific account (tenant) details from Supabase"""
    try:
        # account_id could be UUID or slug
        query = supabase_admin.table('tenants').select('*')
        if len(account_id) == 36: # Likely UUID
            query = query.eq('id', account_id)
        else:
            query = query.eq('slug', account_id)
            
        response = query.single().execute()
        return response.data
    except Exception as e:
        print(f"[ERROR] Failed to fetch account {account_id} from Supabase: {e}")
        # Fallback
        data = load_json_file(ACCOUNTS_FILE)
        for acc in data.get("accounts", []):
            if acc["id"] == account_id:
                return acc
        raise HTTPException(status_code=404, detail="Account not found")

@app.get("/api/accounts/{account_id}/positions")
async def get_account_positions(account_id: str, status: Optional[str] = None):
    """Get all positions for an account, optionally filtered by status"""
    data = load_json_file(POSITIONS_FILE)
    positions = [pos for pos in data.get("positions", []) if pos.get("account_id") == account_id]
    
    if status:
        positions = [pos for pos in positions if pos.get("status") == status]
    
    return {"positions": positions}

@app.post("/api/accounts/{account_id}/positions")
async def create_position(account_id: str, position: PositionCreate):
    """Create a new position (job_description) under an account in Supabase"""
    try:
        # Get tenant UUID if slug provided
        tenant_id = account_id
        if len(account_id) != 36:
            tenant_res = supabase_admin.table('tenants').select('id').eq('slug', account_id).single().execute()
            tenant_id = tenant_res.data['id']
            
        new_pos = {
            "tenant_id": tenant_id,
            "title": position.title,
            "description": position.jd_text,
            "analyst_output": position.data_model.dict(),
            "status": position.status
        }
        
        response = supabase_admin.table('job_descriptions').insert(new_pos).execute()
        return {"status": "created", "position": response.data[0]}
    except Exception as e:
        print(f"[ERROR] Failed to create position in Supabase: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/positions")
async def get_all_positions(status: Optional[str] = None):
    """Get all positions (job_descriptions) from Supabase"""
    try:
        query = supabase_admin.table('job_descriptions').select('*')
        if status:
            query = query.eq('status', status)
        response = query.execute()
        # Map DB fields to expected frontend fields
        positions = []
        for row in response.data:
            positions.append({
                "id": str(row['id']),
                "title": row['title'],
                "account_id": str(row.get('tenant_id')),
                "status": row.get('status', 'open'),
                "created_at": row.get('created_at'),
                "jd_text": row.get('description', ''),
                "data_model": row.get('analyst_output', row.get('settings', {}))
            })
        return {"positions": positions}
    except Exception as e:
        print(f"[ERROR] Failed to fetch positions from Supabase: {e}")
        data = load_json_file(POSITIONS_FILE)
        positions = data.get("positions", [])
        if status:
            positions = [pos for pos in positions if pos.get("status") == status]
        return {"positions": positions}

@app.get("/api/positions/{position_id}")
async def get_position(position_id: str):
    """Get specific position details from Supabase"""
    try:
        response = supabase_admin.table('job_descriptions').select('*').eq('id', position_id).single().execute()
        row = response.data
        return {
            "id": str(row['id']),
            "title": row['title'],
            "account_id": str(row.get('tenant_id')),
            "status": row.get('status', 'open'),
            "created_at": row.get('created_at'),
            "jd_text": row.get('description', ''),
            "data_model": row.get('analyst_output', row.get('settings', {}))
        }
    except Exception as e:
        print(f"[ERROR] Failed to fetch position {position_id} from Supabase: {e}")
        data = load_json_file(POSITIONS_FILE)
        for pos in data.get("positions", []):
            if pos["id"] == position_id:
                return pos
        raise HTTPException(status_code=404, detail="Position not found")

@app.put("/api/positions/{position_id}")
async def update_position(position_id: str, update: PositionUpdate):
    """Update position details"""
    data = load_json_file(POSITIONS_FILE)
    
    for i, pos in enumerate(data.get("positions", [])):
        if pos["id"] == position_id:
            if update.title is not None:
                data["positions"][i]["title"] = update.title
            if update.data_model is not None:
                data["positions"][i]["data_model"] = update.data_model.dict()
            if update.jd_text is not None:
                data["positions"][i]["jd_text"] = update.jd_text
            if update.status is not None:
                data["positions"][i]["status"] = update.status
            
            data["positions"][i]["updated_at"] = datetime.now().strftime("%Y-%m-%d")
            save_json_file(POSITIONS_FILE, data)
            return {"status": "updated", "position": data["positions"][i]}
    
    raise HTTPException(status_code=404, detail="Position not found")

@app.put("/api/positions/{position_id}/config")
async def update_position_config(position_id: str, data_model: DataModel):
    """Update only the data model configuration for a position"""
    data = load_json_file(POSITIONS_FILE)
    
    for i, pos in enumerate(data.get("positions", [])):
        if pos["id"] == position_id:
            data["positions"][i]["data_model"] = data_model.dict()
            data["positions"][i]["updated_at"] = datetime.now().strftime("%Y-%m-%d")
            save_json_file(POSITIONS_FILE, data)
            return {"status": "updated", "data_model": data["positions"][i]["data_model"]}
    
    raise HTTPException(status_code=404, detail="Position not found")

@app.delete("/api/positions/{position_id}")
async def delete_position(position_id: str):
    """Delete a position"""
    data = load_json_file(POSITIONS_FILE)
    
    for i, pos in enumerate(data.get("positions", [])):
        if pos["id"] == position_id:
            account_id = pos.get("account_id")
            deleted_position = data["positions"].pop(i)
            save_json_file(POSITIONS_FILE, data)
            
            # Remove from account's positions list
            if account_id:
                accounts_data = load_json_file(ACCOUNTS_FILE)
                for acc in accounts_data.get("accounts", []):
                    if acc["id"] == account_id and position_id in acc.get("positions", []):
                        acc["positions"].remove(position_id)
                        save_json_file(ACCOUNTS_FILE, accounts_data)
                        break
            
            return {"status": "deleted", "position_id": position_id}
    
    raise HTTPException(status_code=404, detail="Position not found")

# ==================== Candidate Matching APIs ====================

RESUMES_FILE = os.path.join(os.path.dirname(__file__), "resumes", "resumes.json")
TEMPLATES_FILE = os.path.join(MODELS_DIR, "position_templates.json")

def calculate_candidate_match_score(resume: dict, position: dict) -> float:
    """Calculate how well a candidate matches a position based on skills"""
    score = 0.0
    max_score = 0.0
    
    required_skills = position.get("data_model", {}).get("required_skills", [])
    candidate_skills = set(s.lower() for s in resume.get("skills", []))
    candidate_language = resume.get("language", "").lower()
    
    # Skip generic skills that everyone has
    GENERIC_SKILLS = {"coding", "programming", "software"}
    
    for skill_req in required_skills:
        skill = skill_req.get("skill", "").lower()
        weight = skill_req.get("weight", 0.1)
        
        # Skip generic skills in scoring (don't add to max_score either)
        if skill in GENERIC_SKILLS:
            continue
            
        max_score += weight
        
        # Check if candidate has this exact skill or it's their primary language
        if skill in candidate_skills or skill == candidate_language:
            score += weight
        # Strict partial match - only for closely related skills
        elif skill in ["javascript", "typescript"] and any(s in candidate_skills for s in ["javascript", "typescript"]):
            score += weight * 0.7
        elif skill in ["python", "django", "flask"] and any(s in candidate_skills for s in ["python", "django", "flask"]):
            score += weight * 0.5
        elif skill in ["java", "spring", "spring_boot"] and any(s in candidate_skills for s in ["java", "spring", "spring_boot"]):
            score += weight * 0.5
    
    # Bonus for primary language match (only if it's a required skill)
    position_skills = [s.get("skill", "").lower() for s in required_skills if s.get("skill", "").lower() not in GENERIC_SKILLS]
    if candidate_language in position_skills:
        score += 0.15  # 15% bonus for language match
        max_score += 0.15
    
    # Experience level alignment - stricter scoring
    candidate_level = resume.get("experience_level", "mid")
    position_level = position.get("data_model", {}).get("experience_level", "mid")
    level_order = {"junior": 1, "mid": 2, "senior": 3, "lead": 4}
    
    candidate_level_num = level_order.get(candidate_level, 2)
    position_level_num = level_order.get(position_level, 2)
    
    max_score += 0.1
    
    # Perfect match gets full bonus, adjacent levels get partial
    level_diff = abs(candidate_level_num - position_level_num)
    if level_diff == 0:
        score += 0.1
    elif level_diff == 1:
        score += 0.05
    # 2+ levels apart = no bonus (underqualified or overqualified)
    
    return round((score / max_score) * 100, 1) if max_score > 0 else 0.0

@app.get("/api/positions/{position_id}/candidates")
async def get_candidates_for_position(position_id: str):
    """Get all candidates sorted by match score for a position"""
    # Load position
    positions_data = load_json_file(POSITIONS_FILE)
    position = next((p for p in positions_data.get("positions", []) if p["id"] == position_id), None)
    
    if not position:
        raise HTTPException(status_code=404, detail="Position not found")
    
    # Load resumes
    resumes_data = load_json_file(RESUMES_FILE)
    resumes = resumes_data.get("resumes", [])
    
    # Calculate match scores and sort
    candidates = []
    for resume in resumes:
        match_score = calculate_candidate_match_score(resume, position)
        candidates.append({
            "id": resume.get("id"),
            "name": resume.get("name"),
            "experience_level": resume.get("experience_level", "mid"),
            "skills": resume.get("skills", []),
            "language": resume.get("language"),
            "match_score": match_score
        })
    
    # Sort by match score (highest first)
    candidates.sort(key=lambda x: x["match_score"], reverse=True)
    
    return {
        "position_id": position_id,
        "position_title": position.get("title"),
        "candidates": candidates
    }

@app.get("/api/resumes/{resume_id}")
async def get_resume(resume_id: str):
    """Get specific resume details"""
    resumes_data = load_json_file(RESUMES_FILE)
    for resume in resumes_data.get("resumes", []):
        if resume["id"] == resume_id:
            return resume
    raise HTTPException(status_code=404, detail="Resume not found")

# ==================== Position Templates APIs ====================

class TemplateCreate(BaseModel):
    name: str
    category: str
    experience_levels: List[str]
    default_config: DataModel

@app.get("/api/templates")
async def get_templates():
    """Get all position templates"""
    data = load_json_file(TEMPLATES_FILE)
    return {
        "templates": data.get("templates", []),
        "categories": data.get("categories", []),
        "available_skills": data.get("available_skills", [])
    }

@app.get("/api/templates/{template_id}")
async def get_template(template_id: str):
    """Get a specific template"""
    data = load_json_file(TEMPLATES_FILE)
    for template in data.get("templates", []):
        if template["id"] == template_id:
            return template
    raise HTTPException(status_code=404, detail="Template not found")

@app.post("/api/templates")
async def create_template(template: TemplateCreate):
    """Create a new position template"""
    data = load_json_file(TEMPLATES_FILE)
    if "templates" not in data:
        data["templates"] = []
    
    # Generate unique ID
    template_id = f"custom_{uuid.uuid4().hex[:8]}"
    
    new_template = {
        "id": template_id,
        "name": template.name,
        "category": template.category,
        "experience_levels": template.experience_levels,
        "default_config": template.default_config.dict(),
        "is_custom": True
    }
    
    data["templates"].append(new_template)
    save_json_file(TEMPLATES_FILE, data)
    
    return {"status": "created", "template": new_template}

@app.delete("/api/templates/{template_id}")
async def delete_template(template_id: str):
    """Delete a custom template (built-in templates cannot be deleted)"""
    data = load_json_file(TEMPLATES_FILE)
    
    for i, template in enumerate(data.get("templates", [])):
        if template["id"] == template_id:
            if not template.get("is_custom", False):
                raise HTTPException(status_code=400, detail="Cannot delete built-in templates")
            
            deleted = data["templates"].pop(i)
            save_json_file(TEMPLATES_FILE, data)
            return {"status": "deleted", "template_id": template_id}
    
    raise HTTPException(status_code=404, detail="Template not found")

# ==================== Question Bank APIs ====================

@app.get("/api/question-bank")
async def get_question_bank(
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    skill: Optional[str] = None,
    experience_level: Optional[str] = None
):
    """Get questions from the enhanced question bank with optional filters"""
    data = load_json_file(QUESTION_BANK_FILE)
    questions = data.get("questions", [])
    
    if category:
        questions = [q for q in questions if q.get("category") == category]
    if difficulty:
        questions = [q for q in questions if q.get("difficulty") == difficulty]
    if skill:
        questions = [q for q in questions if skill in q.get("skills", [])]
    if experience_level:
        questions = [q for q in questions if experience_level in q.get("experience_levels", [])]
    
    return {
        "questions": questions,
        "categories": data.get("categories", []),
        "difficulty_levels": data.get("difficulty_levels", []),
        "skills_taxonomy": data.get("skills_taxonomy", {})
    }

@app.get("/api/question-bank/skills")
async def get_skills_taxonomy():
    """Get the skills taxonomy"""
    data = load_json_file(QUESTION_BANK_FILE)
    return {"skills_taxonomy": data.get("skills_taxonomy", {})}

# ==================== JD Analysis API ====================

@app.post("/api/analyze-jd")
async def analyze_jd(request: AnalyzeJDRequest):
    """
    Analyze job description using LLM to suggest question categories and difficulty levels.
    
    Returns AI-suggested configuration that can be edited by the user.
    """
    from llm.gemini_client import GeminiClient
    
    try:
        # Initialize LLM client
        llm_client = GeminiClient()
        
        # Create analysis prompt
        prompt = f"""Analyze this job description and determine the interview configuration.

Position Title: {request.position_title}

Job Description:
{request.jd_text}

Your task:
1. Determine which question categories are relevant for this role
2. Assign appropriate difficulty level (easy, medium, hard) for each category
3. Consider the role's seniority, technical requirements, and industry

IMPORTANT: You can suggest ANY category that's relevant - not limited to a predefined list.

Common Categories (examples, not exhaustive):
- coding: Programming, algorithms, data structures
- behavioral: Soft skills, past experiences, situational questions
- system_design: Architecture, scalability, design patterns
- problem_solving: Analytical thinking, case studies
- conceptual: Theoretical knowledge, fundamentals
- technical_knowledge: Domain-specific technical expertise
- safety: Safety protocols, compliance (for trades/operations)
- recruitment: Hiring, talent acquisition (for HR roles)
- stakeholder_management: Managing relationships, communication
- leadership: Team management, decision making
- hr_policies: HR regulations, compliance
- product_sense: Product thinking, user empathy (for PM roles)
- metrics_analytics: Data analysis, KPIs
- sales: Sales techniques, negotiation
- customer_service: Customer interaction, support

Guidelines:
- Senior roles → hard difficulty
- Junior roles → easy/medium difficulty  
- Technical roles (Software Engineer, Data Scientist) → enable coding, system_design
- Non-technical roles (Product Manager, Marketing) → enable behavioral, problem_solving
- HR roles → enable recruitment, stakeholder_management, hr_policies, leadership (NOT coding)
- Trades/Operations (Electrician, Mechanic) → enable technical_knowledge, safety, problem_solving (NOT coding)
- Mid-level roles → medium difficulty

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{{
  "coding": {{"enabled": true, "difficulty_level": "hard"}},
  "behavioral": {{"enabled": true, "difficulty_level": "medium"}},
  "system_design": {{"enabled": false, "difficulty_level": "easy"}}
}}

For HR Manager, you might return:
{{
  "recruitment": {{"enabled": true, "difficulty_level": "hard"}},
  "stakeholder_management": {{"enabled": true, "difficulty_level": "medium"}},
  "leadership": {{"enabled": true, "difficulty_level": "medium"}},
  "hr_policies": {{"enabled": true, "difficulty_level": "medium"}},
  "behavioral": {{"enabled": true, "difficulty_level": "medium"}}
}}

IMPORTANT: Return ONLY the JSON object, nothing else."""

        # Get LLM response
        response = llm_client.generate_content(prompt)
        
        # Parse JSON response
        import json
        import re
        
        # Extract JSON from response (handle markdown code blocks)
        response_text = response.strip()
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            response_text = json_match.group(0)
        
        categories_data = json.loads(response_text)
        
        # Convert to CategoryConfig objects
        question_categories = {}
        for category, config in categories_data.items():
            question_categories[category] = CategoryConfig(
                enabled=config.get("enabled", False),
                difficulty_level=config.get("difficulty_level", "medium")
            )
        
        # Generate summary
        enabled_categories = [cat for cat, conf in question_categories.items() if conf.enabled]
        summary = f"Analyzed {request.position_title}: Suggested {len(enabled_categories)} relevant categories"
        
        return AnalyzeJDResponse(
            question_categories=question_categories,
            analysis_summary=summary
        )
        
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse LLM response: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"JD analysis failed: {str(e)}")

# ==================== Skill Extraction & Mapping ====================

class ExtractSkillsRequest(BaseModel):
    jd_text: str

@app.post("/api/extract-skills")
async def extract_skills(request: ExtractSkillsRequest):
    """
    Extract must-have skills from job description using LLM
    """
    from llm.gemini_client import GeminiClient
    
    try:
        llm_client = GeminiClient()
        
        prompt = f"""Extract skills from this job description with proficiency levels and types.

Job Description:
{request.jd_text}

For each skill, determine:
1. Skill name (lowercase, underscore-separated)
2. Proficiency level: basic_knowledge | comfortable | strong | expert
3. Type: must_have | nice_to_have

Rules:
- Must-have skills typically require higher proficiency (strong/expert)
- Nice-to-have skills typically require lower proficiency (basic_knowledge/comfortable)
- Look for keywords like "required", "must have", "essential" for must_have
- Look for keywords like "preferred", "nice to have", "bonus" for nice_to_have

Return ONLY a JSON array:
[
  {{"name": "product_strategy", "proficiency": "strong", "type": "must_have"}},
  {{"name": "user_research", "proficiency": "basic_knowledge", "type": "nice_to_have"}}
]

Return ONLY the JSON array, nothing else."""

        response = llm_client.model.generate_content(prompt)
        
        # Parse JSON from response
        import re
        json_match = re.search(r'\[.*?\]', response.text, re.DOTALL)
        if json_match:
            skills = json.loads(json_match.group())
            return {"skills": skills}
        
        raise ValueError("Could not parse skills from LLM response")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Skill extraction failed: {str(e)}")

@app.post("/api/map-skills")
async def map_skills(request: MapSkillsRequest):
    """
    Map skills to question categories dynamically
    Uses cache + LLM for unknown skills
    """
    from llm.gemini_client import GeminiClient
    from core.skill_mapper import SkillCategoryMapper
    
    try:
        llm_client = GeminiClient()
        mapper = SkillCategoryMapper()
        
        # Map skills to categories
        category_map = mapper.map_to_categories(request.skills, llm_client)
        
        return {
            "category_map": category_map,
            "categories": list(category_map.keys())
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Skill mapping failed: {str(e)}")

@app.post("/api/configure-interview")
async def configure_interview(request: ExtractSkillsRequest):
    """
    Comprehensive AI interview configuration from JD
    Extracts: parameters, skills, categories, interview flow, sample Q&A
    """
    from core.ai_configurator import AIConfigurator
    from utils.jd_hasher import hash_jd
    from datetime import datetime
    
    try:
        configurator = AIConfigurator()
        
        # Get comprehensive configuration
        config = configurator.configure_interview(request.jd_text)
        
        # Add metadata
        jd_hash = hash_jd(request.jd_text)
        
        return {
            "ai_metadata": {
                "last_analyzed": datetime.utcnow().isoformat() + "Z",
                "jd_hash": jd_hash,
                **config
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Interview configuration failed: {str(e)}")

# ==================== Enhanced Interview Start ====================

@app.post("/api/interview/start")
async def start_interview_with_position(
    position_id: Optional[str] = Form(None),
    resume_text: Optional[str] = Form(None),
    resume_file: Optional[UploadFile] = File(None),
    resume_id: Optional[str] = Form(None),
    expert_mode: Optional[str] = Form(None)
):
    """Start interview with position-based configuration"""
    try:
        # Get position data if provided
        position = None
        jd_content = ""
        
        if position_id:
            positions_data = load_json_file(POSITIONS_FILE)
            position = next((p for p in positions_data.get("positions", []) if p["id"] == position_id), None)
            if not position:
                raise HTTPException(status_code=404, detail="Position not found")
            jd_content = position.get("jd_text", "")
        
        # Get resume content
        resume_content = resume_text or ""
        if resume_file:
            import tempfile
            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(resume_file.filename)[1]) as tmp:
                content = await resume_file.read()
                tmp.write(content)
                temp_path = tmp.name
            resume_content = file_parser.parse_file(temp_path)
            os.remove(temp_path)
        
        # Analyze language
        result = jd_analyzer.analyze(
            jd_text=jd_content,
            resume_text=resume_content
        )
        
        # Create interview controller
        language = result["language"]
        is_expert_mode = expert_mode == 'true'
        controller = InterviewController(language, position_id, expert_mode=is_expert_mode)
        session_id = controller.context_manager.session_id
        
        # Attach position data model to controller if available
        if position and position.get("data_model"):
            controller.data_model = position["data_model"]
            
            # Configure question categories logic from position data
            if "question_categories" in controller.data_model:
                controller.question_categories = controller.data_model["question_categories"]
                
                # Calculate total questions based on enabled categories and counts
                total_q = 0
                for cat_config in controller.question_categories.values():
                    if isinstance(cat_config, dict) and cat_config.get("enabled", False):
                        total_q += cat_config.get("count", 0)
                
                if total_q > 0:
                    controller.total_questions = total_q
                    print(f"[INFO] Configured interview with {total_q} questions based on position settings")
        
        # Attach resume text for personalized first question
        if resume_content:
            controller.resume_text = resume_content
        
        # Store controller
        active_interviews[session_id] = controller
        
        # Save session config to file to persist duration
        try:
            sessions_data = load_json_file(SESSIONS_FILE)
            if "sessions" not in sessions_data:
                sessions_data["sessions"] = {}
                
            duration_minutes = 45
            if position and position.get("data_model"):
                duration_minutes = position["data_model"].get("duration_minutes", 45)
            
            sessions_data["sessions"][session_id] = {
                "session_id": session_id,
                "created_at": datetime.utcnow().isoformat(),
                "status": "pending",
                "position_id": position_id,
                "language": language,
                "duration_minutes": duration_minutes,
                "expert_mode": is_expert_mode,
                "question_categories": controller.question_categories
            }
            save_json_file(SESSIONS_FILE, sessions_data)
        except Exception as save_e:
            print(f"[WARN] Failed to save session config: {save_e}")
            # Continue - in-memory controller works for now
        
        return {
            "language": language,
            "confidence": result["confidence"],
            "session_id": session_id,
            "expert_mode": is_expert_mode,
            "position": position
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from result_processor import process_session_results

class EndInterviewRequest(BaseModel):
    ended_by: str = "candidate"  # candidate, admin, system
    reason: str = "completed"  # completed, ended_early, timeout

@app.post("/api/interview/{session_id}/end")
async def end_interview(session_id: str, request: EndInterviewRequest = None):
    """End an ongoing interview session"""
    print(f"[INFO] Request to end session {session_id}")
    
    # Extract ended_by and reason from request if provided
    ended_by = request.ended_by if request else "unknown"
    end_reason = request.reason if request else "completed"
    
    # 1. Update in-memory controller
    if session_id in active_interviews:
        controller = active_interviews[session_id]
        if hasattr(controller, 'context_manager'):
            controller.context_manager.context["status"] = "completed"
        
        # Broadcast end message to ALL connections (expert + candidate)
        try:
            tenant_id = get_tenant_from_session(session_id)
            await connection_manager.broadcast({
                "type": "session_end",
                "message": "The interview has been concluded.",
                "ended_by": ended_by
            }, tenant_id=tenant_id)
        except Exception as e:
            print(f"[ERROR] Failed to broadcast end message: {e}")
            
    # 2. Update sessions.json
    sessions_data = {}
    try:
        sessions_data = load_json_file(SESSIONS_FILE)
        if "sessions" in sessions_data and session_id in sessions_data["sessions"]:
            sessions_data["sessions"][session_id]["status"] = "completed"
            sessions_data["sessions"][session_id]["ended_at"] = datetime.utcnow().isoformat()
            sessions_data["sessions"][session_id]["ended_by"] = ended_by
            sessions_data["sessions"][session_id]["end_reason"] = end_reason
            save_json_file(SESSIONS_FILE, sessions_data)
    except Exception as e:
        print(f"[ERROR] Failed to update session file: {e}")
    
    # 3. Process Results & Generate Feedback
    try:
        print(f"[INFO] Triggering result processing for {session_id}")
        # If we couldn't load sessions_data above, try reloading, otherwise pass empty/fail gracefully inside
        if not sessions_data:
             sessions_data = load_json_file(SESSIONS_FILE)
             
        await process_session_results(session_id, sessions_data, logger, save_candidate_result)
    except Exception as e:
        print(f"[ERROR] Result processing in end_interview failed: {e}")
    
    # 4. Generate thank you tokens and URLs
    candidate_thank_you_token = f"cty_{uuid.uuid4().hex[:12]}"
    candidate_thank_you_url = f"/candidate/thank-you/{candidate_thank_you_token}"
    expert_thank_you_url = f"/expert/thank-you/{session_id}"
    
    # Store thank you token in results
    try:
        results_data = load_json_file(RESULTS_FILE)
        if session_id in results_data.get("results", {}):
            if "candidate" not in results_data["results"][session_id]:
                results_data["results"][session_id]["candidate"] = {}
            results_data["results"][session_id]["candidate"]["thank_you_token"] = candidate_thank_you_token
            results_data["results"][session_id]["candidate"]["thank_you_url"] = candidate_thank_you_url
            save_json_file(RESULTS_FILE, results_data)
    except Exception as e:
        print(f"[ERROR] Failed to save thank you tokens: {e}")

    return {
        "status": "success",
        "message": "Interview ended",
        "redirect_urls": {
            "candidate": candidate_thank_you_url,
            "expert": expert_thank_you_url
        }
    }

@app.post("/api/interview/{session_id}/process-results")
async def manual_process_results(session_id: str):
    """Manually trigger result processing for a session"""
    print(f"[INFO] Manual result processing requested for {session_id}")
    try:
        sessions_data = load_json_file(SESSIONS_FILE)
        result = await process_session_results(session_id, sessions_data, logger, save_candidate_result)
        if result:
            return {"status": "success", "result_id": result["id"]}
        else:
            raise HTTPException(status_code=404, detail="Session not found or log empty")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== Feedback & Results APIs ====================

class FeedbackRequest(BaseModel):
    session_id: str
    feedback_type: str = "detailed"  # detailed, short, skill-wise

class FeedbackApproval(BaseModel):
    session_id: str
    content: str
    status: str = "approved"

def get_session_result_path(session_id: str) -> Optional[str]:
    """Helper to find result file path from session ID"""
    try:
        sessions_data = load_json_file(SESSIONS_FILE)
        session_info = sessions_data.get("sessions", {}).get(session_id)
        if not session_info:
            return None
            
        candidate_name = session_info.get("candidate_name", "Anonymous Candidate")
        candidate_id = session_info.get("candidate_id")
        
        # We need to reconstruct how the filename would have been generated
        # This is tricky if date is involved in filename but not stored in session_info
        # For now, try default pattern
        filename = get_candidate_filename(candidate_name, candidate_id=session_id) # Using session_id as fallback unique ID
        
        # Check if file exists, if not, try with date (heuristic: today)
        filepath = os.path.join(CANDIDATE_RESULTS_DIR, filename)
        if os.path.exists(filepath):
            return filepath
            
        # Try finding partial match if date was used
        base_name = get_candidate_filename(candidate_name, candidate_id=session_id).replace("_result.json", "")
        for f in os.listdir(CANDIDATE_RESULTS_DIR):
            if f.startswith(base_name) and f.endswith(".json"):
                return os.path.join(CANDIDATE_RESULTS_DIR, f)
                
        return None
    except Exception as e:
        print(f"[ERROR] Finding candidate file failed: {e}")
        return None


@app.post("/api/feedback/generate")
async def generate_feedback(request: dict):
    """Generate AI feedback with type selection (short/long)"""
    session_id = request.get("session_id")
    feedback_type = request.get("feedback_type", "short")  # 'short' or 'long'
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    if feedback_type not in ["short", "long"]:
        raise HTTPException(status_code=400, detail="feedback_type must be 'short' or 'long'")
    
    try:
        # Load result
        results_data = load_json_file(RESULTS_FILE)
        result = results_data.get("results", {}).get(session_id)
        
        if not result:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Get session log
        log_data = logger.get_session_log(session_id)
        if not log_data:
            raise HTTPException(status_code=404, detail="Session log not found")
        
        # Map user-facing types to internal types
        internal_type = "detailed" if feedback_type == "long" else "short"
        
        # Generate feedback
        from llm.feedback_agent import FeedbackGenerator
        generator = FeedbackGenerator()
        
        feedback_content = generator.generate_feedback(
            log_data=log_data,
            result_data=result,
            feedback_type=internal_type
        )
        
        # Update result with generated feedback
        result["feedback"]["status"] = "GENERATED"
        result["feedback"]["type"] = feedback_type
        result["feedback"]["content"] = feedback_content
        result["feedback"]["generated_at"] = datetime.now().isoformat()
        
        save_json_file(RESULTS_FILE, results_data)
        
        return {
            "status": "success",
            "content": feedback_content,
            "type": feedback_type
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Feedback generation failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/feedback/approve")
async def approve_feedback(request: dict):
    """Approve generated feedback"""
    session_id = request.get("session_id")
    content = request.get("content")  # Allow editing before approval
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    try:
        results_data = load_json_file(RESULTS_FILE)
        result = results_data.get("results", {}).get(session_id)
        
        if not result:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Update feedback status and content
        result["feedback"]["status"] = "APPROVED"
        result["feedback"]["content"] = content or result["feedback"]["content"]
        result["feedback"]["approved_at"] = datetime.now().isoformat()
        
        save_json_file(RESULTS_FILE, results_data)
        
        return {
            "status": "success",
            "message": "Feedback approved"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Feedback approval failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/feedback/reject")
async def reject_feedback(request: dict):
    """Reject generated feedback"""
    session_id = request.get("session_id")
    reason = request.get("reason", "Not satisfactory")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    try:
        results_data = load_json_file(RESULTS_FILE)
        result = results_data.get("results", {}).get(session_id)
        
        if not result:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Reset feedback to allow regeneration
        result["feedback"]["status"] = "REJECTED"
        result["feedback"]["rejected_reason"] = reason
        result["feedback"]["type"] = None
        result["feedback"]["content"] = None
        
        save_json_file(RESULTS_FILE, results_data)
        
        return {
            "status": "success",
            "message": "Feedback rejected"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Feedback rejection failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/feedback/publish")
async def publish_feedback(request: dict):
    """Publish approved feedback to candidate"""
    session_id = request.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    try:
        results_data = load_json_file(RESULTS_FILE)
        result = results_data.get("results", {}).get(session_id)
        
        if not result:
            raise HTTPException(status_code=404, detail="Session not found")
        
        if result["feedback"]["status"] != "APPROVED":
            raise HTTPException(status_code=400, detail="Feedback must be approved before publishing")
        
        # Update status to published
        result["feedback"]["status"] = "PUBLISHED"
        result["feedback"]["published_at"] = datetime.now().isoformat()
        
        # Generate share token if not exists
        if "share" not in result or not result.get("share", {}).get("token"):
            share_token = f"share_{uuid.uuid4().hex[:12]}"
            result["share"] = {
                "token": share_token,
                "url": f"/share/{share_token}",
                "created_at": datetime.now().isoformat()
            }
        
        save_json_file(RESULTS_FILE, results_data)
        
        return {
            "status": "success",
            "message": "Feedback published",
            "share_url": result["share"]["url"]
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Feedback publishing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/share/{token}")
async def get_shared_feedback(token: str):
    """Get published feedback by share token"""
    try:
        results_data = load_json_file(RESULTS_FILE)
        
        # Find result by share token
        for session_id, result in results_data.get("results", {}).items():
            share_info = result.get("share", {})
            if share_info.get("token") == token:
                # Only return published feedback
                if result.get("feedback", {}).get("status") != "PUBLISHED":
                    raise HTTPException(status_code=404, detail="Feedback not published yet")
                
                # Return safe data for public viewing
                return {
                    "candidate_name": result.get("candidate", {}).get("name") or "Candidate",
                    "position_title": result.get("position", {}).get("title") or "Position",
                    "interview_date": result.get("date", datetime.now().isoformat()),
                    "feedback_content": result.get("feedback", {}).get("content", ""),
                    "overall_score": result.get("overall_metrics", {}).get("total_score", 0)
                }
        
        raise HTTPException(status_code=404, detail="Share link not found")
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Share link fetch failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/feedback/generate")
async def generate_feedback(request: dict):
    """Generate AI feedback with type selection (short/long)"""
    session_id = request.get("session_id")
    feedback_type = request.get("feedback_type", "short")  # 'short' or 'long'
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    if feedback_type not in ["short", "long"]:
        raise HTTPException(status_code=400, detail="feedback_type must be 'short' or 'long'")
    
    try:
        # Load result
        results_data = load_json_file(RESULTS_FILE)
        result = results_data.get("results", {}).get(session_id)
        
        if not result:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Get session log
        log_data = logger.get_session_log(session_id)
        if not log_data:
            raise HTTPException(status_code=404, detail="Session log not found")
        
        # Map user-facing types to internal types
        internal_type = "detailed" if feedback_type == "long" else "short"
        
        # Generate feedback
        from llm.feedback_agent import FeedbackGenerator
        generator = FeedbackGenerator()
        
        feedback_content = generator.generate_feedback(
            log_data=log_data,
            result_data=result,
            feedback_type=internal_type
        )
        
        # Initialize feedback field if it doesn't exist (for old results)
        if "feedback" not in result:
            result["feedback"] = {
                "status": "NOT_GENERATED",
                "type": None,
                "content": None,
                "generated_at": None,
                "approved_at": None,
                "published_at": None,
                "rejected_reason": None
            }
        
        # Update result with generated feedback
        result["feedback"]["status"] = "GENERATED"
        result["feedback"]["type"] = feedback_type
        result["feedback"]["content"] = feedback_content
        result["feedback"]["generated_at"] = datetime.now().isoformat()
        
        save_json_file(RESULTS_FILE, results_data)
        
        return {
            "status": "success",
            "content": feedback_content,
            "type": feedback_type
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Feedback generation failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/feedback/approve")
async def approve_feedback(request: dict):
    """Approve generated feedback"""
    session_id = request.get("session_id")
    content = request.get("content")  # Allow editing before approval
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    try:
        results_data = load_json_file(RESULTS_FILE)
        result = results_data.get("results", {}).get(session_id)
        
        if not result:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Update feedback status and content
        result["feedback"]["status"] = "APPROVED"
        result["feedback"]["content"] = content or result["feedback"]["content"]
        result["feedback"]["approved_at"] = datetime.now().isoformat()
        
        save_json_file(RESULTS_FILE, results_data)
        
        return {
            "status": "success",
            "message": "Feedback approved"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Feedback approval failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/feedback/reject")
async def reject_feedback(request: dict):
    """Reject generated feedback"""
    session_id = request.get("session_id")
    reason = request.get("reason", "Not satisfactory")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    try:
        results_data = load_json_file(RESULTS_FILE)
        result = results_data.get("results", {}).get(session_id)
        
        if not result:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Reset feedback to allow regeneration
        result["feedback"]["status"] = "REJECTED"
        result["feedback"]["rejected_reason"] = reason
        result["feedback"]["type"] = None
        result["feedback"]["content"] = None
        
        save_json_file(RESULTS_FILE, results_data)
        
        return {
            "status": "success",
            "message": "Feedback rejected"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Feedback rejection failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/feedback/publish")
async def publish_feedback(request: dict):
    """Publish approved feedback to candidate"""
    session_id = request.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    try:
        results_data = load_json_file(RESULTS_FILE)
        result = results_data.get("results", {}).get(session_id)
        
        if not result:
            raise HTTPException(status_code=404, detail="Session not found")
        
        if result["feedback"]["status"] != "APPROVED":
            raise HTTPException(status_code=400, detail="Feedback must be approved before publishing")
        
        # Update status to published
        result["feedback"]["status"] = "PUBLISHED"
        result["feedback"]["published_at"] = datetime.now().isoformat()
        
        # Generate share token if not exists
        if "share" not in result or not result.get("share", {}).get("token"):
            share_token = f"share_{uuid.uuid4().hex[:12]}"
            result["share"] = {
                "token": share_token,
                "url": f"/share/{share_token}",
                "created_at": datetime.now().isoformat()
            }
        
        save_json_file(RESULTS_FILE, results_data)
        
        return {
            "status": "success",
            "message": "Feedback published",
            "share_url": result["share"]["url"]
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Feedback publishing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/results/{session_id}/status")
async def get_result_status(session_id: str):
    """Check if feedback is approved for a session"""
    result_path = get_session_result_path(session_id)
    if not result_path or not os.path.exists(result_path):
        return {"status": "PENDING", "message": "Processing"}
        
    try:
        with open(result_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        for interview in data.get("interviews", []):
            if interview.get("session_id") == session_id:
                report = interview.get("feedback_report", {})
                if report.get("status") == "APPROVED":
                    return {
                        "status": "APPROVED",
                        "content": report.get("content"),
                        "recommendation": report.get("recommendation", "N/A")
                    }
    except:
        pass
        

        
    return {"status": "PENDING"}

@app.get("/api/admin/results")
async def list_interview_results():
    """List all interview results"""
    try:
        results = []
        results_context_cache = None
        results_dir = Config.CANDIDATE_RESULTS_DIR
        
        if not os.path.exists(results_dir):
            return {"results": []}

        files = os.listdir(results_dir)
        
        # Load context once if needed (lazy loading optimization could be here, but keeping original flow)
        # Actually original flow checks inside loop. We initialize to None here.
        
        for filename in files:
            if filename.endswith(".json"):
                path = os.path.join(results_dir, filename)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        
                        # Load positions and accounts context if not populated
                        if not results_context_cache:
                            try:
                                positions = load_json_file(POSITIONS_FILE).get("positions", [])
                                accounts = load_json_file(ACCOUNTS_FILE).get("accounts", [])
                                results_context_cache = {
                                    "positions": {p["id"]: p["title"] for p in positions},
                                    "accounts": {a["id"]: a["name"] for a in accounts}
                                }
                            except Exception:
                                results_context_cache = {"positions": {}, "accounts": {}}

                        human_readable_name = data.get("candidate", {}).get("name", "Unknown")
                        
                        if "interviews" in data:
                            for interview in data["interviews"]:
                                # Enrich with context
                                pos_obj = interview.get("position", {})
                                pos_title = pos_obj.get("title") or results_context_cache["positions"].get(interview.get("position_id"), "Unknown Position")
                                
                                # Account logic: Not explicitly stored in position obj in old records, but maybe in new ones
                                acc_name = pos_obj.get("account") or results_context_cache["accounts"].get(interview.get("account_id"), "Unknown Account")
                                
                                results.append({
                                    "result_id": interview.get("id") or interview.get("session_id"),
                                    "session_id": interview.get("session_id"),
                                    "candidate_name": human_readable_name,
                                    "position_title": pos_title,
                                    "account_name": acc_name,
                                    "main_skill": interview.get("main_skill", "General"),
                                    "date": interview.get("created_at") or interview.get("timestamp"), # Prefer created_at
                                    "overall_score": interview.get("overall_metrics", {}).get("total_score", 0), # Correct path
                                    "status": interview.get("feedback_report", {}).get("status", "PENDING"),
                                    "recommendation": interview.get("admin_feedback", {}).get("recommendation", "pending"),
                                    "candidate_file": filename,
                                    "share_token": interview.get("shareable_link", {}).get("token")
                                })
                except Exception:
                    continue # Skip malformed files
                    
        # Sort by date descending
        results.sort(key=lambda x: x.get("date") or "", reverse=True)
        return {"results": results}
    except Exception as e:
        print(f"[ERROR] listing results: {e}")
        return {"results": [], "error": str(e)}

@app.get("/api/expert/results")
async def get_expert_results():
    """Get all interview results for expert review"""
    try:
        # Load all results
        results_data = load_json_file(RESULTS_FILE)
        all_results = results_data.get("results", {})
        
        # Convert to list format for frontend
        results_list = []
        for session_id, result in all_results.items():
            result["session_id"] = session_id
            results_list.append(result)
        
        # Filter out test/unknown sessions
        filtered_results = [
            r for r in results_list
            if (
                # Exclude Unknown positions
                r.get("position", {}).get("title") != "Unknown Position"
                # Exclude test candidate names
                and r.get("candidate", {}).get("name") not in ["Unknown", "John Smith", "Jane Doe", "John Doe"]
                # Exclude test session IDs
                and not r.get("session_id", "").startswith("test_session")
            )
        ]
        
        # Sort by date (newest first)
        filtered_results.sort(key=lambda x: x.get("date", ""), reverse=True)
        
        return {"results": filtered_results}
    except Exception as e:
        print(f"[ERROR] Failed to load results: {e}")
        return {"results": [], "error": str(e)}

@app.get("/api/sessions/active")
async def get_active_sessions():
    """Get all active/in-progress interview sessions for admin rejoin"""
    try:
        sessions_data = load_json_file(SESSIONS_FILE)
        sessions = sessions_data.get("sessions", {})
        
        # Calculate cutoff time (6 hours ago)
        from datetime import datetime, timedelta
        cutoff_time = datetime.now() - timedelta(hours=6)
        
        active_sessions = []
        for session_id, session in sessions.items():
            status = session.get("status", "")
            candidate_name = session.get("candidate_name", "Unknown")
            
            # Skip if ended, not active/pending, or unknown candidate
            if session.get("ended_at") or status not in ["active", "pending"]:
                continue
            if candidate_name == "Unknown":
                continue
                
            # Skip if older than 6 hours
            created_at_str = session.get("created_at", "")
            if created_at_str:
                try:
                    created_at = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
                    if created_at.replace(tzinfo=None) < cutoff_time:
                        continue
                except:
                    pass
            
            active_sessions.append({
                "session_id": session_id,
                "candidate_name": candidate_name,
                "language": session.get("language", "python"),
                "created_at": created_at_str,
                "duration_minutes": session.get("duration_minutes", 30),
                "status": status,
                "candidate_account": session.get("candidate_account", "N/A"),
                "candidate_role": session.get("candidate_role", "N/A"),
            })
        
        # Sort by created_at descending (most recent first)
        active_sessions.sort(key=lambda x: x.get("created_at") or "", reverse=True)
        return {"sessions": active_sessions}
    except Exception as e:
        print(f"[ERROR] get_active_sessions: {e}")
        return {"sessions": [], "error": str(e)}

@app.post("/api/sessions/cleanup")
async def cleanup_stale_sessions():
    """Mark stale sessions as expired (older than 2 hours with no activity)"""
    try:
        from datetime import datetime, timedelta
        sessions_data = load_json_file(SESSIONS_FILE)
        sessions = sessions_data.get("sessions", {})
        
        cutoff_time = datetime.now() - timedelta(hours=2)
        cleaned_count = 0
        
        for session_id, session in sessions.items():
            status = session.get("status", "")
            if status not in ["active", "pending"]:
                continue
            if session.get("ended_at"):
                continue
                
            # Check if older than cutoff
            created_at_str = session.get("created_at", "")
            if created_at_str:
                try:
                    created_at = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
                    if created_at.replace(tzinfo=None) < cutoff_time:
                        sessions[session_id]["status"] = "expired"
                        sessions[session_id]["ended_at"] = datetime.now().isoformat()
                        sessions[session_id]["end_reason"] = "auto_cleanup"
                        cleaned_count += 1
                except:
                    pass
        
        if cleaned_count > 0:
            save_json_file(SESSIONS_FILE, sessions_data)
        
        return {"status": "success", "cleaned_count": cleaned_count}
    except Exception as e:
        print(f"[ERROR] cleanup_stale_sessions: {e}")
        return {"status": "error", "error": str(e)}

@app.post("/api/sessions/{session_id}/abandon")
async def abandon_session(session_id: str):
    """Abandon a specific session"""
    try:
        from datetime import datetime
        sessions_data = load_json_file(SESSIONS_FILE)
        sessions = sessions_data.get("sessions", {})
        
        if session_id not in sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        sessions[session_id]["status"] = "abandoned"
        sessions[session_id]["ended_at"] = datetime.now().isoformat()
        sessions[session_id]["end_reason"] = "admin_abandoned"
        
        save_json_file(SESSIONS_FILE, sessions_data)
        return {"status": "success", "session_id": session_id}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] abandon_session: {e}")
        return {"status": "error", "error": str(e)}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, view: str = "candidate", tenant_id: str = "global"):
    """WebSocket endpoint for interview communication with tenant isolation"""
    # Backward compatibility: normalize admin → expert
    if view == "admin":
        view = "expert"
        print(f"[INFO] Redirected admin view to expert view for backward compatibility")
    try:
        print(f"[DEBUG] WebSocket connection attempt, view={view}, tenant={tenant_id}")
        debug_logger.info(f"WebSocket connection attempt, view={view}, tenant={tenant_id}")
        await connection_manager.connect(websocket, view, tenant_id=tenant_id)
        print(f"[DEBUG] WebSocket connected successfully, view={view}, tenant={tenant_id}")
        debug_logger.info(f"WebSocket connected successfully, view={view}, tenant={tenant_id}")
    except Exception as connect_error:
        import traceback
        error_msg = f"Failed to accept WebSocket connection: {connect_error}\n{traceback.format_exc()}"
        print(f"[ERROR] {error_msg}")
        debug_logger.error(error_msg)
        # Properly close the connection and return
        try:
            await websocket.close(code=1011, reason="Connection failed")
        except:
            pass
        return
    
    # Send initial connection confirmation (optional - don't fail if this fails)
    try:
        await websocket.send_json({
            "type": "connected",
            "message": "WebSocket connected successfully"
        })
        print(f"[DEBUG] Sent connection confirmation to {view}")
    except Exception as confirm_error:
        print(f"[WARN] Failed to send connection confirmation (non-critical): {confirm_error}")
        # Don't fail the connection if confirmation fails
        pass
    
    session_id = None
    controller = None
    
    try:
        while True:
            try:
                print(f"[DEBUG] Waiting for WebSocket message...")
                data = await websocket.receive_json()
                message_type = data.get("type")
                
                print(f"[DEBUG] Received WebSocket message: type={message_type}, data={data}")
            except WebSocketDisconnect:
                print(f"[DEBUG] WebSocket disconnected normally during receive")
                break
            except RuntimeError as re:
                if "disconnect message has been received" in str(re):
                    print(f"[DEBUG] WebSocket connection closed (RuntimeError)")
                    break
                print(f"[ERROR] runtime error: {re}")
                break
            except Exception as receive_error:
                import traceback
                print(f"[ERROR] Error receiving WebSocket message: {receive_error}")
                print(traceback.format_exc())
                break
            
            if message_type == "start_interview":
                session_id = data.get("session_id")
                print(f"[DEBUG] start_interview message received, session_id={session_id}, view={view}")
                if not session_id:
                    await websocket.send_json({
                        "type": "error",
                        "message": "No session_id provided"
                    })
                    continue
                
                # Check if session exists in active interviews
                if session_id not in active_interviews:
                    # Try to restore session - first check sessions.json (new sessions), then log.json (resumed sessions)
                    try:
                        session_found = False
                        
                        # First, check if session exists in sessions.json (for new sessions that haven't started yet)
                        sessions_data = load_json_file(SESSIONS_FILE)
                        sessions_dict = sessions_data.get("sessions", {})
                        session_info = sessions_dict.get(session_id)
                        
                        print(f"[DEBUG] Looking for session {session_id} in sessions.json ({len(sessions_dict)} total sessions)")
                        
                        if session_info:
                            print(f"[DEBUG] ✓ Found session {session_id} in sessions.json")
                            print(f"[DEBUG] Found session {session_id} in sessions.json: {session_info.get('status', 'unknown')}")
                            
                            # CRITICAL: Check if session is already completed
                            if session_info.get("status") == "completed":
                                print(f"[INFO] Session {session_id} is completed. Sending completion message.")
                                await websocket.send_json({
                                    "type": "session_completed",
                                    "message": "This interview session has been completed.",
                                    "redirect": "/results" # Optional
                                })
                                # We don't want to start a new controller or resume
                                # Just keep the socket open for a moment or close it? 
                                # Closing might trigger reconnect logic in frontend. 
                                # Better to just return or break loop.
                                # Wait a bit to ensure message is sent
                                import asyncio
                                await asyncio.sleep(1)
                                return

                            # Session exists in sessions.json - this is a new session
                            try:
                                # Get position to determine language
                                positions_data = load_json_file(POSITIONS_FILE)
                                position_id = session_info.get("position_id")
                                position = next((p for p in positions_data.get("positions", []) if p["id"] == position_id), None) if position_id else None
                                
                                # Default to python, but could be determined from position/JD
                                language = "python"  # Default, could be enhanced to detect from position
                                is_expert = view == "expert"
                                
                                print(f"[DEBUG] Creating controller for session {session_id}, position_id={position_id}, view={view}")
                                
                                # Create new controller with correct session_id from start
                                controller = InterviewController(
                                    language, 
                                    position_id, 
                                    expert_mode=is_expert,
                                    session_id=session_id  # Pass session_id directly - no override needed!
                                )
                                
                                # Set question categories and difficulty distribution if present
                                if session_info.get("question_categories"):
                                    controller.question_categories = session_info["question_categories"]
                                    # Override default question count with configuration
                                    total_q = 0
                                    try:
                                        for cfg in controller.question_categories.values():
                                            if isinstance(cfg, dict):
                                                if cfg.get("enabled", True):
                                                    total_q += int(cfg.get("count", 0))
                                            elif isinstance(cfg, (int, str)):
                                                # Backward compatibility for old format { "cat": count }
                                                try:
                                                    total_q += int(cfg)
                                                except ValueError:
                                                    pass # Skip invalid values
                                    except Exception as e:
                                        print(f"[WARN] Error calculating total questions on restore: {e}")
                                    
                                    if total_q > 0:
                                        controller.total_questions = total_q
                                        print(f"[DEBUG] Set total_questions to {total_q} from configuration")

                                if session_info.get("difficulty_distribution"):
                                    controller.difficulty_distribution = session_info["difficulty_distribution"]
                                
                                # Set resume text if available
                                candidate_id = session_info.get("candidate_id")
                                if candidate_id and candidate_id != 'custom':
                                    resumes_file_data = load_json_file(RESUMES_FILE)
                                    candidate_resume = next((r for r in resumes_file_data.get("resumes", []) if r["id"] == candidate_id), None)
                                    if candidate_resume:
                                        controller.resume_text = candidate_resume.get("text", "")
                                
                                # Set position data model if available
                                if position and position.get("data_model"):
                                    controller.data_model = position["data_model"]
                                
                                # Update session status to active
                                session_info["status"] = "active"
                                sessions_data["sessions"][session_id] = session_info
                                save_json_file(SESSIONS_FILE, sessions_data)
                                
                                active_interviews[session_id] = controller
                                session_found = True
                                print(f"[DEBUG] Successfully created controller for session {session_id}")
                            except Exception as inner_e:
                                import traceback
                                print(f"[ERROR] Error creating controller for session {session_id}: {inner_e}")
                                print(traceback.format_exc())
                                raise  # Re-raise to be caught by outer exception handler
                        
                        # If not found in sessions.json, check log.json (for resumed sessions)
                        if not session_found:
                            print(f"[DEBUG] Session {session_id} not found in sessions.json, checking log.json...")
                            log_data = logger.get_log_data()
                            
                            for session in log_data.get("interview_sessions", []):
                                if session.get("session_id") == session_id:
                                    # Restore session
                                    language = session.get("detected_language", "python")
                                    jd_id = session.get("jd_id")
                                    # Check if expert view - set expert_mode accordingly
                                    is_expert = view == "expert"
                                    # Create controller with correct session_id from start
                                    controller = InterviewController(
                                        language, 
                                        jd_id, 
                                        expert_mode=is_expert,
                                        session_id=session_id  # Pass session_id directly
                                    )
                                    
                                    # Restore interview state from log
                                    questions = session.get("questions", [])
                                    if questions:
                                        # Restore context from questions
                                        controller.context_manager.context["interview_context"]["round_summaries"] = []
                                        
                                        # Find the last question that was asked but not completed
                                        last_question = questions[-1]
                                        question_id = last_question.get("question_id")
                                        
                                        # Check if last question has responses
                                        responses = last_question.get("responses", [])
                                        if responses:
                                            # Question was answered, check if follow-ups are complete
                                            last_response = responses[-1]
                                            followup_num = last_response.get("followup_number", 0)
                                            
                                            # If follow-ups are incomplete, restore current question
                                            if followup_num < Config.MAX_FOLLOWUPS_PER_QUESTION:
                                                # Find question in question bank
                                                from core.question_manager import QuestionManager
                                                qm = QuestionManager(language)
                                                all_questions = qm.load_questions()
                                                for q in all_questions:
                                                    if q.get("id") == question_id:
                                                        controller.current_question = {
                                                            "type": "question",
                                                            "question_id": q["id"],
                                                            "text": q["text"],
                                                            "question_type": q["type"],
                                                            "topic": q.get("topic"),
                                                            "round_number": last_question.get("round_number", len(questions))
                                                        }
                                                        controller.current_followup_count = followup_num
                                                        break
                                        else:
                                            # Question was asked but not answered yet
                                            from core.question_manager import QuestionManager
                                            qm = QuestionManager(language)
                                            all_questions = qm.load_questions()
                                            for q in all_questions:
                                                if q.get("id") == question_id:
                                                    controller.current_question = {
                                                        "type": "question",
                                                        "question_id": q["id"],
                                                        "text": q["text"],
                                                        "question_type": q["type"],
                                                        "topic": q.get("topic"),
                                                        "round_number": last_question.get("round_number", len(questions))
                                                    }
                                                    break
                                    
                                    active_interviews[session_id] = controller
                                    session_found = True
                                    break
                        
                        if not session_found:
                            # Check if session expired
                            if session_info:
                                expires_at_str = session_info.get("expires_at")
                                if expires_at_str:
                                    try:
                                        expires_at = datetime.fromisoformat(expires_at_str)
                                        if datetime.now() > expires_at:
                                            print(f"[DEBUG] Session {session_id} has expired (expired at {expires_at_str})")
                                            await websocket.send_json({
                                                "type": "error",
                                                "message": f"Session expired. Please start a new interview from the landing page."
                                            })
                                            continue
                                    except Exception as exp_check:
                                        print(f"[WARN] Error checking session expiry: {exp_check}")
                            
                            print(f"[ERROR] Session {session_id} not found in sessions.json or log.json")
                            print(f"[DEBUG] Available sessions in sessions.json: {list(sessions_dict.keys())[:10] if sessions_dict else 'None'}")
                            await websocket.send_json({
                                "type": "error",
                                "message": f"Session {session_id} not found. Please start a new interview from the landing page."
                            })
                            # Give client time to receive the error message before closing
                            await asyncio.sleep(0.5)
                            continue
                        await asyncio.sleep(0.5)
                        continue
                    except Exception as e:
                        import traceback
                        error_trace = traceback.format_exc()
                        print(f"[ERROR] Failed to restore session {session_id} for view '{view}': {e}")
                        print(f"[ERROR] Traceback:\n{error_trace}")
                        debug_logger.error(f"Failed to restore session {session_id}: {e}\n{error_trace}")
                        await websocket.send_json({
                            "type": "error",
                            "message": f"Could not restore session: {str(e)}. Please start a new interview."
                        })
                        # Give client time to receive the error message before closing
                        await asyncio.sleep(0.5)
                        continue
                
                # Ensure controller exists in active_interviews after restoration
                if session_id not in active_interviews:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Session {session_id} could not be initialized. Please start a new interview."
                    })
                    continue
                
                controller = active_interviews[session_id]
                
                # If expert connects, enable expert mode on the controller
                if view == "expert":
                    controller.expert_mode = True
                    print(f"Expert mode enabled for session {session_id}")
                
                # Send session configuration (duration)
                # Send session configuration (duration and start time)
                try:
                    session_duration = 45 # Default
                    start_time = datetime.utcnow().isoformat()
                    
                    # Re-load sessions to get duration and start time
                    sessions_data = load_json_file(SESSIONS_FILE)
                    if sessions_data and "sessions" in sessions_data and session_id in sessions_data["sessions"]:
                         session_info = sessions_data["sessions"][session_id]
                         session_duration = session_info.get("duration_minutes", 45)
                         start_time = session_info.get("created_at", start_time)
                    
                    await websocket.send_json({
                        "type": "configuration",
                        "duration_minutes": session_duration,
                        "start_time": start_time
                    })
                    print(f"[DEBUG] Sent configuration: duration={session_duration}, start={start_time}")
                except Exception as config_e:
                    print(f"[WARN] Failed to send configuration: {config_e}")
                    # Continue without config (client defaults to 45)
                
                # Send greeting
                try:
                    print(f"[DEBUG] Sending greeting for session {session_id}, view={view}")
                    greeting = controller.start_interview()
                    print(f"[DEBUG] Greeting message: {greeting}")
                    await message_handler.handle_message(greeting, view)
                    print(f"[DEBUG] Greeting sent successfully")
                except Exception as greeting_error:
                    import traceback
                    print(f"[ERROR] Error sending greeting: {greeting_error}")
                    print(traceback.format_exc())
                    # Continue anyway - greeting is not critical
                
                # Send current question if exists (for reconnection), otherwise get next
                # Always send to both views when reconnecting
                try:
                    if controller.current_question:
                        print(f"[DEBUG] Resending existing question: {controller.current_question}")
                        # Resend current question for reconnection
                        # Convert to proper format if needed
                        if isinstance(controller.current_question, dict):
                            question_data = {
                                "type": "question",
                                "question_id": controller.current_question.get("question_id") or controller.current_question.get("id"),
                                "text": controller.current_question.get("text"),
                                "question_type": controller.current_question.get("question_type") or controller.current_question.get("type"),
                                "topic": controller.current_question.get("topic"),
                                "round_number": controller.current_question.get("round_number", 1),
                                "question_number": controller.current_question.get("question_number", controller.current_question.get("round_number", 1))
                            }
                            await message_handler.send_question(question_data, view)
                        else:
                            await message_handler.send_question(controller.current_question, view)
                    else:
                        # Send first question
                        print(f"[DEBUG] Getting next question for session {session_id}")
                        try:
                            question = controller.get_next_question()
                            print(f"[DEBUG] Next question: {question}")
                            if question:
                                await message_handler.send_question(question, view)
                                print(f"[DEBUG] Question sent successfully")
                            else:
                                print(f"[ERROR] No question returned from get_next_question()")
                                # Send error message to client
                                await websocket.send_json({
                                    "type": "error",
                                    "message": "Could not generate question. Please try again."
                                })
                        except Exception as question_error:
                            import traceback
                            print(f"[ERROR] Error getting/generating question: {question_error}")
                            print(traceback.format_exc())
                            # Send error message to client
                            await websocket.send_json({
                                "type": "error",
                                "message": f"Error generating question: {str(question_error)[:100]}"
                            })
                except Exception as question_send_error:
                    import traceback
                    print(f"[ERROR] Error sending question: {question_send_error}")
                    print(traceback.format_exc())
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Error sending question: {str(question_send_error)[:100]}"
                    })
                
                try:
                    progress = controller.get_progress()
                    print(f"[DEBUG] Sending progress: {progress}")
                    await message_handler.send_progress(progress)
                except Exception as progress_error:
                    import traceback
                    print(f"[ERROR] Error sending progress: {progress_error}")
                    print(traceback.format_exc())
                    # Progress is not critical, continue
            
            elif message_type == "response":
                if not controller:
                    continue
                
                response_text = data.get("text", "")
                response_type = data.get("response_type", "initial")
                
                print(f"\n[WEBSOCKET] Received answer submission")
                print(f"[WEBSOCKET] Response type: {response_type}")
                print(f"[WEBSOCKET] Response text: {response_text[:200]}...")
                print(f"[WEBSOCKET] Expert mode: {controller.expert_mode}")
                
                # Process response
                result = controller.process_response(response_text, response_type)
                
                print(f"[WEBSOCKET] Response processed")
                print(f"[WEBSOCKET] Evaluation score: {result.get('evaluation', {}).get('overall_score', 'N/A')}")
                print(f"[WEBSOCKET] Pending approval: {result.get('pending_approval')}")
                print(f"[WEBSOCKET] Has followup: {result.get('followup') is not None}")
                
                # Send evaluation (admin/expert only)
                await message_handler.send_evaluation(result["evaluation"])
                
                # Send strategy change (admin/expert only)
                await message_handler.send_strategy_change(result["strategy"])
                
                # Send log update (admin/expert only)
                log_data = logger.get_log_data()
                await message_handler.send_log_update({
                    "session_id": session_id,
                    "latest_entry": log_data
                })
                
                # Expert mode: send pending followup for approval
                if result.get("pending_approval") and result.get("pending_followup"):
                    print(f"Sending pending_followup to expert: {result['pending_followup'].get('text', '')[:50]}...")
                    # Send pending followup to expert for review
                    await message_handler.send_to_admin({
                        "type": "pending_followup",
                        "data": {
                            "followup": result["pending_followup"],
                            "evaluation": result["evaluation"],
                            "strategy": result["strategy"]
                        }
                    })
                    await message_handler.send_progress(controller.get_progress())
                # Normal mode: send follow-up directly
                elif result.get("followup"):
                    progress = controller.get_progress()
                    await message_handler.send_followup(result["followup"], progress)
                    await message_handler.send_progress(progress)
                else:
                    # No more follow-ups, complete round
                    controller.complete_round()
                    
                    # Check if interview complete
                    if controller.is_interview_complete():
                        final_summary = controller.finalize_interview()
                        
                        # Broadcast completion to both views
                        await broadcast_to_session(session_id, {
                            "type": "interview_completed",
                            "data": {
                                "ended_by": "system",
                                "reason": "all_questions_completed",
                                "session_id": session_id
                            }
                        })
                        
                        # Save detailed candidate result
                        try:
                            sessions_data = load_json_file(SESSIONS_FILE)
                            session_info = sessions_data.get("sessions", {}).get(session_id, {})
                            
                            candidate_id = session_info.get("candidate_id", "anonymous")
                            candidate_name = session_info.get("candidate_name", "Anonymous Candidate")
                            
                            # Extract metrics
                            summary_context = final_summary.get("summary", {})
                            interview_ctx = summary_context.get("interview_context", {})
                            overall_metrics = interview_ctx.get("overall_metrics", {})
                            avg_score = overall_metrics.get("average_score", 0)
                            
                            result_data = {
                                "session_id": session_id,
                                "timestamp": datetime.utcnow().isoformat(),
                                "position_id": session_info.get("position_id"),
                                "overall_score": avg_score,
                                "status": "Recommended" if avg_score >= 70 else "Not Recommended",
                                "metrics": overall_metrics,
                                "rounds_summary": interview_ctx.get("round_summaries", [])
                            }
                            
                            saved_path = save_candidate_result(candidate_name, candidate_id, result_data)
                            print(f"[INFO] Saved candidate result to {saved_path}")
                            
                        except Exception as save_res_err:
                            print(f"[ERROR] Failed to save candidate result: {save_res_err}")
                            import traceback
                            print(traceback.format_exc())

                        # Persist completion status to sessions.json
                        try:
                            sessions_data = load_json_file(SESSIONS_FILE)
                            if "sessions" in sessions_data and session_id in sessions_data["sessions"]:
                                sessions_data["sessions"][session_id]["status"] = "completed"
                                sessions_data["sessions"][session_id]["ended_at"] = datetime.utcnow().isoformat()
                                save_json_file(SESSIONS_FILE, sessions_data)
                                print(f"[DEBUG] Marked session {session_id} as completed in sessions.json")
                        except Exception as e:
                            print(f"[ERROR] Failed to update session file on completion: {e}")
                            
                        await message_handler.send_session_end()
                    else:
                        # Get next question
                        next_question = controller.get_next_question()
                        if next_question:
                            # Generate transition
                            transition = controller.gemini_client.generate_transition(
                                controller.context_manager.get_context()
                            )
                            await message_handler.handle_message({
                                "type": "transition",
                                "message": transition
                            }, view)
                            
                            await message_handler.send_question(next_question, view)
                            await message_handler.send_progress(controller.get_progress())
            
            
            elif message_type == "get_progress":
                if controller:
                    await message_handler.send_progress(controller.get_progress())
            
            elif message_type == "interview_ended":
                # Handle interview end from either side
                print(f"[INFO] interview_ended message received from {view}, session_id={session_id}")
                
                # Broadcast completion to both views
                await broadcast_to_session(session_id, {
                    "type": "interview_completed",
                    "data": {
                        "ended_by": data.get("ended_by", view),
                        "session_id": session_id
                    }
                })
                
                # Close the interview session
                if session_id in active_sessions:
                    active_sessions[session_id]["status"] = "completed"
                ended_by = data.get("ended_by", view)
                
                # Mark session as completed
                try:
                    sessions_data = load_json_file(SESSIONS_FILE)
                    if "sessions" in sessions_data and session_id in sessions_data["sessions"]:
                        sessions_data["sessions"][session_id]["status"] = "completed"
                        sessions_data["sessions"][session_id]["ended_at"] = datetime.utcnow().isoformat()
                        sessions_data["sessions"][session_id]["ended_by"] = ended_by
                        sessions_data["sessions"][session_id]["end_reason"] = data.get("reason", "ended_early")
                        save_json_file(SESSIONS_FILE, sessions_data)
                        print(f"[INFO] Session {session_id} marked as completed by {ended_by}")
                except Exception as e:
                    print(f"[ERROR] Failed to update session status: {e}")
                
                # Broadcast to ALL connections (expert + candidate)
                try:
                    tenant_id = get_tenant_from_session(session_id)
                    await connection_manager.broadcast({
                        "type": "session_end",
                        "message": "The interview has been concluded.",
                        "ended_by": ended_by
                    }, tenant_id=tenant_id)
                    print(f"[INFO] Broadcasted session_end to all connections in tenant {tenant_id}")
                except Exception as e:
                    print(f"[ERROR] Failed to broadcast session_end: {e}")
                
                # Trigger result processing
                try:
                    print(f"[INFO] Triggering result processing for {session_id}")
                    await process_session_results(session_id, sessions_data, logger, save_candidate_result)
                except Exception as e:
                    print(f"[ERROR] Result processing failed: {e}")
            
            elif message_type == "get_log":
                if view == "admin" or view == "expert":
                    log_data = logger.get_log_data()
                    await message_handler.send_log_update({
                        "session_id": session_id,
                        "log_data": log_data
                    })
            
            elif message_type == "typing":
                # Broadcast typing updates to admin connections only
                typing_text = data.get("text", "")
                await message_handler.send_typing_update({
                    "session_id": session_id,
                    "text": typing_text
                })
    
    except WebSocketDisconnect:
        print(f"[DEBUG] WebSocket disconnected normally, view={view}, tenant={tenant_id}, session_id={session_id}")
        connection_manager.disconnect(websocket, view, tenant_id=tenant_id)
        if session_id and session_id in active_interviews:
            # Clean up if needed
            pass
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"[ERROR] WebSocket error: {e}")
        print(f"[ERROR] Traceback:\n{error_trace}")
        debug_logger.error(f"WebSocket error: {e}\n{error_trace}")
        try:
            await websocket.send_json({
                "type": "error",
                "message": f"WebSocket error: {str(e)}"
            })
        except:
            pass
        connection_manager.disconnect(websocket, view, tenant_id=tenant_id)

@app.get("/api/log/{session_id}")
async def get_log(session_id: str):
    """Get log for specific session"""
    log_data = logger.get_log_data()
    for session in log_data.get("interview_sessions", []):
        if session.get("session_id") == session_id:
            return session
    raise HTTPException(status_code=404, detail="Session not found")

@app.post("/api/generate-narrative")
async def generate_narrative(log_data: dict):
    """Generate an LLM-powered narrative summary of the interview progress"""
    from llm.gemini_client import GeminiClient
    
    try:
        gemini = GeminiClient()
        narrative = gemini.generate_interview_narrative(log_data)
        return {"narrative": narrative}
    except Exception as e:
        print(f"Narrative generation error: {e}")
        # Fallback to basic narrative
        return {"narrative": generate_basic_narrative(log_data), "is_fallback": True}

def generate_basic_narrative(log_data: dict) -> str:
    """Generate a basic narrative without LLM"""
    if not log_data:
        return "Interview session started. Waiting for activity..."
    
    # Handle both field naming conventions
    questions = log_data.get("questions") or log_data.get("rounds") or []
    language = (log_data.get("detected_language") or log_data.get("language") or "").upper()
    
    if not questions:
        return f"The {language} technical interview has begun. The interviewer is preparing the first question."
    
    # Check if there are any responses
    has_responses = False
    for q in questions:
        if q.get("responses") and len(q.get("responses", [])) > 0:
            has_responses = True
            break
    
    if not has_responses:
        return f"The {language} interview is underway. Question has been asked, awaiting the candidate's response..."
    
    parts = []
    parts.append(f"This {language} interview has covered {len(questions)} question(s) so far.")
    
    total_score = 0
    response_count = 0
    strategies_used = set()
    
    for question_data in questions:
        responses = question_data.get("responses", [])
        
        for resp in responses:
            if resp.get("evaluation", {}).get("overall_score"):
                total_score += resp["evaluation"]["overall_score"]
                response_count += 1
            if resp.get("strategy_used", {}).get("strategy_name"):
                strategies_used.add(resp["strategy_used"]["strategy_name"])
    
    if response_count > 0:
        avg = total_score / response_count
        if avg >= 75:
            parts.append(f"The candidate is performing excellently with an average of {avg:.0f}%.")
        elif avg >= 55:
            parts.append(f"The candidate demonstrates solid understanding, averaging {avg:.0f}%.")
        elif avg >= 35:
            parts.append(f"The candidate shows basic knowledge, scoring {avg:.0f}% on average.")
        else:
            parts.append(f"The candidate is finding the questions challenging, averaging {avg:.0f}%.")
    
    if strategies_used:
        parts.append(f"Strategies used: {', '.join(list(strategies_used)[:2])}.")
    
    return " ".join(parts)

# Expert Mode Endpoints
@app.post("/api/expert/approve")
async def expert_approve_followup(data: dict):
    """Expert approves the pending followup"""
    session_id = data.get("session_id")
    rating = data.get("rating")  # "good" or "bad"
    
    if not session_id or session_id not in active_interviews:
        raise HTTPException(status_code=404, detail="Session not found")
    
    controller = active_interviews[session_id]
    
    if not controller.expert_mode:
        raise HTTPException(status_code=400, detail="Session is not in expert mode")
    
    followup = controller.approve_followup(rating)
    
    if not followup:
        raise HTTPException(status_code=400, detail="No pending followup to approve")
    
    # Broadcast the approved followup to candidate
    await connection_manager.broadcast({
        "type": "followup",
        "data": followup
    })
    
    return {"status": "approved", "followup": followup}

@app.post("/api/expert/edit")
async def expert_edit_followup(data: dict):
    """Expert edits the pending followup before sending"""
    session_id = data.get("session_id")
    edited_text = data.get("edited_text")
    rating = data.get("rating")
    
    if not session_id or session_id not in active_interviews:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if not edited_text:
        raise HTTPException(status_code=400, detail="Edited text is required")
    
    controller = active_interviews[session_id]
    
    if not controller.expert_mode:
        raise HTTPException(status_code=400, detail="Session is not in expert mode")
    
    followup = controller.edit_followup(edited_text, rating)
    
    if not followup:
        raise HTTPException(status_code=400, detail="No pending followup to edit")
    
    # Broadcast the edited followup to candidate
    tenant_id = get_tenant_from_session(session_id)
    await connection_manager.broadcast({
        "type": "followup",
        "data": followup
    }, tenant_id=tenant_id)
    
    return {"status": "edited", "followup": followup}

@app.post("/api/expert/override")
async def expert_override_followup(data: dict):
    """Expert overrides with their own custom followup"""
    session_id = data.get("session_id")
    custom_text = data.get("custom_text")
    rating = data.get("rating")
    
    if not session_id or session_id not in active_interviews:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if not custom_text:
        raise HTTPException(status_code=400, detail="Custom text is required")
    
    controller = active_interviews[session_id]
    
    if not controller.expert_mode:
        raise HTTPException(status_code=400, detail="Session is not in expert mode")
    
    followup = controller.override_followup(custom_text, rating)
    
    # Broadcast the custom followup to candidate
    tenant_id = get_tenant_from_session(session_id)
    await connection_manager.broadcast({
        "type": "followup",
        "data": followup
    }, tenant_id=tenant_id)
    
    return {"status": "overridden", "followup": followup}

@app.get("/api/expert/pending/{session_id}")
async def get_pending_followup(session_id: str):
    """Get the pending followup awaiting expert approval"""
    if session_id not in active_interviews:
        raise HTTPException(status_code=404, detail="Session not found")
    
    controller = active_interviews[session_id]
    
    if not controller.expert_mode:
        raise HTTPException(status_code=400, detail="Session is not in expert mode")
    
    pending = controller.get_pending_followup()
    
    if not pending:
        return {"pending": False}
    
    return {"pending": True, "data": pending}

# ==================== Interview Session Links ====================

def generate_interview_links(session_id: str, position_id: str, candidate_id: str, ttl_minutes: int = 30) -> dict:
    """Generate unique links for candidate and admin views with TTL"""
    candidate_token = str(uuid.uuid4())
    admin_token = str(uuid.uuid4())
    
    created_at = datetime.now()
    expires_at = created_at + timedelta(minutes=ttl_minutes)
    
    session_data = {
        "session_id": session_id,
        "position_id": position_id,
        "candidate_id": candidate_id,
        "candidate_token": candidate_token,
        "admin_token": admin_token,
        "created_at": created_at.isoformat(),
        "expires_at": expires_at.isoformat(),
        "ttl_minutes": ttl_minutes,
        "status": "pending"  # pending, active, completed, expired
    }
    
    # Load existing sessions
    sessions = load_json_file(SESSIONS_FILE)
    if "sessions" not in sessions:
        sessions["sessions"] = {}
    
    sessions["sessions"][session_id] = session_data
    save_json_file(SESSIONS_FILE, sessions)
    
    # Generate links
    candidate_link = f"/interview/{session_id}?token={candidate_token}&view=candidate"
    admin_link = f"/interview/{session_id}?token={admin_token}&view=expert"  # Changed from view=admin to view=expert
    
    return {
        "session_id": session_id,
        "candidate_link": candidate_link,
        "admin_link": admin_link,
        "candidate_token": candidate_token,
        "admin_token": admin_token,
        "expires_at": expires_at.isoformat(),
        "ttl_minutes": ttl_minutes
    }

class CreateSessionRequest(BaseModel):
    position_id: str
    candidate_id: str
    ttl_minutes: int = 30  # Default 30 mins
    resume_text: Optional[str] = None
    send_email: bool = False  # NEW: Email invite flag
    candidate_email: Optional[str] = None  # NEW: Candidate email

@app.post("/api/interview/create-session")
async def create_interview_session(request: CreateSessionRequest):
    """Create interview session and generate unique links for candidate and admin"""
    # Validate TTL (1-1440 minutes, i.e., max 24 hours)
    ttl = max(1, min(request.ttl_minutes, 1440))
    
    # Validate position exists
    positions_data = load_json_file(POSITIONS_FILE)
    position = next((p for p in positions_data.get("positions", []) if p["id"] == request.position_id), None)
    if not position:
        raise HTTPException(status_code=404, detail="Position not found")
    
    # Validate candidate exists (allow 'custom' for uploaded resumes)
    # Validate candidate exists (allow 'custom' for uploaded resumes)
    candidate = None
    candidate_name = "Custom Resume"
    candidate_info = {}
    
    if request.candidate_id != 'custom':
        resumes_data = load_json_file(RESUMES_FILE)
        candidate = next((r for r in resumes_data.get("resumes", []) if r["id"] == request.candidate_id), None)
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
        candidate_name = candidate.get("name", "Unknown Candidate")
    elif request.resume_text:
        # Extract name from resume
        try:
            analyzer = JDResumeAnalyzer()
            info = analyzer.extract_candidate_info(request.resume_text)
            candidate_name = info.get("name", "Anonymous Candidate")
            candidate_info = info
        except Exception as e:
            print(f"Error extracting candidate info: {e}")
            candidate_name = "Anonymous Candidate"

    # Generate session ID and links with TTL
    session_id = str(uuid.uuid4())[:8]
    
    # Extract tenant_id from headers
    tenant_id = "global"
    if "X-Tenant-Slug" in request_headers:
        tenant_id = request_headers["X-Tenant-Slug"]
    elif "x-tenant-slug" in request_headers:
        tenant_id = request_headers["x-tenant-slug"]

    # Store tenant_id in links for convenience or metadata
    links = generate_interview_links(session_id, request.position_id, request.candidate_id, ttl)
    
    # Update session with candidate info
    sessions = load_json_file(SESSIONS_FILE)
    if session_id in sessions.get("sessions", {}):
        sessions["sessions"][session_id]["candidate_name"] = candidate_name
        sessions["sessions"][session_id]["candidate_info"] = candidate_info
        save_json_file(SESSIONS_FILE, sessions)
    
    # NEW: Email sending logic
    if request.send_email and request.candidate_email:
        try:
            from utils.email_generator import generate_interview_email
            from utils.email_sender import send_interview_email
            
            # Get account name from position
            account_name = "Company"
            if position.get("account_id"):
                accounts_data = load_json_file(ACCOUNTS_FILE)
                account = next((a for a in accounts_data.get("accounts", []) if a["id"] == position["account_id"]), None)
                if account:
                    account_name = account.get("name", "Company")
            
            # Format expiry time
            expires_at_dt = datetime.fromisoformat(links["expires_at"])
            expires_at_formatted = expires_at_dt.strftime("%b %d, %Y at %I:%M %p")
            
            # Build full candidate link URL
            base_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
            candidate_full_url = f"{base_url}{links['candidate_link']}"
            expert_full_url = f"{base_url}{links['admin_link']}"
            
            # Generate email using Gemini
            email_html = generate_interview_email(
                candidate_name=candidate_name,
                position_title=position.get("title", "Position"),
                company_name=account_name,
                interview_link=candidate_full_url,
                expires_at=expires_at_formatted,
                ttl_minutes=ttl
            )
            
            # Send email (SendGrid → Gmail fallback)
            result = send_interview_email(
                to_email=request.candidate_email,
                subject=f"Interview Invitation - {position.get('title', 'Position')}",
                html_body=email_html
            )
            
            if result['success']:
                # Email sent successfully
                return {
                    "status": "created",
                    "session_id": session_id,
                    "position": {"id": request.position_id, "title": position.get("title")},
                    "candidate": {"id": request.candidate_id, "name": candidate_name},
                    "email_sent": True,
                    "expert_link": expert_full_url,
                    "candidate_email": request.candidate_email,
                    "email_provider": result['provider'],
                    "links": links,  # Include QR links
                    "expires_at": links["expires_at"],
                    "ttl_minutes": ttl
                }
            else:
                # Email failed but session created - return QR links
                print(f"[WARN] Email failed but session created: {result['error']}")
                return {
                    "status": "created",
                    "session_id": session_id,
                    "position": {"id": request.position_id, "title": position.get("title")},
                    "candidate": {"id": request.candidate_id, "name": candidate_name},
                    "email_sent": False,
                    "email_error": result['error'],
                    "expert_link": expert_full_url,
                    "candidate_email": request.candidate_email,
                    "links": links,  # Include QR links
                    "expires_at": links["expires_at"],
                    "ttl_minutes": ttl
                }
                
        except Exception as e:
            print(f"[ERROR] Email generation/sending failed: {e}")
            # Don't fail the whole request - return QR links anyway
            base_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
            expert_full_url = f"{base_url}{links['admin_link']}"
            return {
                "status": "created",
                "session_id": session_id,
                "position": {"id": request.position_id, "title": position.get("title")},
                "candidate": {"id": request.candidate_id, "name": candidate_name},
                "email_sent": False,
                "email_error": str(e),
                "expert_link": expert_full_url,
                "links": links,  # Include QR links
                "expires_at": links["expires_at"],
                "ttl_minutes": ttl
            }
    
    # Default: Return QR code links
    return {
        "status": "created",
        "session_id": session_id,
        "position": {"id": request.position_id, "title": position.get("title")},
        "candidate": {"id": request.candidate_id, "name": candidate_name},
        "links": {
            "candidate": links["candidate_link"],
            "admin": links["admin_link"]
        },
        "expires_at": links["expires_at"],
        "ttl_minutes": ttl
    }

@app.get("/api/interview/validate-token")
async def validate_interview_token(session_id: str, token: str):
    """Validate interview token and return view type (candidate/admin)"""
    sessions = load_json_file(SESSIONS_FILE)
    session = sessions.get("sessions", {}).get(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check if session has expired
    expires_at_str = session.get("expires_at")
    if expires_at_str:
        expires_at = datetime.fromisoformat(expires_at_str)
        if datetime.now() > expires_at:
            # Update session status to expired
            session["status"] = "expired"
            sessions["sessions"][session_id] = session
            save_json_file(SESSIONS_FILE, sessions)
            raise HTTPException(status_code=410, detail="Session link has expired")
    
    # Validate token
    if token == session.get("candidate_token"):
        return {
            "valid": True, 
            "view": "candidate", 
            "session_id": session_id,
            "expires_at": session.get("expires_at")
        }
    elif token == session.get("admin_token"):
        return {
            "valid": True, 
            "view": "expert",  # Changed from "admin" to "expert"
            "session_id": session_id,
            "expires_at": session.get("expires_at")
        }
    else:
        raise HTTPException(status_code=403, detail="Invalid token")

@app.get("/api/interview/session/{session_id}")
async def get_interview_session(session_id: str, token: str):
    """Get interview session details (requires valid token)"""
    sessions = load_json_file(SESSIONS_FILE)
    session = sessions.get("sessions", {}).get(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Validate token
    is_admin = token == session.get("admin_token")
    is_candidate = token == session.get("candidate_token")
    
    if not is_admin and not is_candidate:
        raise HTTPException(status_code=403, detail="Invalid token")
    
    # Get position and candidate details
    positions_data = load_json_file(POSITIONS_FILE)
    position = next((p for p in positions_data.get("positions", []) if p["id"] == session["position_id"]), None)
    
    resumes_data = load_json_file(RESUMES_FILE)
    candidate = next((r for r in resumes_data.get("resumes", []) if r["id"] == session["candidate_id"]), None)
    
    response = {
        "session_id": session_id,
        "status": session.get("status"),
        "view": "expert" if is_admin else "candidate",  # Changed from "admin" to "expert"
        "position": {"id": session["position_id"], "title": position.get("title") if position else "Unknown"},
        "created_at": session.get("created_at")
    }
    
    # Admin gets more details
    if is_admin:
        response["candidate"] = {
            "id": session["candidate_id"],
            "name": candidate.get("name") if candidate else "Unknown",
            "experience_level": candidate.get("experience_level") if candidate else "Unknown"
        }
        response["links"] = {
            "candidate": f"/interview/{session_id}?token={session['candidate_token']}&view=candidate",
            "expert": f"/interview/{session_id}?token={session['admin_token']}&view=expert"  # Changed from admin to expert
        }
    
    return response

# ==================== Wiki APIs (Admin Only) ====================

class WikiAskRequest(BaseModel):
    question: str
    category: Optional[str] = None

class WikiEntry(BaseModel):
    id: str
    question: str
    answer: str
    category: str
    code_refs: List[str] = []
    keywords: List[str] = []
    created_at: str
    auto_generated: bool = True

def calculate_similarity(text1: str, text2: str) -> float:
    """Simple keyword-based similarity (will be replaced with embeddings)"""
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())
    if not words1 or not words2:
        return 0.0
    intersection = words1 & words2
    union = words1 | words2
    return len(intersection) / len(union)

def normalize_query(query: str) -> str:
    """Normalize query by removing punctuation and lowercasing"""
    import re
    # Remove punctuation except apostrophes, lowercase
    normalized = re.sub(r'[^\w\s\']', '', query.lower())
    # Remove common filler words
    fillers = {'how', 'do', 'i', 'can', 'we', 'you', 'the', 'a', 'an', 'is', 'are', 'what', 'where', 'when', 'why', 'which', 'to', 'get', 'and', 'or', 'of', 'for', 'in', 'on', 'at', 'by'}
    words = [w for w in normalized.split() if w not in fillers]
    return ' '.join(words)

def expand_query_with_semantics(query: str, semantic_index: dict) -> set:
    """Expand query terms using semantic index synonyms and shortforms"""
    query_lower = query.lower()
    expanded_terms = set(query_lower.split())
    
    # Expand shortforms (e.g., 'ws' -> 'websocket')
    shortforms = semantic_index.get('shortform_mappings', {})
    for short, full in shortforms.items():
        if short in query_lower or short in expanded_terms:
            expanded_terms.add(full)
            # Also add synonyms for the expanded term
            synonym_mappings = semantic_index.get('synonym_mappings', {})
            if full in synonym_mappings:
                expanded_terms.update(synonym_mappings[full][:5])  # Top 5 synonyms
    
    # Expand using synonym mappings (bidirectional)
    synonym_mappings = semantic_index.get('synonym_mappings', {})
    for concept, synonyms in synonym_mappings.items():
        # If query contains any synonym, add the concept
        for syn in synonyms:
            if syn in query_lower:
                expanded_terms.add(concept)
                break
        # If query contains the concept, add key synonyms
        if concept in query_lower:
            expanded_terms.update(synonyms[:3])
    
    return expanded_terms

def search_wiki_cache(question: str, wiki_data: dict, threshold: float = 0.5) -> Optional[dict]:
    """Search wiki cache for similar questions using semantic matching"""
    best_match = None
    best_score = 0.0
    
    # Get semantic index
    semantic_index = wiki_data.get("semantic_index", {})
    
    # Normalize and expand query
    normalized_query = normalize_query(question)
    expanded_terms = expand_query_with_semantics(question, semantic_index)
    query_words = set(question.lower().split()) | expanded_terms
    
    for entry in wiki_data.get("entries", []):
        entry_question = entry.get("question", "")
        entry_keywords = set(kw.lower() for kw in entry.get("keywords", []))
        entry_answer = entry.get("answer", "")[:200].lower()  # First 200 chars of answer
        
        # 1. Direct question similarity
        q_score = calculate_similarity(question, entry_question)
        
        # 2. Normalized question similarity (ignoring filler words)
        normalized_entry = normalize_query(entry_question)
        n_score = calculate_similarity(normalized_query, normalized_entry)
        
        # 3. Keyword overlap with expanded terms
        keyword_matches = len(query_words & entry_keywords)
        k_score = keyword_matches / max(len(entry_keywords), 1)
        
        # 4. Check if key query terms appear in entry keywords
        normalized_words = set(normalized_query.split())
        key_term_match = len(normalized_words & entry_keywords) / max(len(normalized_words), 1)
        
        # 5. Check answer text for query terms
        answer_match = sum(1 for term in normalized_words if term in entry_answer) / max(len(normalized_words), 1)
        
        # Weighted combination (more weight on normalized match and keywords)
        score = (q_score * 0.2) + (n_score * 0.35) + (k_score * 0.25) + (key_term_match * 0.15) + (answer_match * 0.05)
        
        if score > best_score and score >= threshold:
            best_score = score
            best_match = entry
            best_match['_match_score'] = score
    
    # Lower threshold for very short queries (retry once at 0.35 if threshold was 0.6)
    if not best_match and threshold >= 0.5:
        return search_wiki_cache(question, wiki_data, threshold=0.35)
    
    return best_match

@app.get("/api/wiki/categories")
async def get_wiki_categories():
    """Get all wiki categories with entry counts (Admin only)"""
    wiki_data = load_json_file(WIKI_FILE)
    categories = wiki_data.get("categories", [])
    entries = wiki_data.get("entries", [])
    
    # Count entries per category
    category_counts = {}
    for cat in categories:
        category_counts[cat] = len([e for e in entries if e.get("category") == cat])
    
    return {
        "categories": [
            {"name": cat, "entry_count": category_counts.get(cat, 0)}
            for cat in categories
        ],
        "total_entries": len(entries),
        "metadata": wiki_data.get("metadata", {})
    }

@app.get("/api/wiki/search")
async def search_wiki(q: str, category: Optional[str] = None):
    """Search wiki entries (Admin only)"""
    wiki_data = load_json_file(WIKI_FILE)
    entries = wiki_data.get("entries", [])
    
    # Filter by category if provided
    if category:
        entries = [e for e in entries if e.get("category") == category]
    
    # Search by question text and keywords
    results = []
    for entry in entries:
        score = calculate_similarity(q, entry.get("question", ""))
        keyword_match = any(kw.lower() in q.lower() for kw in entry.get("keywords", []))
        
        if score > 0.2 or keyword_match:
            results.append({
                **entry,
                "relevance_score": score + (0.2 if keyword_match else 0)
            })
    
    # Sort by relevance
    results.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
    
    return {"results": results[:10], "total": len(results)}

def gather_wiki_context(question: str, category: str = None) -> str:
    """Gather relevant code context for wiki question"""
    context_parts = []
    
    # Keywords to search for in the question
    keywords = question.lower()
    
    # Add relevant context based on question content
    if "matching" in keywords or "candidate" in keywords:
        context_parts.append("File: backend/main.py - Candidate Matching Logic")
        context_parts.append("""
def calculate_candidate_match_score(position, candidate):
    - Calculates skill match between position requirements and candidate skills
    - Uses primary language filter (Python/Java)
    - Applies partial skill matching (e.g., Django -> Python)
    - Scores experience level alignment
    - Returns percentage match (0-100)
""")
    
    if "interview" in keywords or "flow" in keywords:
        context_parts.append("File: backend/core/interview_controller.py - Interview Flow")
        context_parts.append("""
class InterviewController:
    - Manages interview lifecycle (start, questions, answers, end)
    - Handles WebSocket communication
    - Coordinates with QuestionManager and Evaluator
    - Supports expert mode (admin approval of follow-ups)
""")
    
    if "question" in keywords or "generation" in keywords:
        context_parts.append("File: backend/core/question_manager.py - Question Generation")
        context_parts.append("""
class QuestionManager:
    - Loads question bank from JSON files
    - Selects questions based on topic and difficulty
    - Tracks asked questions to avoid duplicates
    - Supports multiple question types (coding, conceptual, etc.)
""")
    
    if "evaluation" in keywords or "scoring" in keywords:
        context_parts.append("File: backend/evaluation/evaluator.py - Evaluation Logic")
        context_parts.append("""
class Evaluator:
    - Evaluates candidate responses
    - Uses keyword coverage scoring
    - Applies completeness scoring
    - Calculates overall score (0-100)
    - Integrates with LLM for nuanced evaluation
""")
    
    if "follow" in keywords or "strategy" in keywords:
        context_parts.append("File: backend/strategies/*.py - Follow-up Strategies")
        context_parts.append("""
Strategies available:
- DepthFocused: Deep dive on weak areas
- BreadthFocused: Cover more topics
- Clarification: Ask for more details
- Challenge: Harder follow-ups
Selection based on evaluation score.
""")
    
    if "position" in keywords or "account" in keywords:
        context_parts.append("File: backend/models/*.json - Data Models")
        context_parts.append("""
Data structure:
- organizations.json: Top-level organization (EPAM)
- accounts.json: Client accounts (Uber, Amazon, etc.)
- positions.json: Open positions with data_model config
- position_templates.json: Reusable position templates
""")
    
    if "expert" in keywords or "admin" in keywords:
        context_parts.append("File: backend/main.py - Expert Mode APIs")
        context_parts.append("""
Expert Mode:
- POST /api/expert/approve: Approve AI-generated follow-up
- POST /api/expert/edit: Modify follow-up before sending
- POST /api/expert/override: Replace with custom question
- Admin can review all AI suggestions before candidate sees them
""")
    
    # Add general context if nothing specific matched
    if not context_parts:
        context_parts.append("AI Interview Platform - General Architecture")
        context_parts.append("""
Backend (FastAPI):
- main.py: REST APIs and WebSocket endpoints
- core/: Interview controller, question manager
- evaluation/: Response evaluation logic
- strategies/: Follow-up question strategies
- llm/: Gemini integration for AI features
- models/: JSON data storage

Frontend (Next.js):
- Dashboard: Account/Position management
- Interview: Candidate and Admin views
- Components: Reusable UI elements
""")
    
    return "\n".join(context_parts)

@app.post("/api/wiki/ask")
async def ask_wiki(request: WikiAskRequest):
    """Ask a question - returns cached answer or generates new one (Admin only)"""
    from llm.gemini_client import GeminiClient
    
    wiki_data = load_json_file(WIKI_FILE)
    
    # Update query count
    if "metadata" not in wiki_data:
        wiki_data["metadata"] = {}
    wiki_data["metadata"]["total_queries"] = wiki_data["metadata"].get("total_queries", 0) + 1
    
    # Search cache first
    cached = search_wiki_cache(request.question, wiki_data, threshold=0.6)
    
    if cached:
        # Cache hit!
        wiki_data["metadata"]["cache_hits"] = wiki_data["metadata"].get("cache_hits", 0) + 1
        save_json_file(WIKI_FILE, wiki_data)
        
        return {
            "source": "cache",
            "answer": cached.get("answer"),
            "question": cached.get("question"),
            "category": cached.get("category"),
            "code_refs": cached.get("code_refs", []),
            "followup_suggestion": "Would you like to see the code architecture for this?"
        }
    
    # Cache miss - generate with LLM
    wiki_data["metadata"]["llm_calls"] = wiki_data["metadata"].get("llm_calls", 0) + 1
    
    try:
        # Gather relevant code context
        code_context = gather_wiki_context(request.question, request.category)
        
        # Generate answer using LLM
        gemini = GeminiClient()
        result = gemini.answer_codebase_question(
            question=request.question,
            code_context=code_context,
            category=request.category
        )
        
        # Generate follow-up suggestion
        followup = gemini.generate_followup_suggestion(
            question=request.question,
            answer=result.get("answer", "")
        )
        
        # Create new entry with LLM-generated content
        new_entry = {
            "id": f"wiki_{uuid.uuid4().hex[:8]}",
            "question": request.question,
            "answer": result.get("answer", ""),
            "category": request.category or "General",
            "code_refs": result.get("code_refs", []),
            "keywords": result.get("keywords", request.question.lower().split()[:5]),
            "created_at": datetime.now().isoformat(),
            "auto_generated": True
        }
        
        if "entries" not in wiki_data:
            wiki_data["entries"] = []
        wiki_data["entries"].append(new_entry)
        save_json_file(WIKI_FILE, wiki_data)
        
        return {
            "source": "llm",
            "answer": result.get("answer", ""),
            "question": request.question,
            "category": new_entry["category"],
            "code_refs": result.get("code_refs", []),
            "followup_suggestion": followup
        }
        
    except Exception as e:
        print(f"Error generating wiki answer: {e}")
        # Fallback - save question for later
        new_entry = {
            "id": f"wiki_{uuid.uuid4().hex[:8]}",
            "question": request.question,
            "answer": f"Unable to generate answer at this time. Error: {str(e)}",
            "category": request.category or "General",
            "code_refs": [],
            "keywords": request.question.lower().split()[:5],
            "created_at": datetime.now().isoformat(),
            "auto_generated": True,
            "needs_retry": True
        }
        
        if "entries" not in wiki_data:
            wiki_data["entries"] = []
        wiki_data["entries"].append(new_entry)
        save_json_file(WIKI_FILE, wiki_data)
        
        return {
            "source": "error",
            "answer": f"Unable to generate answer. Please try again. Error: {str(e)[:100]}",
            "question": request.question,
            "category": new_entry["category"],
            "code_refs": [],
            "followup_suggestion": None
        }

@app.get("/api/wiki/entries")
async def get_wiki_entries(category: Optional[str] = None, limit: int = 20):
    """Get wiki entries, optionally filtered by category (Admin only)"""
    wiki_data = load_json_file(WIKI_FILE)
    entries = wiki_data.get("entries", [])
    
    if category:
        entries = [e for e in entries if e.get("category") == category]
    
    # Sort by created_at descending
    entries.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
    return {"entries": entries[:limit], "total": len(entries)}

@app.get("/api/wiki/entry/{entry_id}")
async def get_wiki_entry(entry_id: str):
    """Get a specific wiki entry (Admin only)"""
    wiki_data = load_json_file(WIKI_FILE)
    
    for entry in wiki_data.get("entries", []):
        if entry.get("id") == entry_id:
            return entry
    
    raise HTTPException(status_code=404, detail="Entry not found")

@app.delete("/api/wiki/entry/{entry_id}")
async def delete_wiki_entry(entry_id: str):
    """Delete a wiki entry (Admin only)"""
    wiki_data = load_json_file(WIKI_FILE)
    
    entries = wiki_data.get("entries", [])
    wiki_data["entries"] = [e for e in entries if e.get("id") != entry_id]
    
    if len(wiki_data["entries"]) == len(entries):
        raise HTTPException(status_code=404, detail="Entry not found")
    
    save_json_file(WIKI_FILE, wiki_data)
    return {"status": "deleted", "entry_id": entry_id}

@app.get("/api/wiki/stats")
async def get_wiki_stats():
    """Get wiki usage statistics (Admin only)"""
    wiki_data = load_json_file(WIKI_FILE)
    metadata = wiki_data.get("metadata", {})
    
    return {
        "total_entries": len(wiki_data.get("entries", [])),
        "total_queries": metadata.get("total_queries", 0),
        "cache_hits": metadata.get("cache_hits", 0),
        "llm_calls": metadata.get("llm_calls", 0),
        "cache_hit_rate": round(
            metadata.get("cache_hits", 0) / max(metadata.get("total_queries", 1), 1) * 100, 1
        ),
        "last_indexed": metadata.get("last_indexed"),
        "categories": len(wiki_data.get("categories", []))
    }

@app.get("/api/wiki/semantic-index")
async def get_wiki_semantic_index():
    """Get semantic index data for display in wiki UI"""
    wiki_data = load_json_file(WIKI_FILE)
    semantic_index = wiki_data.get("semantic_index", {})
    
    return {
        "synonym_mappings": semantic_index.get("synonym_mappings", {}),
        "shortform_mappings": semantic_index.get("shortform_mappings", {}),
        "topic_aliases": semantic_index.get("topic_aliases", {}),
        "layman_patterns": semantic_index.get("layman_patterns", []),
        "indexed_topics": semantic_index.get("indexed_topics", []),
        "scoring_weights": semantic_index.get("scoring_weights", {}),
        "version": semantic_index.get("version", "1.0"),
        "last_indexed": semantic_index.get("last_indexed")
    }

DIAGRAMS_FILE = os.path.join(os.path.dirname(__file__), "docs", "diagrams", "diagrams.json")

@app.get("/api/wiki/diagrams")
async def get_wiki_diagrams(category: Optional[str] = None):
    """Get architecture diagrams for wiki visualization"""
    try:
        # Load diagrams from JSON file
        diagrams_path = os.path.join(os.path.dirname(__file__), "..", "docs", "diagrams", "diagrams.json")
        if not os.path.exists(diagrams_path):
            diagrams_path = os.path.join(os.path.dirname(__file__), "docs", "diagrams", "diagrams.json")
        
        if os.path.exists(diagrams_path):
            with open(diagrams_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        else:
            return {"diagrams": [], "categories": [], "error": "Diagrams file not found"}
        
        diagrams = data.get("diagrams", [])
        
        # Get unique categories
        categories = list(set(d.get("category", "General") for d in diagrams))
        categories.sort()
        
        # Filter by category if provided
        if category:
            diagrams = [d for d in diagrams if d.get("category") == category]
        
        return {
            "diagrams": diagrams,
            "categories": categories,
            "total": len(diagrams),
            "version": data.get("version", "1.0")
        }
    except Exception as e:
        return {"diagrams": [], "categories": [], "error": str(e)}

class ReindexRequest(BaseModel):
    use_llm: bool = False
    category: Optional[str] = None

@app.post("/api/wiki/reindex")
async def reindex_wiki(request: ReindexRequest):
    """Manually trigger wiki reindexing (Admin only)"""
    from wiki_indexer import run_indexer
    
    try:
        categories = [request.category] if request.category else None
        run_indexer(use_llm=request.use_llm, categories_to_index=categories)
        
        # Return updated stats
        wiki_data = load_json_file(WIKI_FILE)
        return {
            "status": "success",
            "total_entries": len(wiki_data.get("entries", [])),
            "last_indexed": wiki_data.get("metadata", {}).get("last_indexed")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reindexing failed: {str(e)}")

# ==================== Interview Results & Evaluation ====================

class AdminFeedbackRequest(BaseModel):
    overall_notes: str = ""
    question_notes: dict = {}
    recommendation: str = "pending"  # proceed, hold, reject, pending

def generate_question_feedback(question_text: str, candidate_answer: str, scores: dict) -> dict:
    """Generate AI feedback for a single question response"""
    try:
        from llm.gemini_client import GeminiClient
        gemini = GeminiClient()
        
        overall_score = scores.get("overall_score", 0)
        
        prompt = f"""Analyze this interview response and provide structured feedback.

Question: {question_text[:500]}

Candidate Answer: {candidate_answer[:1000]}

Score: {overall_score}/100

Provide feedback in this exact format:
SUMMARY: [1-2 sentence summary of the answer quality]
STRENGTHS: [2-3 bullet points of what was done well, separated by |]
WEAKNESSES: [2-3 bullet points of gaps or areas to improve, separated by |]
"""
        
        response = gemini.model.generate_content(prompt)
        response_text = ""
        
        if hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
            if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                parts = candidate.content.parts
                if parts:
                    response_text = ''.join([part.text for part in parts if hasattr(part, 'text')]).strip()
        
        if not response_text and hasattr(response, 'text'):
            response_text = response.text.strip()
        
        # Parse response
        summary = ""
        strengths = []
        weaknesses = []
        
        for line in response_text.split('\n'):
            if line.startswith('SUMMARY:'):
                summary = line.replace('SUMMARY:', '').strip()
            elif line.startswith('STRENGTHS:'):
                strengths_text = line.replace('STRENGTHS:', '').strip()
                strengths = [s.strip() for s in strengths_text.split('|') if s.strip()]
            elif line.startswith('WEAKNESSES:'):
                weaknesses_text = line.replace('WEAKNESSES:', '').strip()
                weaknesses = [w.strip() for w in weaknesses_text.split('|') if w.strip()]
        
        return {
            "summary": summary or "Response evaluated.",
            "strengths": strengths or ["Answer provided"],
            "weaknesses": weaknesses or ["Could provide more detail"]
        }
        
    except Exception as e:
        print(f"Error generating feedback: {e}")
        return {
            "summary": "Response evaluated based on scoring criteria.",
            "strengths": ["Answer was provided"],
            "weaknesses": ["Feedback generation unavailable"]
        }


@app.get("/api/results/{result_id}")
async def get_interview_result(result_id: str, admin: bool = True):
    """Get full interview result (Admin only for full view)"""
    results_data = load_json_file(RESULTS_FILE)
    result = results_data.get("results", {}).get(result_id)
    
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    
    if admin:
        return result
    else:
        # Limited view for non-admin (just summary)
        return {
            "id": result["id"],
            "position": result["position"],
            "created_at": result["created_at"],
            "status": result["status"],
            "overall_metrics": {
                "total_score": result["overall_metrics"]["total_score"],
                "questions_asked": result["overall_metrics"]["questions_asked"]
            }
        }

@app.get("/api/results/session/{session_id}")
async def get_result_by_session(session_id: str):
    """Get result by session ID"""
    results_data = load_json_file(RESULTS_FILE)
    
    for result_id, result in results_data.get("results", {}).items():
        if result.get("session_id") == session_id:
            return result
    
    raise HTTPException(status_code=404, detail="Result not found for this session")

@app.post("/api/results/{result_id}/feedback")
async def add_admin_feedback(result_id: str, request: AdminFeedbackRequest):
    """Add or update admin feedback on a result"""
    results_data = load_json_file(RESULTS_FILE)
    result = results_data.get("results", {}).get(result_id)
    
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    
    result["admin_feedback"] = {
        "overall_notes": request.overall_notes,
        "question_notes": request.question_notes,
        "recommendation": request.recommendation,
        "added_by": "admin",  # Could be enhanced with actual user info
        "added_at": datetime.now().isoformat()
    }
    
    results_data["results"][result_id] = result
    save_json_file(RESULTS_FILE, results_data)
    
    return {"status": "feedback_saved", "result_id": result_id}

@app.post("/api/results/{result_id}/share")
async def create_shareable_link(result_id: str):
    """Generate a shareable link for candidate to view their results"""
    results_data = load_json_file(RESULTS_FILE)
    result = results_data.get("results", {}).get(result_id)
    
    if not result:
        # Fallback: Search in candidate files
        # This handles legacy cases or sync issues where result exists in candidate file but not results.json
        try:
            candidate_files = os.listdir(CANDIDATE_RESULTS_DIR)
            found = False
            for filename in candidate_files:
                if not filename.endswith(".json"): continue
                
                path = os.path.join(CANDIDATE_RESULTS_DIR, filename)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        c_data = json.load(f)
                    
                    if "interviews" in c_data:
                        for interview in c_data["interviews"]:
                            if interview.get("id") == result_id or interview.get("session_id") == result_id:
                                result = interview
                                found = True
                                break
                except:
                    continue
                
                if found:
                    break
        except Exception as e:
            print(f"[WARN] Failed fallback search for result {result_id}: {e}")
            
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    
    share_token = f"share_{uuid.uuid4().hex[:12]}"
    share_data = {
        "token": share_token,
        "created_at": datetime.now().isoformat(),
        "expires_at": None,
        "views": ["summary"]
    }
    
    result["shareable_link"] = share_data
    
    # Save to global results
    results_data["results"][result_id] = result
    save_json_file(RESULTS_FILE, results_data)
    
    # Save to candidate-specific file
    try:
        candidate_name = result.get("candidate", {}).get("name")
        candidate_id = result.get("candidate", {}).get("id")
        session_id = result.get("session_id")
        
        if candidate_name:
            # We need to find the right file.
            date_str = result.get("created_at", "").split("T")[0]
            
            # Use candidate_id or session_id for unique filename generation
            # This matches save_candidate_result logic
            unique_id = session_id or candidate_id
            
            filename_unique = get_candidate_filename(candidate_name, date_str, unique_id)
            filename_legacy = get_candidate_filename(candidate_name, date_str)
            filename_nodate = get_candidate_filename(candidate_name) # Legacy
            
            paths_to_check = [
                os.path.join(CANDIDATE_RESULTS_DIR, filename_unique),
                os.path.join(CANDIDATE_RESULTS_DIR, filename_legacy),
                os.path.join(CANDIDATE_RESULTS_DIR, filename_nodate)
            ]
            
            updated_candidate = False
            for filepath in paths_to_check:
                if os.path.exists(filepath):
                    with open(filepath, 'r', encoding='utf-8') as f:
                        c_data = json.load(f)
                    
                    if "interviews" in c_data:
                        for i, interview in enumerate(c_data["interviews"]):
                            if interview.get("id") == result_id or interview.get("session_id") == result.get("session_id"):
                                c_data["interviews"][i]["shareable_link"] = share_data
                                with open(filepath, 'w', encoding='utf-8') as f:
                                    json.dump(c_data, f, indent=2, ensure_ascii=False)
                                updated_candidate = True
                                break
                if updated_candidate:
                    break
                    
            if not updated_candidate:
                 # Fallback: List all files and search (expensive but necessary if filename mismatch)
                 pass
                 
    except Exception as e:
        print(f"[WARN] Failed to update candidate file with share link: {e}")
    
    return {
        "share_url": f"/results/shared/{share_token}",
        "token": share_token
    }

def save_candidate_result(candidate_name: str, candidate_id: str, result: dict, session_id: str = None):
    """
    Save interview result to:
    1. Candidate-specific file (legacy)
    2. interview_results.json (for feedback page)
    """
    # Generate unique filename
    date_str = datetime.now().strftime("%Y%m%d")
    unique_id = session_id or candidate_id or uuid.uuid4().hex[:8]
    
    # Sanitize candidate name for filename
    safe_name = "".join(c if c.isalnum() or c in (' ', '-', '_') else '_' for c in candidate_name)
    safe_name = safe_name.replace(' ', '_')
    
    filename = f"{safe_name}_{date_str}_{unique_id}_result.json"
    filepath = os.path.join(CANDIDATE_RESULTS_DIR, filename)
    
    # 1. Save to candidate-specific file (legacy behavior)
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
    else:
        data = {"interviews": []}
    
    data["interviews"].append(result)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    # 2. ALSO save to interview_results.json (for feedback page)
    try:
        results_data = load_json_file(RESULTS_FILE)
        if "results" not in results_data:
            results_data["results"] = {}
        
        # Use session_id as key
        results_data["results"][session_id] = result
        results_data["last_updated"] = datetime.now().isoformat()
        results_data["total_count"] = len(results_data["results"])
        
        save_json_file(RESULTS_FILE, results_data)
        print(f"[INFO] Saved result to interview_results.json with key: {session_id}")
    except Exception as e:
        print(f"[ERROR] Failed to save to interview_results.json: {e}")
    
    return filepath

@app.get("/api/results/shared/{token}")
async def get_shared_result(token: str):
    """Retrieve result by share token"""
    # 1. Check aggregate results first (fastest)
    results_data = load_json_file(RESULTS_FILE)
    if "results" in results_data:
        for result in results_data["results"].values():
            if result.get("shareable_link", {}).get("token") == token:
                return result

    # 2. Fallback: Search candidate files (slower but covers all cases)
    try:
        candidate_files = os.listdir(CANDIDATE_RESULTS_DIR)
        for filename in candidate_files:
            if not filename.endswith(".json"): continue
            
            path = os.path.join(CANDIDATE_RESULTS_DIR, filename)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    c_data = json.load(f)
                
                if "interviews" in c_data:
                    for interview in c_data["interviews"]:
                        if interview.get("shareable_link", {}).get("token") == token:
                            return interview
            except:
                continue
    except Exception as e:
        print(f"[ERROR] searching share token: {e}")
        
    raise HTTPException(status_code=404, detail="Shared result not found or expired")

# Thank You Page Endpoints
@app.get("/api/candidate/thank-you/{token}")
async def get_candidate_thank_you_status(token: str):
    """Get candidate thank you page status"""
    try:
        results_data = load_json_file(RESULTS_FILE)
        results_dict = results_data.get("results", {})
        
        # Find result by candidate thank you token
        for session_id, result in results_dict.items():
            if result.get("candidate", {}).get("thank_you_token") == token:
                return {
                    "candidate_name": result.get("candidate", {}).get("name", "Candidate"),
                    "position_title": result.get("position", {}).get("title", "Position"),
                    "interview_date": result.get("date", datetime.now().isoformat()),
                    "feedback_status": result.get("feedback", {}).get("status", "NOT_GENERATED")
                }
        
        raise HTTPException(status_code=404, detail="Thank you page not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/expert/thank-you/{session_id}")
async def get_expert_thank_you_info(session_id: str):
    """Get expert thank you page info"""
    try:
        results_data = load_json_file(RESULTS_FILE)
        result = results_data.get("results", {}).get(session_id)
        
        if not result:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {
            "session_id": session_id,
            "candidate_name": result.get("candidate", {}).get("name", "Candidate"),
            "position_title": result.get("position", {}).get("title", "Position"),
            "interview_date": result.get("date", datetime.now().isoformat())
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/results")
async def list_all_results(limit: int = 20, offset: int = 0):
    """List all interview results (Admin only)"""
    results_data = load_json_file(RESULTS_FILE)
    all_results = list(results_data.get("results", {}).values())
    
    # Sort by created_at descending
    all_results.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
    # Paginate
    paginated = all_results[offset:offset + limit]
    
    # Return summary view
    return {
        "results": [
            {
                "id": r["id"],
                "session_id": r["session_id"],
                "candidate": r["candidate"],
                "position": r["position"],
                "created_at": r["created_at"],
                "status": r["status"],
                "overall_score": r["overall_metrics"]["total_score"],
                "recommendation": r["admin_feedback"].get("recommendation", "pending")
            }
            for r in paginated
        ],
        "total": len(all_results),
        "limit": limit,
        "offset": offset
    }

# ============================================================================
# CODE SUBMISSION & REVIEW ENDPOINTS
# ============================================================================

CODE_SUBMISSIONS_FILE = os.path.join(os.path.dirname(__file__), "models", "code_submissions.json")

class CodeSubmissionRequest(BaseModel):
    session_id: str
    question_id: str
    code: str
    language: str = "python"
    time_taken_seconds: int = 0
    activity_data: Optional[dict] = None

class AdminReviewRequest(BaseModel):
    reviewer: str
    notes: str
    score_override: Optional[float] = None
    status: str = "reviewed"  # reviewed, approved, rejected

@app.post("/api/code/submit")
async def submit_code(request: CodeSubmissionRequest):
    """Submit code for evaluation"""
    from evaluation.code_evaluator import evaluate_code_submission
    from llm.gemini_client import GeminiClient
    
    # Load question from bank
    question_bank = load_json_file(QUESTION_BANK_FILE)
    question = None
    for q in question_bank.get("questions", []):
        if q["id"] == request.question_id:
            question = q
            break
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Initialize Gemini for LLM review
    try:
        gemini = GeminiClient()
    except:
        gemini = None
    
    # Evaluate the code
    submission_id = str(uuid.uuid4())[:8]
    evaluation = evaluate_code_submission(
        code=request.code,
        question=question,
        language=request.language,
        submission_id=submission_id,
        activity_data=request.activity_data,
        gemini_client=gemini
    )
    
    # Store submission
    submissions_data = load_json_file(CODE_SUBMISSIONS_FILE) if os.path.exists(CODE_SUBMISSIONS_FILE) else {"submissions": {}}
    
    submissions_data["submissions"][submission_id] = {
        "id": submission_id,
        "session_id": request.session_id,
        "question_id": request.question_id,
        "code": request.code,
        "language": request.language,
        "time_taken_seconds": request.time_taken_seconds,
        "submitted_at": datetime.utcnow().isoformat(),
        "evaluation": evaluation,
        "activity_data": request.activity_data
    }
    
    save_json_file(CODE_SUBMISSIONS_FILE, submissions_data)
    
    return {
        "submission_id": submission_id,
        "combined_score": evaluation["combined_score"],
        "rubric_scores": evaluation["rubric_scores"],
        "static_analysis": evaluation["static_analysis"],
        "feedback": evaluation["llm_review"].get("feedback", ""),
        "needs_review": evaluation["admin_review"]["status"] == "pending",
        "activity_flags": evaluation["activity_flags"]
    }

@app.get("/api/code/submissions")
async def list_code_submissions(session_id: Optional[str] = None, status: Optional[str] = None, limit: int = 50):
    """List code submissions with optional filters"""
    submissions_data = load_json_file(CODE_SUBMISSIONS_FILE) if os.path.exists(CODE_SUBMISSIONS_FILE) else {"submissions": {}}
    
    submissions = list(submissions_data.get("submissions", {}).values())
    
    # Filter by session_id
    if session_id:
        submissions = [s for s in submissions if s.get("session_id") == session_id]
    
    # Filter by admin review status
    if status:
        submissions = [s for s in submissions if s.get("evaluation", {}).get("admin_review", {}).get("status") == status]
    
    # Sort by submitted_at descending
    submissions.sort(key=lambda x: x.get("submitted_at", ""), reverse=True)
    
    return {
        "submissions": submissions[:limit],
        "total": len(submissions)
    }

@app.get("/api/code/submission/{submission_id}")
async def get_code_submission(submission_id: str):
    """Get a specific code submission with full details"""
    submissions_data = load_json_file(CODE_SUBMISSIONS_FILE) if os.path.exists(CODE_SUBMISSIONS_FILE) else {"submissions": {}}
    
    submission = submissions_data.get("submissions", {}).get(submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    return submission

@app.post("/api/code/review/{submission_id}")
async def review_code_submission(submission_id: str, request: AdminReviewRequest):
    """Admin review of a code submission"""
    submissions_data = load_json_file(CODE_SUBMISSIONS_FILE) if os.path.exists(CODE_SUBMISSIONS_FILE) else {"submissions": {}}
    
    if submission_id not in submissions_data.get("submissions", {}):
        raise HTTPException(status_code=404, detail="Submission not found")
    
    submission = submissions_data["submissions"][submission_id]
    
    # Update admin review
    submission["evaluation"]["admin_review"] = {
        "status": request.status,
        "reviewer": request.reviewer,
        "notes": request.notes,
        "score_override": request.score_override,
        "reviewed_at": datetime.utcnow().isoformat()
    }
    
    # Update combined score if override provided
    if request.score_override is not None:
        submission["evaluation"]["combined_score"] = request.score_override
        submission["evaluation"]["score_overridden"] = True
    
    save_json_file(CODE_SUBMISSIONS_FILE, submissions_data)
    
    return {
        "message": "Review submitted successfully",
        "submission_id": submission_id,
        "new_status": request.status,
        "final_score": submission["evaluation"]["combined_score"]
    }

@app.get("/api/code/pending-reviews")
async def get_pending_code_reviews():
    """Get all code submissions pending admin review"""
    submissions_data = load_json_file(CODE_SUBMISSIONS_FILE) if os.path.exists(CODE_SUBMISSIONS_FILE) else {"submissions": {}}
    
    pending = [
        {
            "id": s["id"],
            "session_id": s["session_id"],
            "question_id": s["question_id"],
            "language": s["language"],
            "submitted_at": s["submitted_at"],
            "combined_score": s["evaluation"]["combined_score"],
            "activity_flags": s["evaluation"].get("activity_flags", []),
            "review_reason": s["evaluation"]["admin_review"].get("reason", "")
        }
        for s in submissions_data.get("submissions", {}).values()
        if s.get("evaluation", {}).get("admin_review", {}).get("status") == "pending"
    ]
    
    # Sort by submitted_at
    pending.sort(key=lambda x: x.get("submitted_at", ""), reverse=True)
    
    return {
        "pending_reviews": pending,
        "total": len(pending)
    }

# ==================== Feedback Management Endpoints ====================

@app.post("/api/feedback/generate")
async def generate_feedback(request: dict = Body(...)):
    """Generate AI feedback with type selection (short/long)"""
    session_id = request.get("session_id")
    feedback_type = request.get("feedback_type", "short")  # 'short' or 'long'
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    if feedback_type not in ["short", "long"]:
        raise HTTPException(status_code=400, detail="feedback_type must be 'short' or 'long'")
    
    try:
        # Load result
        results_data = load_json_file(RESULTS_FILE)
        result = results_data.get("results", {}).get(session_id)
        
        if not result:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Get session log
        log_data = logger.get_session_log(session_id)
        if not log_data:
            raise HTTPException(status_code=404, detail="Session log not found")
        
        # Map user-facing types to internal types
        internal_type = "detailed" if feedback_type == "long" else "short"
        
        # Generate feedback
        feedback_content = feedback_generator.generate_feedback(
            log_data=log_data,
            result_data=result,
            feedback_type=internal_type
        )
        
        # Update result with generated feedback
        result["feedback"]["status"] = "GENERATED"
        result["feedback"]["type"] = feedback_type
        result["feedback"]["content"] = feedback_content
        result["feedback"]["generated_at"] = datetime.now().isoformat()
        
        save_json_file(RESULTS_FILE, results_data)
        
        return {
            "status": "success",
            "content": feedback_content,
            "type": feedback_type
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Feedback generation failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/feedback/approve")
async def approve_feedback(request: dict = Body(...)):
    """Approve generated feedback"""
    session_id = request.get("session_id")
    content = request.get("content")  # Allow editing before approval
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    try:
        results_data = load_json_file(RESULTS_FILE)
        result = results_data.get("results", {}).get(session_id)
        
        if not result:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Update feedback status and content
        result["feedback"]["status"] = "APPROVED"
        result["feedback"]["content"] = content or result["feedback"]["content"]
        result["feedback"]["approved_at"] = datetime.now().isoformat()
        
        save_json_file(RESULTS_FILE, results_data)
        
        return {
            "status": "success",
            "message": "Feedback approved"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Feedback approval failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/feedback/reject")
async def reject_feedback(request: dict = Body(...)):
    """Reject generated feedback"""
    session_id = request.get("session_id")
    reason = request.get("reason", "Not satisfactory")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    try:
        results_data = load_json_file(RESULTS_FILE)
        result = results_data.get("results", {}).get(session_id)
        
        if not result:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Reset feedback to allow regeneration
        result["feedback"]["status"] = "REJECTED"
        result["feedback"]["rejected_reason"] = reason
        result["feedback"]["rejected_at"] = datetime.now().isoformat()
        result["feedback"]["type"] = None
        result["feedback"]["content"] = None
        
        save_json_file(RESULTS_FILE, results_data)
        
        return {
            "status": "success",
            "message": "Feedback rejected"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Feedback rejection failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/feedback/publish")
async def publish_feedback(request: dict = Body(...)):
    """Publish approved feedback to candidate"""
    session_id = request.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    try:
        results_data = load_json_file(RESULTS_FILE)
        result = results_data.get("results", {}).get(session_id)
        
        if not result:
            raise HTTPException(status_code=404, detail="Session not found")
        
        if result["feedback"]["status"] != "APPROVED":
            raise HTTPException(status_code=400, detail="Feedback must be approved before publishing")
        
        # Update status to published
        result["feedback"]["status"] = "PUBLISHED"
        result["feedback"]["published_at"] = datetime.now().isoformat()
        
        # Generate share token if not exists
        if "share" not in result or not result.get("share", {}).get("token"):
            share_token = f"share_{uuid.uuid4().hex[:12]}"
            result["share"] = {
                "token": share_token,
                "url": f"/share/{share_token}",
                "created_at": datetime.now().isoformat()
            }
        
        save_json_file(RESULTS_FILE, results_data)
        
        return {
            "status": "success",
            "message": "Feedback published",
            "share_url": result["share"]["url"]
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Feedback publishing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


