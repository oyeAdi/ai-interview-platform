
import logging
from typing import Optional, Dict
from datetime import datetime
import uuid
from config import Config
from utils.logger import Logger
import json
import os

logger = logging.getLogger(__name__)

async def process_session_results(session_id: str, sessions_data: Dict, logger_instance: Logger, save_candidate_fn):
    """
    Process results for a completed session:
    1. Calculate scores from log
    2. Generate feedback via LLM
    3. Save result to candidate file
    """
    try:
        # 1. Get Log
        log_data = logger_instance.get_session_log(session_id)
        if not log_data:
            print(f"[WARN] No log data found for session {session_id}")
            return None

        # 2. Get Session Info
        session_info = sessions_data.get("sessions", {}).get(session_id)
        if not session_info:
            print(f"[WARN] No session info found for {session_id}")
            return None
        
        # 3. Calculate Scores
        questions = log_data.get("questions", [])
        total_score = 0
        question_count = 0
        
        for q in questions:
            if "responses" in q and q["responses"]:
                last_resp = q["responses"][-1]
                score = last_resp.get("evaluation", {}).get("overall_score", 0)
                total_score += score
                question_count += 1
        
        final_score = round(total_score / question_count) if question_count > 0 else 0
        
        # 4. Creates Result Object (Interview Entry)
        interview_result = {
            "id": f"res_{uuid.uuid4().hex[:8]}",
            "session_id": session_id,
            "date": datetime.now().isoformat(),
            "candidate": {
                "id": session_info.get("candidate_id"),
                "name": session_info.get("candidate_name", "Candidate"),
                "email": session_info.get("candidate_account"),
                "thank_you_token": None,  # Will be set by end_interview
                "thank_you_url": None
            },
            "expert": {
                "id": session_info.get("expert_id"),
                "name": session_info.get("expert_name", "Expert")
            },
            "position": {
                "id": session_info.get("position_id"),
                "title": session_info.get("position_title") or session_info.get("candidate_role", "Position")
            },
            "overall_metrics": {
                "total_score": final_score,
                "questions_asked": question_count,
            },
            "feedback": {
                "status": "NOT_GENERATED",
                "type": None,  # 'short' or 'long'
                "content": None,
                "generated_at": None,
                "approved_at": None,
                "published_at": None,
                "rejected_reason": None
            },
            "status": "completed"
        }
        
        # 5. Generate Feedback (Async-ish)
        try:
             from llm.feedback_agent import FeedbackGenerator
             generator = FeedbackGenerator()
             
             # Prepare summary for generator
             result_summary = {
                "candidate": {
                    "name": session_info.get("candidate_name", "Candidate"),
                    "id": session_info.get("candidate_id")
                },
                "position": interview_result["position"],
                "overall_score": final_score
             }
             
             print(f"[INFO] Generating feedback for session {session_id}...")
             report_content = generator.generate_feedback(log_data, result_summary, "detailed")
             
             interview_result["feedback_report"] = {
                 "status": "GENERATED", 
                 "content": report_content,
                 "generated_at": datetime.now().isoformat()
             }
             
        except Exception as e:
            print(f"[ERROR] generating feedback: {e}")
            interview_result["feedback_report"] = {
                "status": "FAILED",
                "error": str(e)
            }

        # 6. Save Result
        filepath = save_candidate_fn(
            candidate_name=session_info.get("candidate_name", "Candidate"), 
            candidate_id=session_info.get("candidate_id"), 
            result=interview_result, 
            session_id=session_id
        )
        print(f"[INFO] Processed & Saved result to {filepath}")
        
        return interview_result

    except Exception as e:
        print(f"[ERROR] processing session results: {e}")
        import traceback
        traceback.print_exc()
        return None
