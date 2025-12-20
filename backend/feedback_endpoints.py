# Feedback Generation and Approval Endpoints

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
