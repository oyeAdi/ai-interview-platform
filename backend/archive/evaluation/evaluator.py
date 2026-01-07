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
        print(f"\n[EVALUATOR] Starting evaluation")
        print(f"[EVALUATOR] Question: {question.get('text', '')[:100]}...")
        print(f"[EVALUATOR] Response: {response[:200]}...")
        
        question_type = question.get("type", "open_ended")
        scorer_class = self.scorers.get(question_type, OpenEndedScoring)
        
        # Get deterministic scores
        scores = scorer_class.score(question, response)
        print(f"[EVALUATOR] Deterministic scores: {scores}")
        
        # Build evaluation details
        evaluation_details = self._build_evaluation_details(question, response, scores)
        
        # Get LLM evaluation (async-friendly, non-blocking)
        llm_evaluation = self._get_llm_evaluation(question, response, scores)
        print(f"[EVALUATOR] LLM evaluation result: {llm_evaluation}")
        
        # Calculate final score with weights (30% Deterministic, 70% LLM)
        deterministic_score = scores.get("overall_score", 0)
        llm_score = 0
        
        if llm_evaluation and not llm_evaluation.get("is_fallback", False):
            llm_score = llm_evaluation.get("score", 0)
            
            # --- Adaptive Weighting Strategy ---
            # Instead of hard-clamping, we adjust trust based on the discrepancy.
            # If Deterministic is much higher than LLM, it suggests keyword stuffing or superficial matching.
            # As the gap widens, we exponentially trust the LLM more.
            
            diff = deterministic_score - llm_score
            
            # Default weights (Standard Trust)
            weight_llm = 0.70
            weight_det = 0.30
            
            if diff > 45: 
                # Massive Discrepancy (e.g., Det=90, LLM=20)
                # Almost completely discard keyworder.
                print(f"[Scoring] Huge gap ({diff}), trusting LLM almost exclusively.")
                weight_llm = 0.95
                weight_det = 0.05
            elif diff > 20:
                # Moderate Discrepancy (e.g., Det=80, LLM=50)
                # shift balance heavily to LLM.
                print(f"[Scoring] Moderate gap ({diff}), reducing Deterministic weight.")
                weight_llm = 0.85
                weight_det = 0.15
            
            final_score = (deterministic_score * weight_det) + (llm_score * weight_llm)
            print(f"[EVALUATOR] Final score: {final_score:.1f} (Det: {deterministic_score} x {weight_det}, LLM: {llm_score} x {weight_llm})")
        else:
            final_score = deterministic_score
            print(f"[EVALUATOR] Using deterministic score only: {final_score}")

        return {
            "deterministic_scores": {
                "factual_correctness": scores.get("factual_correctness", 0),
                "completeness": scores.get("completeness", 0),
                "technical_accuracy": scores.get("technical_accuracy", 0),
                "depth": scores.get("depth", 0),
                "clarity": scores.get("clarity", 0),
                "keyword_coverage": scores.get("keyword_coverage", 0)
            },
            "overall_score": round(final_score, 1),
            "evaluation_details": evaluation_details,
            "llm_evaluation": llm_evaluation
        }
    
    def _get_llm_evaluation(self, question: Dict, response: str, scores: Dict) -> Optional[Dict]:
        """Get LLM-based qualitative evaluation with dual framework"""
        client = self._get_llm_client()
        if not client:
            return None
        
        try:
            # Detect question type
            question_type = question.get('type', 'open_ended')
            is_coding = question_type in ['coding', 'code_review'] or question.get('category') == 'coding'
            
            # Create evaluation prompt based on question type
            if is_coding:
                # CODING QUESTION FRAMEWORK
                prompt = f"""Evaluate this CODING interview response. Focus on TECHNICAL COMPETENCE.
BE OBJECTIVE. Do not inflate scores, but recognize valid partial solutions.

Question: {question.get('text', '')[:300]}
Response: {response[:500]}
Deterministic Scores: {scores}

EVALUATION CRITERIA (Total: 100%):
1. CODING ABILITY (40%) - Code quality, correctness, efficiency, clean practices, edge cases
2. TECHNICAL DEPTH (30%) - Understanding of concepts, trade-offs, complexity awareness
3. PROBLEM-SOLVING (20%) - Approach, logical reasoning, optimization thinking
4. EXPLANATION QUALITY (5%) - Code explanation clarity
5. PROFESSIONALISM (5%) - Basic courtesy ONLY

IMPORTANT:
- Prioritize code quality and technical correctness over communication style
- Focus on: practical coding skills, algorithm efficiency, clean code
- Ignore: tone, pleasantries, conversational awareness

Provide JSON response:
- score: 0-100
- reasoning: Focus on TECHNICAL assessment (one sentence)
- strengths: 1-2 TECHNICAL strengths (short phrases)
- improvements: 1-2 TECHNICAL improvements (short phrases)

Reply with ONLY valid JSON, no markdown."""
            elif question.get('category') == 'behavioral' or question.get('type') == 'behavioral':
                # BEHAVIORAL QUESTION FRAMEWORK
                prompt = f"""Evaluate this BEHAVIORAL/SOFT-SKILL interview response. Focus on COMMUNICATION & SITUATIONAL JUDGMENT.
BE FAIR. Look for the STAR method (Situation, Task, Action, Result) or clear structured thinking.

Question: {question.get('text', '')[:300]}
Response: {response[:500]}
Deterministic Scores: {scores}

EVALUATION CRITERIA (Total: 100%):
1. COMMUNICATION CLARITY (35%) - Structure, conciseness, articulation
2. STAR METHOD / STRUCTURE (25%) - Clear progression of thought/story
3. RELEVANCE (20%) - Directly addressing the questionasked
4. REFLECTION/IMPACT (15%) - Lesson learned or result achieved
5. PROFESSIONALISM (5%) - Tone and maturity

IMPORTANT:
- Value specific examples and clear storytelling
- Penalize vague or evasive answers
- Focus on: soft skills, leadership, collaboration, conflict resolution

Provide JSON response:
- score: 0-100
- reasoning: Focus on BEHAVIORAL assessment (one sentence)
- strengths: 1-2 strengths (short phrases)
- improvements: 1-2 improvements (short phrases)

Reply with ONLY valid JSON, no markdown."""
            else:
                # NON-CODING TECHNICAL FRAMEWORK
                prompt = f"""Evaluate this TECHNICAL CONCEPTUAL interview response. Focus on KNOWLEDGE DEPTH.
BE BALANCED. Reward deep understanding but accept standard correct answers.

Question: {question.get('text', '')[:300]}
Response: {response[:500]}
Deterministic Scores: {scores}

EVALUATION CRITERIA (Total: 100%):
1. TECHNICAL ACCURACY (40%) - Correctness of facts and concepts
2. EXPLANATION QUALITY (25%) - Clarity, analogies, ability to teach/explain
3. PROBLEM-SOLVING (20%) - Application of knowledge
4. PRACTICAL CONTEXT (10%) - Real-world usage mention
5. PROFESSIONALISM (5%) - Confidence and tone

IMPORTANT:
- Prioritize accuracy and clarity
- Do NOT require "textbook perfect" definitions if the concept is understood
- Focus on: conceptual grip, ability to explain simply

Provide JSON response:
- score: 0-100
- reasoning: Focus on TECHNICAL assessment (one sentence)
- strengths: 1-2 TECHNICAL strengths (short phrases)
- improvements: 1-2 TECHNICAL improvements (short phrases)

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
                
                llm_score = result.get("score", scores.get("overall_score", 0))
                
                # Apply multiplier (optional) - Removed to prevent score inflation
                if is_coding:
                    # llm_score = min(100, llm_score * 1.0) 
                    pass
                
                return {
                    "score": llm_score,
                    "reasoning": result.get("reasoning", ""),
                    "strengths": result.get("strengths", []),
                    "improvements": result.get("improvements", []),
                    "is_coding": is_coding,
                    "multiplier_applied": 1.0
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

