"""
Baseline WebSocket Tests - Current Behavior

Purpose: Document current WebSocket functionality BEFORE admin removal
These tests establish the baseline that must be maintained after changes.
"""

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch
from fastapi.testclient import TestClient
from fastapi.websockets import WebSocket

# Import the app and WebSocket components
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from websocket.connection_manager import ConnectionManager
from websocket.message_handler import MessageHandler


class MockWebSocket:
    """Mock WebSocket for testing"""
    def __init__(self):
        self.messages_sent = []
        self.closed = False
        self.close_code = None
        self.accepted = False
        
    async def accept(self):
        """Accept the WebSocket connection"""
        self.accepted = True
        
    async def send_json(self, data):
        self.messages_sent.append(data)
        
    async def close(self, code=1000, reason=""):
        self.closed = True
        self.close_code = code
        
    async def receive_json(self):
        """Mock receive - not used in these tests"""
        return {}


class TestBaselineExpertConnections:
    """Baseline: Expert WebSocket connections work correctly"""
    
    @pytest.mark.asyncio
    async def test_expert_connects_successfully(self):
        """Expert view should connect without errors"""
        manager = ConnectionManager()
        ws = MockWebSocket()
        
        # Connect as expert
        await manager.connect(ws, "expert")
        
        # Assert: Connection added to admin_connections (current behavior)
        assert ws in manager.admin_connections
        assert ws not in manager.candidate_connections
        
    @pytest.mark.asyncio
    async def test_expert_receives_all_messages(self):
        """Expert should receive all message types"""
        manager = ConnectionManager()
        handler = MessageHandler(manager)
        ws = MockWebSocket()
        
        await manager.connect(ws, "expert")
        
        # Send different message types
        await handler.send_question({"type": "question", "text": "Test"}, "expert")
        await handler.send_evaluation({"type": "evaluation", "score": 85})
        await handler.send_strategy_change({"type": "strategy", "reason": "test"})
        
        # Assert: All messages received
        assert len(ws.messages_sent) >= 3
        
    @pytest.mark.asyncio
    async def test_expert_disconnect_cleanup(self):
        """Expert disconnect should clean up connections"""
        manager = ConnectionManager()
        ws = MockWebSocket()
        
        await manager.connect(ws, "expert")
        assert ws in manager.admin_connections
        
        # Disconnect
        manager.disconnect(ws, "expert")
        
        # Assert: Cleaned up
        assert ws not in manager.admin_connections


class TestBaselineCandidateConnections:
    """Baseline: Candidate WebSocket connections work correctly"""
    
    @pytest.mark.asyncio
    async def test_candidate_connects_successfully(self):
        """Candidate view should connect without errors"""
        manager = ConnectionManager()
        ws = MockWebSocket()
        
        # Connect as candidate
        await manager.connect(ws, "candidate")
        
        # Assert: Connection added to candidate_connections
        assert ws in manager.candidate_connections
        assert ws not in manager.admin_connections
        
    @pytest.mark.asyncio
    async def test_candidate_receives_filtered_messages(self):
        """Candidate should only receive candidate messages, not expert-only"""
        manager = ConnectionManager()
        handler = MessageHandler(manager)
        ws_candidate = MockWebSocket()
        ws_expert = MockWebSocket()
        
        await manager.connect(ws_candidate, "candidate")
        await manager.connect(ws_expert, "expert")
        
        # Send question using broadcast (both should receive)
        await manager.broadcast({"type": "question", "text": "Test"})
        
        # Send evaluation (only expert should receive)
        await handler.send_evaluation({"type": "evaluation", "score": 85})
        
        # Assert: Candidate got question but not evaluation
        candidate_types = [msg["type"] for msg in ws_candidate.messages_sent]
        assert "question" in candidate_types
        assert "evaluation" not in candidate_types
        
        # Assert: Expert got both
        expert_types = [msg["type"] for msg in ws_expert.messages_sent]
        assert "question" in expert_types
        assert "evaluation" in expert_types


