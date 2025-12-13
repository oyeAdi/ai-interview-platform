"""
Code Evaluator Module

Provides comprehensive code evaluation including:
- Static analysis (complexity, style, patterns)
- LLM-based code review
- Rubric scoring
- Admin review flagging
"""

import re
import ast
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime
import json


@dataclass
class StaticAnalysisResult:
    """Result of static code analysis"""
    lines_of_code: int = 0
    cyclomatic_complexity: int = 1
    functions_count: int = 0
    classes_count: int = 0
    imports_count: int = 0
    style_issues: List[str] = field(default_factory=list)
    detected_patterns: List[str] = field(default_factory=list)
    syntax_valid: bool = True
    error_message: str = ""


@dataclass
class CodeSubmission:
    """Represents a code submission"""
    submission_id: str
    question_id: str
    candidate_code: str
    language: str
    submitted_at: str = ""
    time_taken_seconds: int = 0
    
    def __post_init__(self):
        if not self.submitted_at:
            self.submitted_at = datetime.utcnow().isoformat()


@dataclass
class CodeEvaluation:
    """Complete evaluation result for a code submission"""
    submission_id: str
    question_id: str
    static_analysis: StaticAnalysisResult
    llm_review: Dict[str, Any]
    rubric_scores: Dict[str, float]
    combined_score: float
    admin_review: Dict[str, Any]
    activity_flags: List[str] = field(default_factory=list)


class PythonAnalyzer:
    """Static analyzer for Python code"""
    
    def analyze(self, code: str) -> StaticAnalysisResult:
        result = StaticAnalysisResult()
        
        # Count lines of code (non-empty, non-comment)
        lines = [l.strip() for l in code.split('\n') if l.strip() and not l.strip().startswith('#')]
        result.lines_of_code = len(lines)
        
        # Try to parse the AST
        try:
            tree = ast.parse(code)
            result.syntax_valid = True
            
            # Count various elements
            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef) or isinstance(node, ast.AsyncFunctionDef):
                    result.functions_count += 1
                elif isinstance(node, ast.ClassDef):
                    result.classes_count += 1
                elif isinstance(node, ast.Import) or isinstance(node, ast.ImportFrom):
                    result.imports_count += 1
            
            # Calculate cyclomatic complexity (simplified)
            result.cyclomatic_complexity = self._calculate_complexity(tree)
            
            # Detect patterns
            result.detected_patterns = self._detect_patterns(code, tree)
            
        except SyntaxError as e:
            result.syntax_valid = False
            result.error_message = str(e)
        
        # Check style issues
        result.style_issues = self._check_style(code)
        
        return result
    
    def _calculate_complexity(self, tree: ast.AST) -> int:
        """Calculate cyclomatic complexity (simplified)"""
        complexity = 1  # Base complexity
        
        for node in ast.walk(tree):
            # Each decision point adds 1 to complexity
            if isinstance(node, (ast.If, ast.While, ast.For, ast.ExceptHandler)):
                complexity += 1
            elif isinstance(node, ast.BoolOp):
                complexity += len(node.values) - 1
            elif isinstance(node, (ast.ListComp, ast.SetComp, ast.GeneratorExp, ast.DictComp)):
                complexity += 1
        
        return complexity
    
    def _detect_patterns(self, code: str, tree: ast.AST) -> List[str]:
        """Detect common algorithmic patterns"""
        patterns = []
        code_lower = code.lower()
        
        # Check for recursion
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                func_name = node.name
                for child in ast.walk(node):
                    if isinstance(child, ast.Call):
                        if isinstance(child.func, ast.Name) and child.func.id == func_name:
                            patterns.append("recursion")
                            break
        
        # Check for common patterns via keywords
        pattern_keywords = {
            "dynamic programming": ["dp", "memo", "cache", "lru_cache", "memoiz"],
            "binary search": ["binary_search", "bisect", "left", "right", "mid"],
            "two pointers": ["left", "right", "while left", "while i <"],
            "sliding window": ["window", "sliding"],
            "hash map": ["dict()", "hashmap", "{}"],
            "bfs": ["queue", "bfs", "deque"],
            "dfs": ["dfs", "stack", "visited"],
            "sorting": ["sort", "sorted"],
            "heap": ["heapq", "heap"],
        }
        
        for pattern, keywords in pattern_keywords.items():
            for kw in keywords:
                if kw in code_lower:
                    if pattern not in patterns:
                        patterns.append(pattern)
                    break
        
        return patterns
    
    def _check_style(self, code: str) -> List[str]:
        """Check for common style issues"""
        issues = []
        lines = code.split('\n')
        
        for i, line in enumerate(lines, 1):
            # Line too long
            if len(line) > 120:
                issues.append(f"Line {i}: exceeds 120 characters")
            
            # Trailing whitespace
            if line != line.rstrip():
                issues.append(f"Line {i}: trailing whitespace")
            
            # Multiple statements on one line
            if ';' in line and not line.strip().startswith('#'):
                issues.append(f"Line {i}: multiple statements (semicolon)")
        
        # Check naming conventions
        if re.search(r'\bdef [A-Z]', code):
            issues.append("Function name uses UpperCase (should be snake_case)")
        
        return issues[:10]  # Limit to 10 issues


