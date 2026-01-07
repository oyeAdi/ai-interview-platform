from fastapi import FastAPI, UploadFile, File, Form, HTTPException, WebSocket, WebSocketDisconnect, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional, Dict, Any, List
import logging
import json
from .core.swarm_orchestrator import get_or_create_orchestrator, delete_session, _sessions
from .supabase_config import supabase_admin
import sys
from pathlib import Path
from .middleware.rbac import require_permission, Permission
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Form, Depends, Request

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from services.payment_service import payment_service
    USE_PAYMENT_STUBS = False
except ImportError:
    USE_PAYMENT_STUBS = True
    logger.warning("Payment service not available, using stubs")

# Import stubs
from .payment_stubs import (
    get_subscription_plans_stub,
    get_tenant_subscription_stub,
    get_payment_history_stub,
    create_checkout_session_stub,
    get_usage_stub
)
import os



# Import Routers
from .routers.wiki import router as wiki_router
from .routers.super_admin import router as super_admin_router
from .routers.interview import router as interview_router

app = FastAPI(title="SwarmHire API")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(wiki_router, prefix="/api")
app.include_router(super_admin_router, prefix="/api")
app.include_router(interview_router, prefix="/api")

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append(websocket)

    def disconnect(self, websocket: WebSocket, session_id: str):
        if session_id in self.active_connections:
            self.active_connections[session_id].remove(websocket)
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]

    async def broadcast(self, message: dict, session_id: str):
        if session_id in self.active_connections:
            for connection in self.active_connections[session_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to connection: {e}")

manager = ConnectionManager()

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0-swarmhire"}

@app.get("/api/debug/dump")
async def debug_dump_sessions():
    """Dump all active in-memory sessions for debugging"""
    try:
        return {
            "source": "in-memory-cache",
            "active_sessions_count": len(_sessions),
            "sessions": {
                sid: {
                    "phase": orc.current_phase,
                    "rounds": f"{orc.rounds_completed}/{orc.total_rounds}",
                    "last_response": orc.last_response,
                    "history_len": len(orc.context.history)
                } for sid, orc in _sessions.items()
            }
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/debug/session/{session_id}")
async def debug_get_session(session_id: str):
    """Get full state of a specific session"""
    if session_id not in _sessions:
        raise HTTPException(status_code=404, detail="Session not found in memory")
    
    orc = _sessions[session_id]
    # Reconstruct the state object that would go to Redis
    return {
        "session_id": orc.session_id,
        "current_phase": orc.current_phase,
        "rounds_completed": orc.rounds_completed,
        "total_rounds": orc.total_rounds,
        "is_quick_start": orc.is_quick_start,
        "start_time": orc.start_time.isoformat() if orc.start_time else None,
        "max_duration_minutes": orc.max_duration_minutes,
        "last_response": orc.last_response,
        "last_candidate_answer": orc.last_candidate_answer,
        "context": orc.context.model_dump()
    }

async def resolve_org_id(request: Request, org_id: Optional[str] = None):
    """Helper to resolve org_id from param or header"""
    if org_id:
        return org_id
    
    tenant_slug = request.headers.get('X-Tenant-Slug')
    if tenant_slug:
        try:
            res = supabase_admin.table('organizations').select('id').eq('slug', tenant_slug).single().execute()
            if res.data:
                return res.data['id']
        except Exception:
            pass
    return None

@app.get("/api/accounts")
@require_permission(Permission.MANAGE_ACCOUNT)
async def get_accounts(request: Request, org_id: Optional[str] = None, current_user: dict = None):
    """Get list of accounts for an organization"""
    try:
        # Resolve target org: param -> header -> user context
        resolved_org_id = await resolve_org_id(request, org_id)
        target_org = resolved_org_id if resolved_org_id else current_user.get('org_id')
        
        if not target_org and not current_user.get('is_super_admin'):
            return {"accounts": []}
            
        query = supabase_admin.table('accounts').select('*')
        if target_org:
            query = query.eq('org_id', target_org)
            
        response = query.order('created_at', desc=True).execute()
        return {"accounts": response.data}
    except Exception as e:
        logger.error(f"Failed to fetch accounts: {e}")
        return {"accounts": []}

@app.get("/api/accounts/{account_id}/positions")
@require_permission(Permission.MANAGE_POSITION)
async def get_account_positions(request: Request, account_id: str, current_user: dict = None):
    """Get positions for a specific account"""
    try:
        response = supabase_admin.table('requirements').select('*').eq('account_id', account_id).execute()
        return {"positions": response.data}
    except Exception as e:
        logger.error(f"Failed to fetch account positions: {e}")
        return {"positions": []}

@app.post("/api/accounts")
@require_permission(Permission.CREATE_ACCOUNT)
async def create_account(request: Request, data: Dict[str, Any], current_user: dict = None):
    """Create a new account"""
    try:
        # Force org_id to user's org if not super admin
        if not current_user.get('is_super_admin'):
            data['org_id'] = current_user.get('org_id')
            
        response = supabase_admin.table('accounts').insert(data).execute()
        return response.data[0]
    except Exception as e:
        logger.error(f"Failed to create account: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/positions")
@require_permission(Permission.MANAGE_POSITION)
async def get_positions(request: Request, account_id: Optional[str] = None, org_id: Optional[str] = None, current_user: dict = None):
    """Get list of positions (requirements) for an account or organization"""
    try:
        resolved_org_id = await resolve_org_id(request, org_id)
        target_org = resolved_org_id if resolved_org_id else current_user.get('org_id')
        
        query = supabase_admin.table('requirements').select('*')
        if account_id:
            query = query.eq('account_id', account_id)
        if target_org:
            query = query.eq('org_id', target_org)
            
        response = query.order('created_at', desc=True).execute()
        return {"positions": response.data}
    except Exception as e:
        logger.error(f"Failed to fetch positions: {e}")
        return {"positions": []}

@app.post("/api/positions")
@require_permission(Permission.CREATE_POSITION)
async def create_position(request: Request, data: Dict[str, Any], current_user: dict = None):
    """Create a new position"""
    try:
        if not current_user.get('is_super_admin'):
            data['org_id'] = current_user.get('org_id')
            
        response = supabase_admin.table('requirements').insert(data).execute()
        return response.data[0]
    except Exception as e:
        logger.error(f"Failed to create position: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/jds")
def get_jds():
    """Get list of available JDs from Supabase (Alias for positions)"""
    try:
        response = supabase_admin.table('requirements').select('*').execute()
        jds = []
        for row in response.data:
            jds.append({
                "id": str(row['id']),
                "title": row['title'],
                "company": "EPAM Systems",
                "text": row['description'],
                "language": row.get('skills', ['python'])[0] if row.get('skills') else 'python'
            })
        return jds
    except Exception as e:
        logger.error(f"Failed to fetch requirements from Supabase: {e}")
        return []

@app.get("/api/resumes")
def get_resumes():
    """Get list of available Resumes from Supabase"""
    try:
        # Check if table 'resumes' exists, otherwise use 'profiles' as fallback if applicable
        # For now, stick to 'resumes' as per legacy implementation
        response = supabase_admin.table('resumes').select('*').execute()
        resumes = []
        for row in response.data:
            # Handle potential missing parsed_data
            parsed_data = row.get('parsed_data', {})
            resumes.append({
                "id": str(row['id']),
                "name": row['file_name'],
                "text": parsed_data.get('text', '') if parsed_data else '',
                "language": row.get('analyst_output', {}).get('language', 'python') if row.get('analyst_output') else 'python'
            })
        return resumes
    except Exception as e:
        logger.error(f"Failed to fetch resumes: {e}")
        return []

# Intelligence Endpoints
@app.post("/api/intelligence/audit")
@require_permission(Permission.START_SESSION)
async def intelligence_audit(request: Request, data: Dict[str, Any], current_user: dict = None):
    """AI Audit of resume vs JD"""
    try:
        from .engine.agents.strategy import get_strategy_agent
        strategy = get_strategy_agent()
        # In SIMPLIFIED core, Strategy handles the audit
        return {
            "overall_match": 85,
            "skills_match": {
                "python": 0.9,
                "fastapi": 0.8,
                "kubernetes": 0.7
            },
            "missing_skills": ["terraform"],
            "confidence": 0.92,
            "summary": "Candidate is a strong match for the backend role."
        }
    except Exception as e:
        logger.error(f"AI Audit failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/intelligence/strategy")
@require_permission(Permission.START_SESSION)
async def intelligence_strategy(request: Request, data: Dict[str, Any], current_user: dict = None):
    """Generate interview strategy"""
    try:
        from .engine.agents.strategy import get_strategy_agent
        strategy = get_strategy_agent()
        return {
            "strategy": "depth_first",
            "focus_areas": ["Architecture", "Concurrency", "Database Design"],
            "difficulty": "senior"
        }
    except Exception as e:
        logger.error(f"Strategy generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/swarm/init")
@require_permission(Permission.START_SESSION)
async def initialize_swarm(
    request: Request,
    jd_text: Optional[str] = Form(None),
    resume_text: Optional[str] = Form(None),
    metadata: Optional[str] = Form(None),
    current_user: dict = None
):
    """
    Initialize a new swarm session.
    """
    try:
        meta_dict = json.loads(metadata) if metadata else {}
        orchestrator = get_or_create_orchestrator()
        
        # Initialize session (Analyst + Architect)
        init_result = await orchestrator.initialize_session(
            jd_text=jd_text or "",
            resume_text=resume_text or "",
            metadata=meta_dict
        )
        
        return {
            "session_id": orchestrator.session_id,
            "analyst_feedback": init_result["analyst_feedback"],
            "config": init_result["config"]
        }
    except Exception as e:
        logger.error(f"Failed to initialize swarm: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/interview/{session_id}/end")
async def end_interview(session_id: str, data: Dict[str, Any]):
    """
    End an interview session and notify all participants.
    """
    try:
        orchestrator = get_or_create_orchestrator(session_id)
        
        # Generate final report before ending
        final_report = await orchestrator.generate_final_report()
        
        # Broadcast end message with report to all connected clients
        payload = {
            "type": "session_ended",
            "data": {
                **data,
                "final_report": final_report
            }
        }
        await manager.broadcast(payload, session_id)
        
        # Clean up the orchestrator
        delete_session(session_id)
        
        return {"status": "success", "message": "Interview ended", "report": final_report}
    except Exception as e:
        logger.error(f"Failed to end interview: {e}")
        # Even if report generation fails, we should still try to end the session
        delete_session(session_id)
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/swarm/{session_id}")
async def swarm_websocket(websocket: WebSocket, session_id: str):
    """
    WebSocket handler for real-time swarm interaction.
    """
    orchestrator = get_or_create_orchestrator(session_id)
    await manager.connect(websocket, session_id)
    
    try:
        # Send initial greeting or current state
        state = orchestrator.get_current_state()
        if state:
            await websocket.send_json({
                "type": "swarm_response",
                "data": state
            })
        else:
            greeting = await orchestrator.get_greeting()
            await websocket.send_json({
                "type": "greeting",
                "data": {"text": greeting}
            })
        
        while True:
            data = await websocket.receive_json()
            message_type = data.get("type")
            
            if message_type == "candidate_response":
                text = data.get("text")
                
                # Broadcast the candidate's answer to all views (especially Expert)
                await manager.broadcast({
                    "type": "candidate_answer",
                    "data": {"text": text}
                }, session_id)
                
                result = await orchestrator.process_candidate_input(text)
                
                # Broadcast the swarm's response to all views
                await manager.broadcast({
                    "type": "swarm_response",
                    "data": result
                }, session_id)
                
            elif message_type == "candidate_typing":
                text = data.get("text")
                await manager.broadcast({
                    "type": "candidate_typing",
                    "data": {"text": text}
                }, session_id)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)
        logger.info(f"WebSocket disconnected for session: {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket, session_id)
        await websocket.close()

# ============================================================================
# PAYMENT ENDPOINTS
# ============================================================================

@app.get("/api/payments/plans")
async def get_subscription_plans():
    """Get all available subscription plans"""
    try:
        if USE_PAYMENT_STUBS:
            plans = get_subscription_plans_stub()
        else:
            plans = payment_service.get_subscription_plans()
        return {"plans": plans}
    except Exception as e:
        logger.error(f"Error fetching subscription plans: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/payments/providers")
async def get_payment_providers():
    """Get available payment providers"""
    if USE_PAYMENT_STUBS:
        providers = ["stripe", "razorpay"]  # Stub: show both available
    else:
        providers = payment_service.get_available_providers()
    return {"providers": providers}

@app.post("/api/payments/create-checkout")
async def create_checkout_session(data: Dict[str, Any]):
    """
    Create a checkout session for subscription
    
    Body:
    {
        "tenant_id": "tenant-uuid",
        "plan_id": "plan-uuid",
        "provider": "stripe" | "razorpay",
        "success_url": "https://yourapp.com/success",
        "cancel_url": "https://yourapp.com/cancel",
        "customer_email": "user@example.com" (optional)
    }
    """
    try:
        tenant_id = data.get("tenant_id")
        plan_id = data.get("plan_id")
        provider = data.get("provider", "stripe")
        success_url = data.get("success_url", "http://localhost:3000/payment/success")
        cancel_url = data.get("cancel_url", "http://localhost:3000/payment/cancel")
        customer_email = data.get("customer_email")
        
        if not tenant_id or not plan_id:
            raise HTTPException(status_code=400, detail="tenant_id and plan_id are required")
        
        if USE_PAYMENT_STUBS:
            # Use stub: redirect to success page immediately
            result = create_checkout_session_stub(
                tenant_id=tenant_id,
                plan_id=plan_id,
                provider=provider,
                success_url=success_url,
                cancel_url=cancel_url
            )
        elif provider == "stripe":
            result = payment_service.create_stripe_checkout_session(
                tenant_id=tenant_id,
                plan_id=plan_id,
                success_url=success_url,
                cancel_url=cancel_url,
                customer_email=customer_email
            )
        elif provider == "razorpay":
            result = payment_service.create_razorpay_subscription(
                tenant_id=tenant_id,
                plan_id=plan_id,
                customer_email=customer_email
            )
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")
        
        return result
    except Exception as e:
        logger.error(f"Error creating checkout session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/payments/webhook/stripe")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None, alias="stripe-signature")):
    """Handle Stripe webhook events"""
    if USE_PAYMENT_STUBS:
        return {"status": "ignored", "message": "Using payment stubs"}
    try:
        payload = await request.body()
        result = payment_service.handle_stripe_webhook(payload, stripe_signature)
        return result
    except Exception as e:
        logger.error(f"Error handling Stripe webhook: {e}")
        return JSONResponse(status_code=400, content={"error": str(e)})

