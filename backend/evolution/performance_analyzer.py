"""Analyze strategy performance from logs"""
from typing import Dict, List
from utils.logger import Logger

class PerformanceAnalyzer:
    """Analyzes strategy performance from log data"""
    
    def __init__(self):
        self.logger = Logger()
    
    def analyze_strategy_performance(self, session_id: str) -> Dict:
        """Analyze strategy performance for a session"""
        log_data = self.logger.get_log_data()
        
        for session in log_data.get("interview_sessions", []):
            if session.get("session_id") == session_id:
                return self._analyze_session(session)
        
        return {}
    
    def _analyze_session(self, session: Dict) -> Dict:
        """Analyze a single session"""
        strategy_stats = {}
        
        for question in session.get("questions", []):
            for response in question.get("responses", []):
                strategy_info = response.get("strategy_used", {})
                strategy_id = strategy_info.get("strategy_id")
                
                if not strategy_id:
                    continue
                
                if strategy_id not in strategy_stats:
                    strategy_stats[strategy_id] = {
                        "usage_count": 0,
                        "total_improvement": 0,
                        "total_engagement": 0,
                        "success_count": 0
                    }
                
                stats = strategy_stats[strategy_id]
                stats["usage_count"] += 1
                
                metrics = strategy_info.get("performance_metrics", {})
                improvement = metrics.get("response_quality_improvement", 0)
                engagement = metrics.get("engagement_score", 0)
                
                if improvement:
                    stats["total_improvement"] += improvement
                if engagement:
                    stats["total_engagement"] += engagement
                if improvement and improvement > 0:
                    stats["success_count"] += 1
        
        # Calculate averages
        for strategy_id, stats in strategy_stats.items():
            count = stats["usage_count"]
            if count > 0:
                stats["average_score_improvement"] = stats["total_improvement"] / count
                stats["average_engagement"] = stats["total_engagement"] / count
                stats["success_rate"] = stats["success_count"] / count
        
        return strategy_stats






