"""
Result Processing Diagnostic Tests
Tests to verify result processing pipeline works correctly
"""

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch, MagicMock
import sys
import os
import json

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from result_processor import process_session_results
from utils.logger import Logger


class TestResultProcessingPipeline:
    """Test that result processing pipeline executes correctly"""
    
    @pytest.mark.asyncio
    async def test_result_processor_can_be_imported(self):
        """Verify result processor module can be imported"""
        from result_processor import process_session_results
        assert process_session_results is not None
        
    @pytest.mark.asyncio
    async def test_feedback_generator_can_be_imported(self):
        """Verify feedback generator can be imported"""
        try:
            from llm.feedback_agent import FeedbackGenerator
            generator = FeedbackGenerator()
            assert generator is not None
        except Exception as e:
            pytest.fail(f"Failed to import FeedbackGenerator: {e}")
    
    @pytest.mark.asyncio
    async def test_process_session_results_with_mock_data(self):
        """Test result processing with mock session data"""
        # Mock session data
        session_id = "test_session_123"
        sessions_data = {
            "sessions": {
                session_id: {
                    "position_id": "pos_1",
                    "position_title": "Python Developer",
                    "candidate_name": "Test Candidate",
                    "candidate_id": "cand_1"
                }
            }
        }
        
        # Mock logger with session log
        mock_logger = Mock(spec=Logger)
        mock_logger.get_session_log = Mock(return_value={
            "questions": [
                {
                    "text": "What is Python?",
                    "topic": "Python Basics",
                    "responses": [
                        {
                            "candidate_response": "Python is a programming language",
                            "evaluation": {
                                "overall_score": 75
                            }
                        }
                    ]
                }
            ]
        })
        
        # Mock save function
        mock_save_fn = Mock(return_value="/path/to/result.json")
        
        # Test result processing
        try:
            result = await process_session_results(
                session_id=session_id,
                sessions_data=sessions_data,
                logger_instance=mock_logger,
                save_candidate_fn=mock_save_fn
            )
            
            # Verify result was created
            assert result is not None
            assert result["session_id"] == session_id
            assert "overall_metrics" in result
            assert result["overall_metrics"]["total_score"] == 75
            
            # Verify save function was called
            assert mock_save_fn.called
            
        except Exception as e:
            pytest.fail(f"Result processing failed: {e}")
    
    @pytest.mark.asyncio
    async def test_result_processing_handles_no_log_data(self):
        """Test result processing gracefully handles missing log data"""
        session_id = "test_session_no_log"
        sessions_data = {
            "sessions": {
                session_id: {
                    "position_id": "pos_1",
                    "candidate_name": "Test Candidate"
                }
            }
        }
        
        # Mock logger with no log data
        mock_logger = Mock(spec=Logger)
        mock_logger.get_session_log = Mock(return_value=None)
        
        mock_save_fn = Mock()
        
        # Should return None gracefully
        result = await process_session_results(
            session_id=session_id,
            sessions_data=sessions_data,
            logger_instance=mock_logger,
            save_candidate_fn=mock_save_fn
        )
        
        assert result is None
        assert not mock_save_fn.called


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
