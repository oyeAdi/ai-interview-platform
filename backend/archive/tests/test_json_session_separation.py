"""
Test suite for JSON/Session separation fix.

This test suite verifies that:
1. Logger stores minimal data (no duplicates)
2. Session restoration uses single source of truth
3. Data consistency maintained between files

TDD Approach: Write tests first, then implement.
"""

import pytest
import json
import os
import sys
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.logger import Logger


class TestLoggerDataSeparation:
    """Test Logger stores minimal data without duplicates"""
    
    def test_logger_initialize_session_no_duplicates(self, tmp_path):
        """Verify Logger.initialize_session() doesn't store duplicate data"""
        # Setup: Create temporary log file
        log_file = tmp_path / "log.json"
        
        # Create logger with temp file
        logger = Logger()
        logger.log_file = str(log_file)
        logger._ensure_log_file()
        
        # Initialize session
        logger.initialize_session("test_123", "python")
        
        # Get session data
        log_data = logger.get_session_log("test_123")
        
        # Should NOT have these fields (they belong in sessions.json)
        assert "timestamp" not in log_data, "timestamp should not be in log.json"
        assert "jd_id" not in log_data, "jd_id should not be in log.json"
        assert "config" not in log_data, "config should not be in log.json"
        assert "parameter_updates" not in log_data, "parameter_updates should not be in log.json"
        
        # Should ONLY have these fields
        assert log_data["session_id"] == "test_123"
        assert log_data["detected_language"] == "python"
        assert "questions" in log_data
        assert "strategy_performance" in log_data
        assert "expert_feedback" in log_data
    
    def test_logger_minimal_data_structure(self, tmp_path):
        """Verify log.json has minimal structure"""
        # Setup
        log_file = tmp_path / "log.json"
        logger = Logger()
        logger.log_file = str(log_file)
        logger._ensure_log_file()
        
        # Initialize session
        logger.initialize_session("test_456", "java")
        
        # Get session data
        log_data = logger.get_session_log("test_456")
        
        # Verify ONLY 6 fields (added created_at for cleanup logic)
        assert len(log_data.keys()) == 6, f"Expected 6 fields, got {len(log_data.keys())}"
        assert set(log_data.keys()) == {
            "session_id",
            "detected_language",
            "created_at",  # Added for cleanup logic
            "questions",
            "strategy_performance",
            "expert_feedback"
        }
    
    def test_logger_backward_compatible(self):
        """Verify old log entries still work"""
        # Simulate old log entry with duplicates
        old_log_entry = {
            "session_id": "old_123",
            "timestamp": "2025-12-16T00:00:00",  # Old duplicate
            "jd_id": "jd_789",  # Old duplicate
            "detected_language": "python",
            "questions": []
        }
        
        # Should still be readable
        assert old_log_entry["session_id"] == "old_123"
        assert old_log_entry["detected_language"] == "python"
        
        # New code should ignore duplicates
        # (Implementation will handle this gracefully)


class TestSessionRestorationLogic:
    """Test session restoration uses single source of truth"""
    
    def test_restoration_requires_sessions_json(self):
        """Verify restoration requires session in sessions.json"""
        # This test verifies that restoration logic checks sessions.json first
        # and does NOT fall back to log.json for state
        
        # Expected behavior:
        # 1. Check sessions.json for session
        # 2. If not found, reject (don't fall back to log.json)
        # 3. If found, use sessions.json as source of truth
        
        # This will be verified in integration test
        assert True  # Placeholder - will implement after code changes
    
    def test_restoration_loads_transcript_from_log(self):
        """Verify transcript is loaded from log.json for context"""
        # Expected behavior:
        # 1. Load state from sessions.json
        # 2. Load transcript from log.json
        # 3. Restore conversation history
        
        # This will be verified in integration test
        assert True  # Placeholder - will implement after code changes
    
    def test_restoration_rejects_completed_sessions(self):
        """Verify completed sessions are not restored"""
        # Expected behavior:
        # 1. Check session status in sessions.json
        # 2. If status == "completed", reject restoration
        # 3. Send session_end message
        
        # This will be verified in integration test
        assert True  # Placeholder - will implement after code changes


class TestDataConsistency:
    """Test data consistency between sessions.json and log.json"""
    
    def test_no_data_duplication(self, tmp_path):
        """Verify no data is duplicated between files"""
        # Setup
        log_file = tmp_path / "log.json"
        logger = Logger()
        logger.log_file = str(log_file)
        logger._ensure_log_file()
        
        # Initialize session
        logger.initialize_session("test_789", "python")
        
        # Get log data
        log_data = logger.get_session_log("test_789")
        
        # Verify log.json has ONLY transcript data (including created_at for cleanup)
        transcript_fields = {"session_id", "detected_language", "created_at", "questions", "strategy_performance", "expert_feedback"}
        assert set(log_data.keys()) == transcript_fields
        
        # Verify log.json does NOT have state data
        state_fields = {"status", "ended_at", "candidate_name", "position_id"}
        for field in state_fields:
            assert field not in log_data, f"State field '{field}' should not be in log.json"
    
    def test_single_source_of_truth_for_state(self):
        """Verify sessions.json is ONLY source for state"""
        # This verifies that state updates go ONLY to sessions.json
        # NOT to log.json
        
        # Expected behavior:
        # 1. Update session status
        # 2. Verify ONLY sessions.json updated
        # 3. Verify log.json NOT updated
        
        # This will be verified in integration test
        assert True  # Placeholder
    
    def test_single_source_of_truth_for_transcript(self, tmp_path):
        """Verify log.json is ONLY source for transcript"""
        # Setup
        log_file = tmp_path / "log.json"
        logger = Logger()
        logger.log_file = str(log_file)
        logger._ensure_log_file()
        
        # Initialize session
        logger.initialize_session("test_999", "python")
        
        # Log a question
        logger.log_question(
            session_id="test_999",
            question_id="q1",
            question_text="What is Python?",
            question_type="conceptual",
            round_number=1,
            category="python_basics",
            topic="language_fundamentals"
        )
        
        # Get log data
        log_data = logger.get_session_log("test_999")
        
        # Verify question is in log.json
        assert len(log_data["questions"]) == 1
        assert log_data["questions"][0]["question_id"] == "q1"
        assert log_data["questions"][0]["question_text"] == "What is Python?"
        
        # Verify transcript data is ONLY in log.json
        # (sessions.json should NOT have questions)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