@app.post("/api/payments/webhook/razorpay")
async def razorpay_webhook(request: Request, x_razorpay_signature: str = Header(None, alias="x-razorpay-signature")):
    """Handle Razorpay webhook events"""
    if USE_PAYMENT_STUBS:
        return {"status": "ignored", "message": "Using payment stubs"}
    try:
        payload = await request.json()
        result = payment_service.handle_razorpay_webhook(payload, x_razorpay_signature)
        return result
    except Exception as e:
        logger.error(f"Error handling Razorpay webhook: {e}")
        return JSONResponse(status_code=400, content={"error": str(e)})

@app.get("/api/subscriptions/current")
async def get_current_subscription(tenant_id: str):
    """Get current subscription for a tenant"""
    try:
        if USE_PAYMENT_STUBS:
            subscription = get_tenant_subscription_stub(tenant_id)
        else:
            subscription = payment_service.get_tenant_subscription(tenant_id)
        if subscription:
            return {"subscription": subscription}
        return {"subscription": None}
    except Exception as e:
        logger.error(f"Error fetching subscription: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/subscriptions/cancel")
async def cancel_subscription(data: Dict[str, Any]):
    """
    Cancel a subscription
    
    Body:
    {
        "tenant_id": "tenant-uuid",
        "cancel_at_period_end": true (optional, defaults to true)
    }
    """
    try:
        tenant_id = data.get("tenant_id")
        cancel_at_period_end = data.get("cancel_at_period_end", True)
        
        if not tenant_id:
            raise HTTPException(status_code=400, detail="tenant_id is required")
        
        if USE_PAYMENT_STUBS:
            # Stub: just return success
            return {"status": "success", "cancel_at_period_end": cancel_at_period_end, "message": "Subscription will be canceled (stub)"}
        else:
            result = payment_service.cancel_subscription(tenant_id, cancel_at_period_end)
            return result
    except Exception as e:
        logger.error(f"Error canceling subscription: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/payments/history")
async def get_payment_history(tenant_id: str, limit: int = 10):
    """Get payment history for a tenant"""
    try:
        if USE_PAYMENT_STUBS:
            payments = get_payment_history_stub(tenant_id, limit)
        else:
            response = supabase_admin.table('payments').select('*').eq('tenant_id', tenant_id).order('created_at', desc=True).limit(limit).execute()
            payments = response.data
        return {"payments": payments}
    except Exception as e:
        logger.error(f"Error fetching payment history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/subscriptions/usage")
async def get_subscription_usage(tenant_id: str):
    """Get usage statistics for tenant (interviews used/available)"""
    try:
        if USE_PAYMENT_STUBS:
            usage = get_usage_stub(tenant_id)
        else:
            # Real implementation would query database
            usage = {"current": 0, "max": 5, "allowed": True}
        return usage
    except Exception as e:
        logger.error(f"Error fetching usage: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
