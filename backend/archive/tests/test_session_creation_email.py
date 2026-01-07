"""Test session creation with email sending scenarios"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import pytest
from unittest.mock import Mock, patch, MagicMock
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


class TestSessionCreationWithEmail:
    """Test session creation handles email failures gracefully"""
    
    @patch('main.send_interview_email')
    @patch('main.generate_interview_email')
    def test_session_creation_email_success(self, mock_generate, mock_send):
        """Test session creation with successful email sending"""
        # Mock email generation and sending
        mock_generate.return_value = "<html>Email content</html>"
        mock_send.return_value = {
            'success': True,
            'provider': 'sendgrid',
            'error': None
        }
        
        response = client.post(
            "/api/interview/create-session",
            json={
                "position_id": "pos_001",
                "candidate_id": "cand_001",
                "ttl_minutes": 60,
                "send_email": True,
                "candidate_email": "test@example.com"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "created"
        assert data["email_sent"] is True
        assert data["email_provider"] == "sendgrid"
        assert "links" in data  # QR links included
        assert "session_id" in data
    
    @patch('main.send_interview_email')
    @patch('main.generate_interview_email')
    def test_session_creation_email_failure_returns_qr(self, mock_generate, mock_send):
        """Test session creation returns QR links even if email fails"""
        # Mock email generation success but sending failure
        mock_generate.return_value = "<html>Email content</html>"
        mock_send.return_value = {
            'success': False,
            'provider': None,
            'error': 'SendGrid and Gmail both failed'
        }
        
        response = client.post(
            "/api/interview/create-session",
            json={
                "position_id": "pos_001",
                "candidate_id": "cand_001",
                "ttl_minutes": 60,
                "send_email": True,
                "candidate_email": "test@example.com"
            }
        )
        
        # CRITICAL: Should return 200, NOT 500
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "created"
        assert data["email_sent"] is False
        assert "email_error" in data
        assert "links" in data  # QR links still included
        assert "session_id" in data
    
    @patch('main.send_interview_email')
    @patch('main.generate_interview_email')
    def test_session_creation_email_exception_returns_qr(self, mock_generate, mock_send):
        """Test session creation returns QR links even if email throws exception"""
        # Mock email generation throwing exception
        mock_generate.side_effect = Exception("Gemini API error")
        
        response = client.post(
            "/api/interview/create-session",
            json={
                "position_id": "pos_001",
                "candidate_id": "cand_001",
                "ttl_minutes": 60,
                "send_email": True,
                "candidate_email": "test@example.com"
            }
        )
        
        # CRITICAL: Should return 200, NOT 500
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "created"
        assert data["email_sent"] is False
        assert "email_error" in data
        assert "links" in data  # QR links still included
        assert "session_id" in data
    
    def test_session_creation_without_email(self):
        """Test session creation without email (QR only)"""
        response = client.post(
            "/api/interview/create-session",
            json={
                "position_id": "pos_001",
                "candidate_id": "cand_001",
                "ttl_minutes": 60,
                "send_email": False
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "created"
        assert "email_sent" not in data or data.get("email_sent") is False
        assert "links" in data
        assert "session_id" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
