"""Deterministic evaluation engine with optional LLM assessment"""
from typing import Dict, Optional
from evaluation.scoring_algorithms import (
    TrueFalseScoring,
    MultipleChoiceScoring,
    OpenEndedScoring
)

class Evaluator:
    """Deterministic evaluator for candidate responses with LLM support"""
    
    def __init__(self):
        self.scorers = {
            "true_false_with_explanation": TrueFalseScoring,
            "yes_no_with_explanation": TrueFalseScoring,
            "multiple_choice_with_explanation": MultipleChoiceScoring,
            "open_ended": OpenEndedScoring
        }
        self._llm_client = None
    
    def _get_llm_client(self):
        """Lazy load LLM client"""
        if self._llm_client is None:
            try:
                from llm.gemini_client import GeminiClient
                self._llm_client = GeminiClient()
            except Exception as e:
                print(f"Could not initialize LLM client for evaluation: {e}")
        return self._llm_client
    
    def evaluate(self, question: Dict, response: str) -> Dict:
        """
        Evaluate candidate response deterministically
        Returns detailed evaluation with scores
        """
        question_type = question.get("type", "open_ended")
        scorer_class = self.scorers.get(question_type, OpenEndedScoring)
        
        # Get deterministic scores
        scores = scorer_class.score(question, response)
        
        # Build evaluation details
        evaluation_details = self._build_evaluation_details(question, response, scores)
        
        # Get LLM evaluation (async-friendly, non-blocking)
        llm_evaluation = self._get_llm_evaluation(question, response, scores)
        
        return {
            "deterministic_scores": {
                "factual_correctness": scores.get("factual_correctness", 0),
                "completeness": scores.get("completeness", 0),
                "technical_accuracy": scores.get("technical_accuracy", 0),
                "depth": scores.get("depth", 0),
                "clarity": scores.get("clarity", 0),
                "keyword_coverage": scores.get("keyword_coverage", 0)
            },
            "overall_score": scores.get("overall_score", 0),
            "evaluation_details": evaluation_details,
            "llm_evaluation": llm_evaluation
        }
    
    def _get_llm_evaluation(self, question: Dict, response: str, scores: Dict) -> Optional[Dict]:
        """Get LLM-based qualitative evaluation"""
        client = self._get_llm_client()
        if not client:
            return None
        
        try:
            # Create a simple prompt for LLM evaluation
            prompt = f"""Evaluate this interview response briefly.

Question: {question.get('text', '')[:200]}
Response: {response[:300]}
Deterministic Score: {scores.get('overall_score', 0)}/100

Provide a JSON response with:
- score: your assessment (0-100)
- reasoning: one sentence explaining the score
- strengths: list of 1-2 strengths (short phrases)
- improvements: list of 1-2 areas to improve (short phrases)

Reply with ONLY valid JSON, no markdown."""

            import google.generativeai as genai
            response_obj = client.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.3,
                    max_output_tokens=256
                )
            )
            
            # Extract text from response
            text = None
            if hasattr(response_obj, 'candidates') and response_obj.candidates:
                candidate = response_obj.candidates[0]
                if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                    parts = candidate.content.parts
                    if parts:
                        text = ''.join([p.text for p in parts if hasattr(p, 'text')]).strip()
            
            if text:
                # Parse JSON response
                import json
                # Clean up potential markdown formatting
                text = text.replace('```json', '').replace('```', '').strip()
                result = json.loads(text)
                return {
                    "score": result.get("score", scores.get("overall_score", 0)),
                    "reasoning": result.get("reasoning", ""),
                    "strengths": result.get("strengths", []),
                    "improvements": result.get("improvements", [])
                }
        except Exception as e:
            print(f"LLM evaluation failed: {e}")
        
        # Fallback: generate basic evaluation from deterministic scores
        # Mark it as fallback so UI can show this is not real LLM evaluation
        overall = scores.get("overall_score", 0)
        return {
            "score": overall,
            "reasoning": self._generate_basic_reasoning(scores),
            "strengths": self._identify_strengths(scores),
            "improvements": self._identify_improvements(scores),
            "is_fallback": True  # Flag to indicate LLM was not used
        }
    
    def _generate_basic_reasoning(self, scores: Dict) -> str:
        """Generate basic reasoning from scores"""
        overall = scores.get("overall_score", 0)
        if overall >= 90:
            return "Excellent response demonstrating comprehensive understanding"
        elif overall >= 70:
            return "Good response with solid understanding of the concept"
        elif overall >= 50:
            return "Adequate response but could benefit from more depth"
        else:
            return "Response needs improvement in key areas"
    
    def _identify_strengths(self, scores: Dict) -> list:
        """Identify strengths from scores"""
        strengths = []
        if scores.get("factual_correctness", 0) >= 80:
            strengths.append("Accurate information")
        if scores.get("depth", 0) >= 70:
            strengths.append("Good depth of explanation")
        if scores.get("keyword_coverage", 0) >= 70:
            strengths.append("Covers key concepts")
        if scores.get("clarity", 0) >= 70:
            strengths.append("Clear communication")
        return strengths[:2] if strengths else ["Shows basic understanding"]
    
    def _identify_improvements(self, scores: Dict) -> list:
        """Identify areas for improvement from scores"""
        improvements = []
        if scores.get("factual_correctness", 0) < 60:
            improvements.append("Verify accuracy of statements")
        if scores.get("depth", 0) < 50:
            improvements.append("Provide more detailed explanations")
        if scores.get("keyword_coverage", 0) < 50:
            improvements.append("Include more technical terminology")
        if scores.get("completeness", 0) < 60:
            improvements.append("Address all aspects of the question")
        return improvements[:2] if improvements else ["Continue with current approach"]
    
    def _build_evaluation_details(self, question: Dict, response: str, scores: Dict) -> Dict:
        """Build detailed evaluation information"""
        details = {}
        
        question_type = question.get("type", "")
        
        if "true_false" in question_type or "yes_no" in question_type:
            details["factual_check"] = "PASS" if scores.get("factual_correctness", 0) == 100 else "FAIL"
            details["extracted_answer"] = scores.get("extracted_answer")
            details["correct_answer"] = scores.get("correct_answer")
        
        if "multiple_choice" in question_type:
            details["selected_options"] = scores.get("selected_options", [])
            details["correct_options"] = scores.get("correct_options", [])
            details["option_accuracy"] = scores.get("factual_correctness", 0)
        
        # Common details
        expected_keywords = question.get("expected_keywords", [])
        if expected_keywords:
            response_lower = response.lower()
            matched = [kw for kw in expected_keywords if kw.lower() in response_lower]
            missing = [kw for kw in expected_keywords if kw.lower() not in response_lower]
            details["keywords_matched"] = matched
            details["keywords_missing"] = missing
        
        details["explanation_length"] = len(response)
        details["has_examples"] = bool(
            __import__("re").search(r'(example|instance|case|demonstrate)', response, __import__("re").IGNORECASE)
        )
        
        return details

