"""FastAPI server with WebSocket support"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, UploadFile, File, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional, List
from pydantic import BaseModel
import json
import os
import uuid
from datetime import datetime
from backend.config import Config
from backend.websocket.connection_manager import ConnectionManager
from backend.websocket.message_handler import MessageHandler
from backend.llm.jd_resume_analyzer import JDResumeAnalyzer
from backend.core.interview_controller import InterviewController
from backend.utils.file_parser import FileParser
from backend.utils.logger import Logger

app = FastAPI(title="AI Interviewer API")

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

# Helper functions for data file operations
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

# Data file paths
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
ORGANIZATIONS_FILE = os.path.join(MODELS_DIR, "organizations.json")
ACCOUNTS_FILE = os.path.join(MODELS_DIR, "accounts.json")
POSITIONS_FILE = os.path.join(MODELS_DIR, "positions.json")
QUESTION_BANK_FILE = os.path.join(MODELS_DIR, "question_bank.json")
WIKI_FILE = os.path.join(MODELS_DIR, "wiki.json")
SESSIONS_FILE = os.path.join(MODELS_DIR, "interview_sessions.json")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global managers
connection_manager = ConnectionManager()
message_handler = MessageHandler(connection_manager)
jd_analyzer = JDResumeAnalyzer()
file_parser = FileParser()
logger = Logger()

# Store active interviews
active_interviews: dict = {}

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "AI Interviewer API"}

@app.post("/api/analyze-language")
async def analyze_language(
    jd_text: Optional[str] = Form(None),
    jd_file: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None),
    resume_file: Optional[UploadFile] = File(None),
    jd_id: Optional[str] = Form(None),
    resume_id: Optional[str] = Form(None),
    expert_mode: Optional[str] = Form(None)
):
    """Analyze JD and Resume to determine language"""
    try:
        # Extract text from files if provided
        jd_content = jd_text or ""
        resume_content = resume_text or ""
        
        if jd_file:
            # Save uploaded file temporarily
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
        
        # Analyze language
        result = jd_analyzer.analyze(
            jd_text=jd_content,
            resume_text=resume_content
        )
        
        # Create interview controller with expert mode flag
        language = result["language"]
        is_expert_mode = expert_mode == 'true'
        controller = InterviewController(language, jd_id, expert_mode=is_expert_mode)
        session_id = controller.context_manager.session_id
        
        # Store controller
        active_interviews[session_id] = controller
        
        return {
            "language": language,
            "confidence": result["confidence"],
            "session_id": session_id,
            "expert_mode": is_expert_mode
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
    """Get all accounts for an organization"""
    data = load_json_file(ACCOUNTS_FILE)
    accounts = [acc for acc in data.get("accounts", []) if acc.get("org_id") == org_id]
    return {"accounts": accounts}

@app.get("/api/accounts")
async def get_all_accounts():
    """Get all accounts"""
    data = load_json_file(ACCOUNTS_FILE)
    return {"accounts": data.get("accounts", [])}

class AccountCreate(BaseModel):
    name: str
    description: str = ""
    org_id: str = "epam"

@app.post("/api/accounts")
async def create_account(account: AccountCreate):
    """Create a new account"""
    data = load_json_file(ACCOUNTS_FILE)
    if "accounts" not in data:
        data["accounts"] = []
    
    # Generate unique ID from name
    account_id = account.name.lower().replace(" ", "_").replace("-", "_")
    
    # Check if account already exists
    if any(acc["id"] == account_id for acc in data["accounts"]):
        raise HTTPException(status_code=400, detail="Account with this name already exists")
    
    new_account = {
        "id": account_id,
        "name": account.name,
        "org_id": account.org_id,
        "description": account.description,
        "positions": []
    }
    
    data["accounts"].append(new_account)
    save_json_file(ACCOUNTS_FILE, data)
    
    return {"status": "created", "account": new_account}

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
    """Get specific account details"""
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
    """Create a new position under an account"""
    # Verify account exists
    accounts_data = load_json_file(ACCOUNTS_FILE)
    account = next((acc for acc in accounts_data.get("accounts", []) if acc["id"] == account_id), None)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    # Load positions
    positions_data = load_json_file(POSITIONS_FILE)
    if "positions" not in positions_data:
        positions_data["positions"] = []
    
    # Generate unique ID
    position_id = f"{account_id}_{uuid.uuid4().hex[:8]}"
    
    # Create new position
    new_position = {
        "id": position_id,
        "title": position.title,
        "account_id": account_id,
        "status": position.status,
        "created_at": datetime.now().strftime("%Y-%m-%d"),
        "data_model": position.data_model.dict(),
        "jd_text": position.jd_text
    }
    
    positions_data["positions"].append(new_position)
    save_json_file(POSITIONS_FILE, positions_data)
    
    # Update account's positions list
    if position_id not in account.get("positions", []):
        account.setdefault("positions", []).append(position_id)
        save_json_file(ACCOUNTS_FILE, accounts_data)
    
    return {"status": "created", "position": new_position}

@app.get("/api/positions")
async def get_all_positions(status: Optional[str] = None):
    """Get all positions, optionally filtered by status"""
    data = load_json_file(POSITIONS_FILE)
    positions = data.get("positions", [])
    
    if status:
        positions = [pos for pos in positions if pos.get("status") == status]
    
    return {"positions": positions}

@app.get("/api/positions/{position_id}")
async def get_position(position_id: str):
    """Get specific position details with data model"""
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
        
        # Attach resume text for personalized first question
        if resume_content:
            controller.resume_text = resume_content
        
        # Store controller
        active_interviews[session_id] = controller
        
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

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, view: str = "candidate"):
    """WebSocket endpoint for interview communication"""
    await connection_manager.connect(websocket, view)
    
    session_id = None
    controller = None
    
    try:
        while True:
            data = await websocket.receive_json()
            message_type = data.get("type")
            
            if message_type == "start_interview":
                session_id = data.get("session_id")
                if not session_id:
                    await websocket.send_json({
                        "type": "error",
                        "message": "No session_id provided"
                    })
                    continue
                
                # Check if session exists in active interviews
                if session_id not in active_interviews:
                    # Try to restore session from logs
                    try:
                        log_data = logger.get_log_data()
                        session_found = False
                        
                        for session in log_data.get("interview_sessions", []):
                            if session.get("session_id") == session_id:
                                # Restore session
                                language = session.get("detected_language", "python")
                                jd_id = session.get("jd_id")
                                # Check if expert view - set expert_mode accordingly
                                is_expert = view == "expert"
                                controller = InterviewController(language, jd_id, expert_mode=is_expert)
                                controller.context_manager.session_id = session_id
                                
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
                                        if followup_num < Config.FOLLOWUPS_PER_QUESTION:
                                            # Find question in question bank
                                            from backend.core.question_manager import QuestionManager
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
                                        from backend.core.question_manager import QuestionManager
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
                            await websocket.send_json({
                                "type": "error",
                                "message": f"Session {session_id} not found. Please start a new interview from the landing page."
                            })
                            continue
                    except Exception as e:
                        import traceback
                        print(f"Error restoring session: {e}")
                        print(traceback.format_exc())
                        await websocket.send_json({
                            "type": "error",
                            "message": f"Could not restore session. Please start a new interview."
                        })
                        continue
                
                controller = active_interviews[session_id]
                
                # If expert connects, enable expert mode on the controller
                if view == "expert":
                    controller.expert_mode = True
                    print(f"Expert mode enabled for session {session_id}")
                
                # Send greeting
                greeting = controller.start_interview()
                await message_handler.handle_message(greeting, view)
                
                # Send current question if exists (for reconnection), otherwise get next
                # Always send to both views when reconnecting
                if controller.current_question:
                    # Resend current question for reconnection
                    # Convert to proper format if needed
                    if isinstance(controller.current_question, dict):
                        question_data = {
                            "type": "question",
                            "question_id": controller.current_question.get("question_id") or controller.current_question.get("id"),
                            "text": controller.current_question.get("text"),
                            "question_type": controller.current_question.get("question_type") or controller.current_question.get("type"),
                            "topic": controller.current_question.get("topic"),
                            "round_number": controller.current_question.get("round_number", 1)
                        }
                        await message_handler.send_question(question_data)
                    else:
                        await message_handler.send_question(controller.current_question)
                else:
                    # Send first question
                    question = controller.get_next_question()
                    if question:
                        await message_handler.send_question(question)
                
                await message_handler.send_progress(controller.get_progress())
            
            elif message_type == "response":
                if not controller:
                    continue
                
                response_text = data.get("text", "")
                response_type = data.get("response_type", "initial")
                
                print(f"Processing response. Expert mode: {controller.expert_mode}")
                
                # Process response
                result = controller.process_response(response_text, response_type)
                
                print(f"Response result: pending_approval={result.get('pending_approval')}, has_followup={result.get('followup') is not None}, has_pending={result.get('pending_followup') is not None}")
                
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
                    await message_handler.send_followup(result["followup"])
                    await message_handler.send_progress(controller.get_progress())
                else:
                    # No more follow-ups, complete round
                    controller.complete_round()
                    
                    # Check if interview complete
                    if controller.is_interview_complete():
                        final_summary = controller.finalize_interview()
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
                            
                            await message_handler.send_question(next_question)
                            await message_handler.send_progress(controller.get_progress())
            
            elif message_type == "get_progress":
                if controller:
                    await message_handler.send_progress(controller.get_progress())
            
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
        connection_manager.disconnect(websocket, view)
        if session_id and session_id in active_interviews:
            # Clean up if needed
            pass
    except Exception as e:
        print(f"WebSocket error: {e}")
        connection_manager.disconnect(websocket, view)

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
    from backend.llm.gemini_client import GeminiClient
    
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
    await connection_manager.broadcast({
        "type": "followup",
        "data": followup
    })
    
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
    await connection_manager.broadcast({
        "type": "followup",
        "data": followup
    })
    
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

def generate_interview_links(session_id: str, position_id: str, candidate_id: str) -> dict:
    """Generate unique links for candidate and admin views"""
    candidate_token = str(uuid.uuid4())
    admin_token = str(uuid.uuid4())
    
    session_data = {
        "session_id": session_id,
        "position_id": position_id,
        "candidate_id": candidate_id,
        "candidate_token": candidate_token,
        "admin_token": admin_token,
        "created_at": datetime.now().isoformat(),
        "status": "pending"  # pending, active, completed
    }
    
    # Load existing sessions
    sessions = load_json_file(SESSIONS_FILE)
    if "sessions" not in sessions:
        sessions["sessions"] = {}
    
    sessions["sessions"][session_id] = session_data
    save_json_file(SESSIONS_FILE, sessions)
    
    return {
        "session_id": session_id,
        "candidate_link": f"/interview/{session_id}?token={candidate_token}&view=candidate",
        "admin_link": f"/interview/{session_id}?token={admin_token}&view=admin",
        "candidate_token": candidate_token,
        "admin_token": admin_token
    }

@app.post("/api/interview/create-session")
async def create_interview_session(
    position_id: str = Body(...),
    candidate_id: str = Body(...)
):
    """Create interview session and generate unique links for candidate and admin"""
    # Validate position exists
    positions_data = load_json_file(POSITIONS_FILE)
    position = next((p for p in positions_data.get("positions", []) if p["id"] == position_id), None)
    if not position:
        raise HTTPException(status_code=404, detail="Position not found")
    
    # Validate candidate exists
    resumes_data = load_json_file(RESUMES_FILE)
    candidate = next((r for r in resumes_data.get("resumes", []) if r["id"] == candidate_id), None)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Generate session ID and links
    session_id = str(uuid.uuid4())[:8]
    links = generate_interview_links(session_id, position_id, candidate_id)
    
    return {
        "status": "created",
        "session_id": session_id,
        "position": {"id": position_id, "title": position.get("title")},
        "candidate": {"id": candidate_id, "name": candidate.get("name")},
        "links": {
            "candidate": links["candidate_link"],
            "admin": links["admin_link"]
        }
    }

@app.get("/api/interview/validate-token")
async def validate_interview_token(session_id: str, token: str):
    """Validate interview token and return view type (candidate/admin)"""
    sessions = load_json_file(SESSIONS_FILE)
    session = sessions.get("sessions", {}).get(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if token == session.get("candidate_token"):
        return {"valid": True, "view": "candidate", "session_id": session_id}
    elif token == session.get("admin_token"):
        return {"valid": True, "view": "admin", "session_id": session_id}
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
        "view": "admin" if is_admin else "candidate",
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
            "admin": f"/interview/{session_id}?token={session['admin_token']}&view=admin"
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

def search_wiki_cache(question: str, wiki_data: dict, threshold: float = 0.5) -> Optional[dict]:
    """Search wiki cache for similar questions"""
    best_match = None
    best_score = 0.0
    
    for entry in wiki_data.get("entries", []):
        # Check question similarity
        q_score = calculate_similarity(question, entry.get("question", ""))
        # Check keyword match
        k_score = sum(1 for kw in entry.get("keywords", []) if kw.lower() in question.lower()) / max(len(entry.get("keywords", [])), 1)
        
        score = (q_score * 0.7) + (k_score * 0.3)
        
        if score > best_score and score >= threshold:
            best_score = score
            best_match = entry
    
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
    from backend.llm.gemini_client import GeminiClient
    
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

class ReindexRequest(BaseModel):
    use_llm: bool = False
    category: Optional[str] = None

@app.post("/api/wiki/reindex")
async def reindex_wiki(request: ReindexRequest):
    """Manually trigger wiki reindexing (Admin only)"""
    from backend.wiki_indexer import run_indexer
    
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