class JavaAnalyzer:
    """Static analyzer for Java code"""
    
    def analyze(self, code: str) -> StaticAnalysisResult:
        result = StaticAnalysisResult()
        
        # Count lines of code
        lines = [l.strip() for l in code.split('\n') if l.strip() and not l.strip().startswith('//')]
        result.lines_of_code = len(lines)
        
        # Simple parsing for Java
        result.functions_count = len(re.findall(r'\b(public|private|protected)?\s*(static)?\s*\w+\s+\w+\s*\([^)]*\)\s*\{', code))
        result.classes_count = len(re.findall(r'\bclass\s+\w+', code))
        result.imports_count = len(re.findall(r'\bimport\s+', code))
        
        # Simple complexity estimation
        result.cyclomatic_complexity = 1
        result.cyclomatic_complexity += len(re.findall(r'\bif\s*\(', code))
        result.cyclomatic_complexity += len(re.findall(r'\bfor\s*\(', code))
        result.cyclomatic_complexity += len(re.findall(r'\bwhile\s*\(', code))
        result.cyclomatic_complexity += len(re.findall(r'\bcatch\s*\(', code))
        
        # Detect patterns
        result.detected_patterns = self._detect_patterns(code)
        
        # Check style
        result.style_issues = self._check_style(code)
        
        # Check syntax (basic)
        result.syntax_valid = self._check_syntax(code)
        
        return result
    
    def _detect_patterns(self, code: str) -> List[str]:
        patterns = []
        code_lower = code.lower()
        
        if "recursion" in code_lower or re.search(r'\w+\s*\([^)]*\)\s*{[^}]*\1\s*\(', code):
            patterns.append("recursion")
        if "hashmap" in code_lower or "hashtable" in code_lower:
            patterns.append("hash map")
        if "priorityqueue" in code_lower:
            patterns.append("heap")
        if "arrays.sort" in code_lower or "collections.sort" in code_lower:
            patterns.append("sorting")
        if "queue" in code_lower or "linkedlist" in code_lower:
            patterns.append("bfs")
        if "stack" in code_lower:
            patterns.append("dfs")
        
        return patterns
    
    def _check_style(self, code: str) -> List[str]:
        issues = []
        
        # Check for proper bracing
        if re.search(r'\bif\s*\([^)]+\)\s*\n\s*\{', code):
            issues.append("Consider placing opening brace on same line as condition")
        
        # Check for magic numbers
        magic_numbers = re.findall(r'(?<![\w.])[2-9]\d+(?![\w.])', code)
        if magic_numbers:
            issues.append(f"Consider using named constants instead of magic numbers: {magic_numbers[:3]}")
        
        return issues[:10]
    
    def _check_syntax(self, code: str) -> bool:
        # Basic checks
        open_braces = code.count('{')
        close_braces = code.count('}')
        if open_braces != close_braces:
            return False
        
        open_parens = code.count('(')
        close_parens = code.count(')')
        if open_parens != close_parens:
            return False
        
        return True


