"""FastAPI server with WebSocket support"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional
import json
import os
from backend.config import Config
from backend.websocket.connection_manager import ConnectionManager
from backend.websocket.message_handler import MessageHandler
from backend.llm.jd_resume_analyzer import JDResumeAnalyzer
from backend.core.interview_controller import InterviewController
from backend.utils.file_parser import FileParser
from backend.utils.logger import Logger

app = FastAPI(title="AI Interviewer API")

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

