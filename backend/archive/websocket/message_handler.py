"""WebSocket message handling and routing"""
from typing import Dict, Optional
from websocket.connection_manager import ConnectionManager

class MessageHandler:
    """Handles WebSocket message routing with tenant isolation"""
    
    def __init__(self, connection_manager: ConnectionManager):
        self.connection_manager = connection_manager
    
    async def handle_message(self, message: Dict, view: str, tenant_id: str = "global"):
        """Route message based on type, view, and tenant"""
        message_type = message.get("type")
        
        print(f"[DEBUG] handle_message: type={message_type}, view={view}, tenant={tenant_id}, message={message}")
        
        # Messages for candidate
        candidate_messages = ["question", "followup", "progress", "session_end", "transition", "greeting"]
        
        # Messages for admin (includes all candidate messages plus admin-only)
        admin_messages = candidate_messages + ["evaluation", "strategy_change", "log_update"]
        
        if message_type in candidate_messages:
            print(f"[DEBUG] Sending {message_type} to candidate in tenant {tenant_id}")
            await self.connection_manager.send_to_candidate(message, tenant_id=tenant_id)
        
        if message_type in admin_messages and (view == "admin" or view == "expert"):
            print(f"[DEBUG] Sending {message_type} to admin/expert in tenant {tenant_id}")
            await self.connection_manager.send_to_admin(message, tenant_id=tenant_id)
    
    async def send_question(self, question_data: Dict, view: str = None, tenant_id: str = "global"):
        """Send question to candidate and admin for a specific tenant"""
        message = {
            "type": "question",
            "data": question_data
        }
        if view:
            # Send to specific view
            if view == "candidate":
                await self.connection_manager.send_to_candidate(message, tenant_id=tenant_id)
            elif view == "admin" or view == "expert":
                await self.connection_manager.send_to_admin(message, tenant_id=tenant_id)
        else:
            # Broadcast to all connections in this tenant
            await self.connection_manager.broadcast(message, tenant_id=tenant_id)
    
    async def send_followup(self, followup_data: Dict, progress: Dict = None, tenant_id: str = "global"):
        """Send follow-up with view-specific information and tenant isolation"""
        current_count = progress.get("current_followup", 0) if progress else followup_data.get("followup_number", 0)
        max_count = progress.get("max_followups", 10) if progress else 10
        stop_reason = progress.get("followup_stop_reason") if progress else None
        confidence = progress.get("followup_confidence", 0.0) if progress else 0.0
        
        candidate_message = {
            "type": "followup",
            "data": {
                "text": followup_data.get("text", ""),
                "label": "Follow-up Question",
                "question_type": followup_data.get("question_type", "followup")
            }
        }
        await self.connection_manager.send_to_candidate(candidate_message, tenant_id=tenant_id)
        
        admin_message = {
            "type": "followup",
            "data": {
                "text": followup_data.get("text", ""),
                "label": f"Follow-up {current_count + 1} of {max_count}",
                "question_type": followup_data.get("question_type", "followup"),
                "metrics": {
                    "current_count": current_count + 1,
                    "max_count": max_count,
                    "continue_reason": stop_reason,
                    "confidence": confidence
                }
            }
        }
        await self.connection_manager.send_to_admin(admin_message, tenant_id=tenant_id)
    
    async def send_evaluation(self, evaluation_data: Dict, tenant_id: str = "global"):
        """Send evaluation (admin only, tenant-isolated)"""
        message = {
            "type": "evaluation",
            "data": evaluation_data
        }
        await self.connection_manager.send_to_admin(message, tenant_id=tenant_id)
    
    async def send_strategy_change(self, strategy_data: Dict, tenant_id: str = "global"):
        """Send strategy change (admin only, tenant-isolated)"""
        message = {
            "type": "strategy_change",
            "data": strategy_data
        }
        await self.connection_manager.send_to_admin(message, tenant_id=tenant_id)
    
    async def send_progress(self, progress_data: Dict, tenant_id: str = "global"):
        """Send progress update with tenant isolation"""
        candidate_progress = {
            "type": "progress",
            "data": {
                "total_questions": progress_data.get("total_questions", 0),
                "rounds_completed": progress_data.get("rounds_completed", 0),
                "percentage": progress_data.get("percentage", 0),
                "current_round": progress_data.get("current_round", 0),
            }
        }
        await self.connection_manager.send_to_candidate(candidate_progress, tenant_id=tenant_id)
        
        admin_progress = {
            "type": "progress",
            "data": progress_data
        }
        await self.connection_manager.send_to_admin(admin_progress, tenant_id=tenant_id)
    
    async def send_log_update(self, log_data: Dict, tenant_id: str = "global"):
        """Send log update (admin only, tenant-isolated)"""
        message = {
            "type": "log_update",
            "data": log_data
        }
        await self.connection_manager.send_to_admin(message, tenant_id=tenant_id)
    
    async def send_session_end(self, tenant_id: str = "global"):
        """Send session end message (tenant-isolated)"""
        message = {
            "type": "session_end",
            "data": {}
        }
        await self.connection_manager.broadcast(message, tenant_id=tenant_id)
    
    async def send_typing_update(self, typing_data: Dict, tenant_id: str = "global"):
        """Send typing update from candidate to admin only (tenant-isolated)"""
        message = {
            "type": "typing",
            "data": typing_data
        }
        await self.connection_manager.send_to_admin(message, tenant_id=tenant_id)
    
    async def send_to_admin(self, message: Dict, tenant_id: str = "global"):
        """Send any message to admin/expert views only (tenant-isolated)"""
        await self.connection_manager.send_to_admin(message, tenant_id=tenant_id)

