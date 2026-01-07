"""
Test suite for log.json cleanup functionality.

Tests the CLEAN SLATE approach:
- Archives ALL old sessions
- Keeps ONLY the current session in log.json
- Maximum performance and simplicity
"""

import pytest
import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.logger import Logger
from config import Config


class TestLoggerCleanup:
    """Test Logger cleanup functionality - Clean Slate Approach"""
    
    def test_cleanup_keeps_only_current_session(self, tmp_path, monkeypatch):
        """Verify cleanup keeps ONLY the current session"""
        # Setup
        log_file = tmp_path / "log.json"
        archive_file = tmp_path / "log_archive.json"
        
        # Patch Config values
        monkeypatch.setattr(Config, "LOG_FILE", str(log_file))
        monkeypatch.setattr(Config, "LOG_ARCHIVE_FILE", str(archive_file))
        
        # Create logger
        logger = Logger()
        
        # Create 5 sessions (should keep only last one)
        for i in range(5):
            logger.initialize_session(f"session_{i}", "python")
        
        # Load log data
        with open(log_file, 'r') as f:
            log_data = json.load(f)
        
        # Should have only 1 session (current one)
        assert len(log_data["interview_sessions"]) == 1
        assert log_data["interview_sessions"][0]["session_id"] == "session_4"
        
        # Check archive file exists and has old sessions
        assert os.path.exists(archive_file)
        with open(archive_file, 'r') as f:
            archive_data = json.load(f)
        
        # Should have 4 archived sessions
        assert len(archive_data["archived_sessions"]) == 4
        assert archive_data["total_archived"] == 4
    
    def test_no_cleanup_for_first_session(self, tmp_path, monkeypatch):
        """Verify no cleanup when only one session exists"""
        # Setup
        log_file = tmp_path / "log.json"
        archive_file = tmp_path / "log_archive.json"
        
        # Patch Config values
        monkeypatch.setattr(Config, "LOG_FILE", str(log_file))
        monkeypatch.setattr(Config, "LOG_ARCHIVE_FILE", str(archive_file))
        
        logger = Logger()
        
        # Create only 1 session
        logger.initialize_session("session_0", "python")
        
        # Load log data
        with open(log_file, 'r') as f:
            log_data = json.load(f)
        
        # Should have 1 session
        assert len(log_data["interview_sessions"]) == 1
        
        # Archive file should not exist (no cleanup needed)
        assert not os.path.exists(archive_file)
    
    def test_archive_preserves_all_data(self, tmp_path, monkeypatch):
        """Verify archived sessions preserve all data"""
        # Setup
        log_file = tmp_path / "log.json"
        archive_file = tmp_path / "log_archive.json"
        
        # Patch Config values
        monkeypatch.setattr(Config, "LOG_FILE", str(log_file))
        monkeypatch.setattr(Config, "LOG_ARCHIVE_FILE", str(archive_file))
        
        logger = Logger()
        
        # Create session with full data
        logger.initialize_session("session_1", "python")
        logger.log_question(
            "session_1",
            "q1",
            "What is Python?",
            "conceptual",
            1,
            "python_basics",
            "language"
        )
        
        # Create second session (should archive first)
        logger.initialize_session("session_2", "java")
        
        # Check archive
        with open(archive_file, 'r') as f:
            archive_data = json.load(f)
        
        archived_session = archive_data["archived_sessions"][0]
        assert archived_session["session_id"] == "session_1"
        assert archived_session["detected_language"] == "python"
        assert len(archived_session["questions"]) == 1
        assert archived_session["questions"][0]["question_text"] == "What is Python?"
    
    def test_sequential_archiving(self, tmp_path, monkeypatch):
        """Verify each new session archives the previous one"""
        # Setup
        log_file = tmp_path / "log.json"
        archive_file = tmp_path / "log_archive.json"
        
        # Patch Config values
        monkeypatch.setattr(Config, "LOG_FILE", str(log_file))
        monkeypatch.setattr(Config, "LOG_ARCHIVE_FILE", str(archive_file))
        
        logger = Logger()
        
        # Create 3 sessions sequentially
        logger.initialize_session("session_1", "python")
        logger.initialize_session("session_2", "java")
        logger.initialize_session("session_3", "javascript")
        
        # Load log data
        with open(log_file, 'r') as f:
            log_data = json.load(f)
        
        # Should have only session_3
        assert len(log_data["interview_sessions"]) == 1
        assert log_data["interview_sessions"][0]["session_id"] == "session_3"
        
        # Check archive has session_1 and session_2
        with open(archive_file, 'r') as f:
            archive_data = json.load(f)
        
        archived_ids = [s["session_id"] for s in archive_data["archived_sessions"]]
        assert "session_1" in archived_ids
        assert "session_2" in archived_ids
        assert len(archived_ids) == 2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
