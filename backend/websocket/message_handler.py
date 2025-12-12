"""WebSocket message handling and routing"""
from typing import Dict, Optional
from backend.websocket.connection_manager import ConnectionManager

class MessageHandler:
    """Handles WebSocket message routing"""
    
    def __init__(self, connection_manager: ConnectionManager):
        self.connection_manager = connection_manager
    
    async def handle_message(self, message: Dict, view: str):
        """Route message based on type and view"""
        message_type = message.get("type")
        
        # Messages for candidate
        candidate_messages = ["question", "followup", "progress", "session_end", "transition", "greeting"]
        
        # Messages for admin (includes all candidate messages plus admin-only)
        admin_messages = candidate_messages + ["evaluation", "strategy_change", "log_update"]
        
        if message_type in candidate_messages:
            await self.connection_manager.send_to_candidate(message)
        
        if message_type in admin_messages and view == "admin":
            await self.connection_manager.send_to_admin(message)
    
    async def send_question(self, question_data: Dict):
        """Send question to candidate and admin"""
        message = {
            "type": "question",
            "data": question_data
        }
        await self.connection_manager.broadcast(message)
    
    async def send_followup(self, followup_data: Dict):
        """Send follow-up to candidate and admin"""
        message = {
            "type": "followup",
            "data": followup_data
        }
        await self.connection_manager.broadcast(message)
    
    async def send_evaluation(self, evaluation_data: Dict):
        """Send evaluation (admin only)"""
        message = {
            "type": "evaluation",
            "data": evaluation_data
        }
        await self.connection_manager.send_to_admin(message)
    
    async def send_strategy_change(self, strategy_data: Dict):
        """Send strategy change (admin only)"""
        message = {
            "type": "strategy_change",
            "data": strategy_data
        }
        await self.connection_manager.send_to_admin(message)
    
    async def send_progress(self, progress_data: Dict):
        """Send progress update"""
        message = {
            "type": "progress",
            "data": progress_data
        }
        await self.connection_manager.broadcast(message)
    
    async def send_log_update(self, log_data: Dict):
        """Send log update (admin only)"""
        message = {
            "type": "log_update",
            "data": log_data
        }
        await self.connection_manager.send_to_admin(message)
    
    async def send_session_end(self):
        """Send session end message"""
        message = {
            "type": "session_end",
            "data": {}
        }
        await self.connection_manager.broadcast(message)
    
    async def send_typing_update(self, typing_data: Dict):
        """Send typing update from candidate to admin only"""
        message = {
            "type": "typing",
            "data": typing_data
        }
        await self.connection_manager.send_to_admin(message)
    
    async def send_to_admin(self, message: Dict):
        """Send any message to admin/expert views only"""
        await self.connection_manager.send_to_admin(message)