class CodeEvaluator:
    """
    Main code evaluator that combines static analysis and LLM review.
    """
    
    def __init__(self, gemini_client=None):
        self.gemini_client = gemini_client
        self.analyzers = {
            'python': PythonAnalyzer(),
            'java': JavaAnalyzer(),
        }
    
    def evaluate(
        self,
        submission: CodeSubmission,
        question: Dict,
        activity_data: Dict = None
    ) -> CodeEvaluation:
        """
        Perform complete evaluation of a code submission.
        
        Args:
            submission: The code submission
            question: The question with test cases and rubric
            activity_data: Activity tracking data (for cheating detection flags)
        
        Returns:
            Complete CodeEvaluation result
        """
        # Step 1: Static Analysis
        static_result = self._static_analysis(submission)
        
        # Step 2: LLM Review (if available)
        llm_review = self._llm_review(submission, question)
        
        # Step 3: Calculate rubric scores
        rubric_scores = self._calculate_rubric_scores(
            static_result, llm_review, question.get("evaluation_rubric", {})
        )
        
        # Step 4: Calculate combined score
        combined_score = self._calculate_combined_score(rubric_scores, question.get("evaluation_rubric", {}))
        
        # Step 5: Check for activity flags
        activity_flags = self._check_activity_flags(activity_data) if activity_data else []
        
        # Step 6: Determine if admin review is needed
        admin_review = self._create_admin_review_record(
            submission, combined_score, activity_flags
        )
        
        return CodeEvaluation(
            submission_id=submission.submission_id,
            question_id=submission.question_id,
            static_analysis=static_result,
            llm_review=llm_review,
            rubric_scores=rubric_scores,
            combined_score=combined_score,
            admin_review=admin_review,
            activity_flags=activity_flags
        )
    
    def _static_analysis(self, submission: CodeSubmission) -> StaticAnalysisResult:
        """Perform static analysis on the code"""
        analyzer = self.analyzers.get(submission.language.lower())
        
        if analyzer:
            return analyzer.analyze(submission.candidate_code)
        
        # Fallback: basic analysis
        result = StaticAnalysisResult()
        lines = [l for l in submission.candidate_code.split('\n') if l.strip()]
        result.lines_of_code = len(lines)
        return result
    
    def _llm_review(self, submission: CodeSubmission, question: Dict) -> Dict:
        """Get LLM-based code review"""
        if not self.gemini_client:
            return {
                "correctness": 50,
                "efficiency": 50,
                "code_quality": 50,
                "edge_cases": 50,
                "feedback": "LLM review not available",
                "approach": "Manual review required"
            }
        
        try:
            return self.gemini_client.review_code(
                code=submission.candidate_code,
                question=question,
                language=submission.language
            )
        except Exception as e:
            print(f"LLM review error: {e}")
            return {
                "correctness": 50,
                "efficiency": 50,
                "code_quality": 50,
                "edge_cases": 50,
                "feedback": f"Review error: {str(e)}",
                "approach": "Manual review required"
            }
    
    def _calculate_rubric_scores(
        self,
        static_result: StaticAnalysisResult,
        llm_review: Dict,
        rubric: Dict
    ) -> Dict[str, float]:
        """Calculate scores based on rubric"""
        scores = {}
        
        # Use LLM scores as primary
        scores["correctness"] = llm_review.get("correctness", 50)
        scores["efficiency"] = llm_review.get("efficiency", 50)
        scores["code_quality"] = llm_review.get("code_quality", 50)
        scores["edge_cases"] = llm_review.get("edge_cases", 50)
        
        # Adjust based on static analysis
        if not static_result.syntax_valid:
            scores["correctness"] = min(scores["correctness"], 20)
        
        if static_result.cyclomatic_complexity > 15:
            scores["code_quality"] = max(0, scores["code_quality"] - 10)
        
        if len(static_result.style_issues) > 5:
            scores["code_quality"] = max(0, scores["code_quality"] - 5)
        
        # Bonus for good patterns
        good_patterns = ["dynamic programming", "binary search", "two pointers"]
        for pattern in static_result.detected_patterns:
            if pattern in good_patterns:
                scores["efficiency"] = min(100, scores["efficiency"] + 5)
        
        return scores
    
    def _calculate_combined_score(self, rubric_scores: Dict, rubric: Dict) -> float:
        """Calculate weighted combined score"""
        if not rubric:
            # Default weights
            rubric = {
                "correctness": {"weight": 0.40},
                "efficiency": {"weight": 0.25},
                "code_quality": {"weight": 0.20},
                "edge_cases": {"weight": 0.15}
            }
        
        combined = 0
        for key, score in rubric_scores.items():
            weight = rubric.get(key, {}).get("weight", 0.25)
            combined += score * weight
        
        return round(combined, 1)
    
    def _check_activity_flags(self, activity_data: Dict) -> List[str]:
        """Check activity data for suspicious behavior"""
        flags = []
        
        if activity_data.get("paste_events"):
            total_pasted = sum(e.get("chars_added", 0) for e in activity_data["paste_events"])
            if total_pasted > 500:
                flags.append("large_paste_detected")
        
        if activity_data.get("focus_changes"):
            focus_lost_count = sum(1 for f in activity_data["focus_changes"] if not f.get("focused"))
            if focus_lost_count > 5:
                flags.append("frequent_focus_loss")
        
        if activity_data.get("typing_metrics"):
            metrics = activity_data["typing_metrics"]
            paste_ratio = metrics.get("paste_ratio", 0)
            if paste_ratio > 0.7:
                flags.append("high_paste_ratio")
        
        return flags
    
    def _create_admin_review_record(
        self,
        submission: CodeSubmission,
        combined_score: float,
        activity_flags: List[str]
    ) -> Dict:
        """Create admin review record"""
        needs_review = (
            combined_score < 40 or
            combined_score > 90 or
            len(activity_flags) > 0
        )
        
        return {
            "status": "pending" if needs_review else "auto_approved",
            "reason": self._get_review_reason(combined_score, activity_flags),
            "reviewer": None,
            "notes": "",
            "score_override": None,
            "reviewed_at": None
        }
    
    def _get_review_reason(self, score: float, flags: List[str]) -> str:
        """Get reason for requiring admin review"""
        reasons = []
        
        if score < 40:
            reasons.append("Low score")
        if score > 90:
            reasons.append("Exceptional performance")
        if "large_paste_detected" in flags:
            reasons.append("Potential external code")
        if "high_paste_ratio" in flags:
            reasons.append("High paste ratio")
        if "frequent_focus_loss" in flags:
            reasons.append("Frequent tab switching")
        
        return "; ".join(reasons) if reasons else "No review required"


