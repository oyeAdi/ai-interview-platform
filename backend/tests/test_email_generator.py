"""Tests for email generation using Gemini LLM"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import pytest
from utils.email_generator import generate_interview_email, _get_fallback_email_template


class TestEmailGenerator:
    """Test email generation with Gemini LLM"""
    
    def test_generate_email_with_gemini_success(self):
        """Test successful email generation using Gemini"""
        email_html = generate_interview_email(
            candidate_name="John Doe",
            position_title="Senior Software Engineer",
            company_name="TechCorp",
            interview_link="https://example.com/interview/abc123",
            expires_at="Jan 17, 2025 at 4:00 PM",
            ttl_minutes=60
        )
        
        # Assertions
        assert email_html is not None
        assert len(email_html) > 100
        assert "John Doe" in email_html
        assert "Senior Software Engineer" in email_html
        assert "TechCorp" in email_html
        assert "https://example.com/interview/abc123" in email_html
        assert "60" in email_html or "1 hr" in email_html or "hour" in email_html
        assert "#00E5FF" in email_html  # Brand color
        # Anti-cheating disclaimer
        assert "⚠️" in email_html or "warning" in email_html.lower() or "monitored" in email_html.lower()
    
    def test_generate_email_contains_html_structure(self):
        """Test generated email has valid HTML structure"""
        email_html = generate_interview_email(
            candidate_name="Test User",
            position_title="Test Position",
            company_name="Test Company",
            interview_link="https://test.com/link",
            expires_at="Test Date",
            ttl_minutes=30
        )
        
        # Should have HTML tags
        assert "<html>" in email_html.lower() or "<!doctype" in email_html.lower()
        assert "</body>" in email_html.lower() or "<body" in email_html.lower()
    
    def test_fallback_template_structure(self):
        """Test fallback template has all required elements"""
        email_html = _get_fallback_email_template(
            candidate_name="Test User",
            position_title="Test Position",
            company_name="Test Company",
            interview_link="https://test.com/link",
            expires_at="Test Date",
            ttl_minutes=30
        )
        
        assert "<html>" in email_html
        assert "</html>" in email_html
        assert "gradient" in email_html.lower()
        assert "⚠️" in email_html
        assert "AI monitoring" in email_html or "monitored" in email_html
        assert "do not reply" in email_html.lower()
        assert "Test User" in email_html
        assert "Test Position" in email_html
        assert "https://test.com/link" in email_html
    
    def test_fallback_template_has_brand_color(self):
        """Test fallback template uses brand color"""
        email_html = _get_fallback_email_template(
            candidate_name="Test",
            position_title="Test",
            company_name="Test",
            interview_link="https://test.com",
            expires_at="Test",
            ttl_minutes=60
        )
        
        assert "#00E5FF" in email_html
    
    def test_email_includes_expiry_time(self):
        """Test email prominently displays expiry time"""
        email_html = generate_interview_email(
            candidate_name="Jane Smith",
            position_title="Product Manager",
            company_name="StartupXYZ",
            interview_link="https://example.com/interview/xyz789",
            expires_at="Jan 17, 2025 at 5:00 PM",
            ttl_minutes=120
        )
        
        # Should mention expiry
        assert "Jan 17, 2025 at 5:00 PM" in email_html or "120" in email_html or "2 hr" in email_html
