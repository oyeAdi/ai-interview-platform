"""WebSocket message handling and routing"""
from typing import Dict, Optional
from websocket.connection_manager import ConnectionManager

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
    
    async def send_followup(self, followup_data: Dict, progress: Dict = None):
        """Send follow-up with view-specific information
        
        Candidate view: Generic label, no counts (avoid anxiety/gaming)
        Admin view: Full metrics including count, reason, confidence
        """
        # Extract metrics from followup_data or progress
        current_count = progress.get("current_followup", 0) if progress else followup_data.get("followup_number", 0)
        max_count = progress.get("max_followups", 10) if progress else 10
        stop_reason = progress.get("followup_stop_reason") if progress else None
        confidence = progress.get("followup_confidence", 0.0) if progress else 0.0
        
        # Candidate view: Clean, simple message without metrics
        candidate_message = {
            "type": "followup",
            "data": {
                "text": followup_data.get("text", ""),
                "label": "Follow-up Question",  # Generic label for candidate
                "question_type": followup_data.get("question_type", "followup")
            }
        }
        await self.connection_manager.send_to_candidate(candidate_message)
        
        # Admin view: Full metrics and insights
        admin_message = {
            "type": "followup",
            "data": {
                "text": followup_data.get("text", ""),
                "label": f"Follow-up {current_count + 1} of {max_count}",  # Detailed count for admin
                "question_type": followup_data.get("question_type", "followup"),
                "metrics": {
                    "current_count": current_count + 1,
                    "max_count": max_count,
                    "continue_reason": stop_reason,
                    "confidence": confidence
                }
            }
        }
        await self.connection_manager.send_to_admin(admin_message)
    
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
        """Send progress update with view-specific information
        
        Candidate view: Basic progress (questions completed)
        Admin view: Full metrics including follow-up details
        """
        # Candidate view: Basic progress only
        candidate_progress = {
            "type": "progress",
            "data": {
                "total_questions": progress_data.get("total_questions", 0),
                "rounds_completed": progress_data.get("rounds_completed", 0),
                "percentage": progress_data.get("percentage", 0),
                "current_round": progress_data.get("current_round", 0),
                # Hide follow-up counts from candidate
            }
        }
        await self.connection_manager.send_to_candidate(candidate_progress)
        
        # Admin view: Full progress including follow-up metrics
        admin_progress = {
            "type": "progress",
            "data": progress_data  # Full data including current_followup, max_followups, stop_reason
        }
        await self.connection_manager.send_to_admin(admin_progress)
    
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