def evaluate_code_submission(
    code: str,
    question: Dict,
    language: str = "python",
    submission_id: str = None,
    activity_data: Dict = None,
    gemini_client=None
) -> Dict:
    """
    Convenience function to evaluate a code submission.
    
    Args:
        code: The submitted code
        question: Question with test cases and rubric
        language: Programming language
        submission_id: Optional submission ID
        activity_data: Activity tracking data
        gemini_client: Optional Gemini client for LLM review
    
    Returns:
        Evaluation result as dictionary
    """
    from datetime import datetime
    import uuid
    
    submission = CodeSubmission(
        submission_id=submission_id or str(uuid.uuid4())[:8],
        question_id=question.get("id", "unknown"),
        candidate_code=code,
        language=language
    )
    
    evaluator = CodeEvaluator(gemini_client)
    result = evaluator.evaluate(submission, question, activity_data)
    
    # Convert to dictionary
    return {
        "submission_id": result.submission_id,
        "question_id": result.question_id,
        "static_analysis": {
            "lines_of_code": result.static_analysis.lines_of_code,
            "cyclomatic_complexity": result.static_analysis.cyclomatic_complexity,
            "functions_count": result.static_analysis.functions_count,
            "classes_count": result.static_analysis.classes_count,
            "style_issues": result.static_analysis.style_issues,
            "detected_patterns": result.static_analysis.detected_patterns,
            "syntax_valid": result.static_analysis.syntax_valid
        },
        "llm_review": result.llm_review,
        "rubric_scores": result.rubric_scores,
        "combined_score": result.combined_score,
        "admin_review": result.admin_review,
        "activity_flags": result.activity_flags
    }


