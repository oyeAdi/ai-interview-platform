"""Tests for email sending with SendGrid and Gmail fallback"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import pytest
from unittest.mock import Mock, patch, MagicMock
from utils.email_sender import send_email_sendgrid, send_email_gmail, send_interview_email


class TestEmailSender:
    """Test email sending with SendGrid and Gmail fallback"""
    
    @patch('utils.email_sender.SendGridAPIClient')
    def test_sendgrid_success(self, mock_sg_client):
        """Test successful SendGrid email sending"""
        # Mock SendGrid response
        mock_response = Mock()
        mock_response.status_code = 202
        mock_sg_client.return_value.send.return_value = mock_response
        
        result = send_email_sendgrid(
            to_email="test@example.com",
            subject="Test Subject",
            html_body="<html><body>Test</body></html>"
        )
        
        assert result is True
    
    @patch('utils.email_sender.SendGridAPIClient')
    def test_sendgrid_failure_returns_false(self, mock_sg_client):
        """Test SendGrid failure returns False"""
        mock_sg_client.return_value.send.side_effect = Exception("SendGrid error")
        
        result = send_email_sendgrid(
            to_email="test@example.com",
            subject="Test",
            html_body="<html>Test</html>"
        )
        
        assert result is False
    
    @patch('smtplib.SMTP_SSL')
    @patch.dict('os.environ', {'GMAIL_EMAIL': 'test@gmail.com', 'GMAIL_APP_PASSWORD': 'testpass'})
    def test_gmail_smtp_success(self, mock_smtp):
        """Test successful Gmail SMTP sending"""
        # Mock SMTP server
        mock_server = MagicMock()
        mock_smtp.return_value = mock_server
        
        result = send_email_gmail(
            to_email="test@example.com",
            subject="Test",
            html_body="<html>Test</html>"
        )
        
        assert result is True
        mock_server.login.assert_called_once()
        mock_server.sendmail.assert_called_once()
        mock_server.quit.assert_called_once()
    
    @patch.dict('os.environ', {}, clear=True)
    def test_gmail_smtp_missing_credentials(self):
        """Test Gmail SMTP fails without credentials"""
        result = send_email_gmail(
            to_email="test@example.com",
            subject="Test",
            html_body="<html>Test</html>"
        )
        
        assert result is False
    
    @patch('utils.email_sender.send_email_sendgrid')
    def test_send_interview_email_sendgrid_success(self, mock_sendgrid):
        """Test send_interview_email uses SendGrid successfully"""
        mock_sendgrid.return_value = True
        
        result = send_interview_email(
            to_email="test@example.com",
            subject="Interview Invitation",
            html_body="<html>Test</html>"
        )
        
        assert result['success'] is True
        assert result['provider'] == 'sendgrid'
        assert result['error'] is None
    
    @patch('utils.email_sender.send_email_sendgrid')
    @patch('utils.email_sender.send_email_gmail')
    def test_send_interview_email_fallback_to_gmail(self, mock_gmail, mock_sendgrid):
        """Test fallback to Gmail when SendGrid fails"""
        mock_sendgrid.return_value = False
        mock_gmail.return_value = True
        
        result = send_interview_email(
            to_email="test@example.com",
            subject="Interview Invitation",
            html_body="<html>Test</html>"
        )
        
        assert result['success'] is True
        assert result['provider'] == 'gmail'
    
    @patch('utils.email_sender.send_email_sendgrid')
    @patch('utils.email_sender.send_email_gmail')
    def test_send_interview_email_both_fail(self, mock_gmail, mock_sendgrid):
        """Test both SendGrid and Gmail fail"""
        mock_sendgrid.return_value = False
        mock_gmail.return_value = False
        
        result = send_interview_email(
            to_email="test@example.com",
            subject="Interview Invitation",
            html_body="<html>Test</html>"
        )
        
        assert result['success'] is False
        assert result['provider'] is None
        assert result['error'] is not None
        assert "failed" in result['error'].lower()