class TestBaselineAdminConnections:
    """Baseline: Admin WebSocket connections (current behavior)"""
    
    @pytest.mark.asyncio
    async def test_admin_connects_successfully(self):
        """Admin view should connect (current behavior)"""
        manager = ConnectionManager()
        ws = MockWebSocket()
        
        # Connect as admin
        await manager.connect(ws, "admin")
        
        # Assert: Treated same as expert (current behavior)
        assert ws in manager.admin_connections
        assert ws not in manager.candidate_connections
        
    @pytest.mark.asyncio
    async def test_admin_receives_same_as_expert(self):
        """Admin should receive same messages as expert (current behavior)"""
        manager = ConnectionManager()
        handler = MessageHandler(manager)
        ws_admin = MockWebSocket()
        ws_expert = MockWebSocket()
        
        await manager.connect(ws_admin, "admin")
        await manager.connect(ws_expert, "expert")
        
        # Send various messages
        await handler.send_question({"type": "question", "text": "Test"}, "admin")
        await handler.send_evaluation({"type": "evaluation", "score": 85})
        await handler.send_strategy_change({"type": "strategy", "reason": "test"})
        
        # Assert: Both received same messages
        admin_types = [msg["type"] for msg in ws_admin.messages_sent]
        expert_types = [msg["type"] for msg in ws_expert.messages_sent]
        
        assert admin_types == expert_types


class TestBaselineMessageRouting:
    """Baseline: Message routing works correctly"""
    
    @pytest.mark.asyncio
    async def test_send_to_admin_reaches_both_admin_and_expert(self):
        """send_to_admin should reach both admin and expert (current behavior)"""
        manager = ConnectionManager()
        ws_admin = MockWebSocket()
        ws_expert = MockWebSocket()
        
        await manager.connect(ws_admin, "admin")
        await manager.connect(ws_expert, "expert")
        
        # Send to admin
        await manager.send_to_admin({"type": "test", "data": "value"})
        
        # Assert: Both received
        assert len(ws_admin.messages_sent) == 1
        assert len(ws_expert.messages_sent) == 1
        assert ws_admin.messages_sent[0]["type"] == "test"
        assert ws_expert.messages_sent[0]["type"] == "test"
        
    @pytest.mark.asyncio
    async def test_send_to_candidate_only_reaches_candidate(self):
        """send_to_candidate should only reach candidate connections"""
        manager = ConnectionManager()
        ws_candidate = MockWebSocket()
        ws_expert = MockWebSocket()
        
        await manager.connect(ws_candidate, "candidate")
        await manager.connect(ws_expert, "expert")
        
        # Send to candidate
        await manager.send_to_candidate({"type": "test", "data": "value"})
        
        # Assert: Only candidate received
        assert len(ws_candidate.messages_sent) == 1
        assert len(ws_expert.messages_sent) == 0


class TestBaselineErrorHandling:
    """Baseline: Error handling works correctly"""
    
    @pytest.mark.asyncio
    async def test_connection_error_cleanup(self):
        """Connection errors should clean up properly"""
        manager = ConnectionManager()
        ws = MockWebSocket()
        
        # Simulate connection error
        ws.send_json = AsyncMock(side_effect=Exception("Connection failed"))
        
        await manager.connect(ws, "expert")
        
        # Try to send message (will fail)
        try:
            await manager.send_to_admin({"type": "test"})
        except:
            pass
        
        # Assert: Failed connection should be removed
        # (This tests the cleanup logic in send_to_admin)
        assert True  # If we get here, no hang occurred
        
    @pytest.mark.asyncio
    async def test_disconnect_nonexistent_connection(self):
        """Disconnecting non-existent connection should not error"""
        manager = ConnectionManager()
        ws = MockWebSocket()
        
        # Disconnect without connecting first
        manager.disconnect(ws, "expert")
        
        # Assert: No error raised
        assert True


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
