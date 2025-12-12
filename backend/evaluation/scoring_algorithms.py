"""Scoring algorithm implementations"""
import re
from typing import Dict, List, Tuple, Optional

class ScoringAlgorithm:
    """Base scoring algorithm"""
    
    @staticmethod
    def extract_boolean_answer(text: str) -> Optional[bool]:
        """Extract True/False or Yes/No from text"""
        text_lower = text.lower().strip()
        
        # Check for True/False
        if re.search(r'\b(true|false)\b', text_lower):
            match = re.search(r'\b(true|false)\b', text_lower)
            return match.group(1) == "true"
        
        # Check for Yes/No
        if re.search(r'\b(yes|no)\b', text_lower):
            match = re.search(r'\b(yes|no)\b', text_lower)
            return match.group(1) == "yes"
        
        return None
    
    @staticmethod
    def extract_multiple_choice(text: str) -> List[str]:
        """Extract multiple choice selections (A, B, C, D)"""
        matches = re.findall(r'\b([A-D])\b', text.upper())
        return list(set(matches))  # Remove duplicates
    
    @staticmethod
    def calculate_keyword_coverage(text: str, expected_keywords: List[str]) -> float:
        """Calculate keyword coverage percentage"""
        if not expected_keywords:
            return 100.0
        
        text_lower = text.lower()
        matched = sum(1 for keyword in expected_keywords if keyword.lower() in text_lower)
        return (matched / len(expected_keywords)) * 100
    
    @staticmethod
    def calculate_explanation_metrics(text: str, question: Dict) -> Dict[str, float]:
        """Calculate explanation quality metrics"""
        # Remove the deterministic answer part for explanation analysis
        explanation = text
        
        # Remove True/False/Yes/No prefix
        explanation = re.sub(r'^\s*(true|false|yes|no)[\s:.,;]*', '', explanation, flags=re.IGNORECASE)
        
        # Remove multiple choice selections
        explanation = re.sub(r'\b[A-D]\b[\s:.,;]*', '', explanation)
        
        explanation = explanation.strip()
        length = len(explanation)
        
        # Completeness: based on length and keyword coverage
        expected_keywords = question.get("expected_keywords", [])
        keyword_coverage = ScoringAlgorithm.calculate_keyword_coverage(explanation, expected_keywords)
        length_score = min(100, (length / 200) * 100)  # 200 chars = 100%
        completeness = (keyword_coverage * 0.7 + length_score * 0.3)
        
        # Technical accuracy: simplified (would use LLM in production)
        # For now, assume based on keyword presence
        technical_accuracy = keyword_coverage * 0.9  # Slight penalty
        
        # Depth: based on length and examples
        has_examples = bool(re.search(r'(example|instance|case|demonstrate)', explanation, re.IGNORECASE))
        depth = min(100, (length / 300) * 100 + (20 if has_examples else 0))
        
        # Clarity: based on structure (sentence count, length variation)
        sentences = re.split(r'[.!?]+', explanation)
        sentence_count = len([s for s in sentences if s.strip()])
        clarity = min(100, (sentence_count / 5) * 100)  # 5 sentences = 100%
        
        return {
            "completeness": min(100, max(0, completeness)),
            "technical_accuracy": min(100, max(0, technical_accuracy)),
            "depth": min(100, max(0, depth)),
            "clarity": min(100, max(0, clarity))
        }

class TrueFalseScoring(ScoringAlgorithm):
    """Scoring for True/False with explanation questions"""
    
    @staticmethod
    def score(question: Dict, response: str) -> Dict:
        """Score True/False question"""
        rubric = question.get("evaluation_rubric", {})
        deterministic_answer = question.get("deterministic_answer", {})
        
        # Extract answer
        extracted = ScoringAlgorithm.extract_boolean_answer(response)
        correct_value = deterministic_answer.get("correct_value", True)
        
        # Factual correctness (binary)
        factual_correctness = 100 if extracted == correct_value else 0
        
        # Explanation metrics
        explanation_metrics = ScoringAlgorithm.calculate_explanation_metrics(response, question)
        
        # Apply weighted formula
        weights = {
            "factual_correctness": rubric.get("factual_correctness", {}).get("weight", 0.65),
            "completeness": rubric.get("completeness", {}).get("weight", 0.15),
            "technical_accuracy": rubric.get("technical_accuracy", {}).get("weight", 0.10),
            "depth": rubric.get("depth", {}).get("weight", 0.05),
            "clarity": rubric.get("clarity", {}).get("weight", 0.05)
        }
        
        overall_score = (
            factual_correctness * weights["factual_correctness"] +
            explanation_metrics["completeness"] * weights["completeness"] +
            explanation_metrics["technical_accuracy"] * weights["technical_accuracy"] +
            explanation_metrics["depth"] * weights["depth"] +
            explanation_metrics["clarity"] * weights["clarity"]
        )
        
        return {
            "factual_correctness": factual_correctness,
            "completeness": explanation_metrics["completeness"],
            "technical_accuracy": explanation_metrics["technical_accuracy"],
            "depth": explanation_metrics["depth"],
            "clarity": explanation_metrics["clarity"],
            "keyword_coverage": ScoringAlgorithm.calculate_keyword_coverage(
                response, 
                question.get("expected_keywords", [])
            ),
            "overall_score": round(overall_score, 2),
            "extracted_answer": extracted,
            "correct_answer": correct_value
        }

class MultipleChoiceScoring(ScoringAlgorithm):
    """Scoring for multiple choice with explanation questions"""
    
    @staticmethod
    def score(question: Dict, response: str) -> Dict:
        """Score multiple choice question"""
        rubric = question.get("evaluation_rubric", {})
        deterministic_answer = question.get("deterministic_answer", {})
        
        # Extract selected options
        selected = ScoringAlgorithm.extract_multiple_choice(response)
        correct_options = set(deterministic_answer.get("correct_options", []))
        selected_set = set(selected)
        
        # Calculate option score
        correct_selected = len(selected_set & correct_options)
        incorrect_selected = len(selected_set - correct_options)
        total_correct = len(correct_options)
        
        if total_correct > 0:
            option_score = max(0, ((correct_selected - incorrect_selected) / total_correct) * 100)
        else:
            option_score = 0
        
        # Explanation metrics
        explanation_metrics = ScoringAlgorithm.calculate_explanation_metrics(response, question)
        
        # Apply weighted formula
        weights = {
            "factual_correctness": rubric.get("factual_correctness", {}).get("weight", 0.70),
            "completeness": rubric.get("completeness", {}).get("weight", 0.12),
            "technical_accuracy": rubric.get("technical_accuracy", {}).get("weight", 0.10),
            "depth": rubric.get("depth", {}).get("weight", 0.05),
            "clarity": rubric.get("clarity", {}).get("weight", 0.03)
        }
        
        overall_score = (
            option_score * weights["factual_correctness"] +
            explanation_metrics["completeness"] * weights["completeness"] +
            explanation_metrics["technical_accuracy"] * weights["technical_accuracy"] +
            explanation_metrics["depth"] * weights["depth"] +
            explanation_metrics["clarity"] * weights["clarity"]
        )
        
        return {
            "factual_correctness": option_score,
            "completeness": explanation_metrics["completeness"],
            "technical_accuracy": explanation_metrics["technical_accuracy"],
            "depth": explanation_metrics["depth"],
            "clarity": explanation_metrics["clarity"],
            "keyword_coverage": ScoringAlgorithm.calculate_keyword_coverage(
                response,
                question.get("expected_keywords", [])
            ),
            "overall_score": round(overall_score, 2),
            "selected_options": selected,
            "correct_options": list(correct_options)
        }

class OpenEndedScoring(ScoringAlgorithm):
    """Scoring for open-ended questions"""
    
    @staticmethod
    def score(question: Dict, response: str) -> Dict:
        """Score open-ended question"""
        rubric = question.get("evaluation_rubric", {})
        deterministic_answer = question.get("deterministic_answer", {})
        
        # Check required concepts
        required_concepts = deterministic_answer.get("required_concepts", [])
        concept_coverage = ScoringAlgorithm.calculate_keyword_coverage(response, required_concepts)
        
        # Explanation metrics
        explanation_metrics = ScoringAlgorithm.calculate_explanation_metrics(response, question)
        
        # Apply weighted formula (no factual correctness for open-ended)
        weights = {
            "completeness": rubric.get("completeness", {}).get("weight", 0.30),
            "technical_accuracy": rubric.get("technical_accuracy", {}).get("weight", 0.30),
            "depth": rubric.get("depth", {}).get("weight", 0.20),
            "clarity": rubric.get("clarity", {}).get("weight", 0.20)
        }
        
        overall_score = (
            explanation_metrics["completeness"] * weights["completeness"] +
            explanation_metrics["technical_accuracy"] * weights["technical_accuracy"] +
            explanation_metrics["depth"] * weights["depth"] +
            explanation_metrics["clarity"] * weights["clarity"]
        )
        
        return {
            "factual_correctness": concept_coverage,  # Use concept coverage as factual
            "completeness": explanation_metrics["completeness"],
            "technical_accuracy": explanation_metrics["technical_accuracy"],
            "depth": explanation_metrics["depth"],
            "clarity": explanation_metrics["clarity"],
            "keyword_coverage": ScoringAlgorithm.calculate_keyword_coverage(
                response,
                question.get("expected_keywords", [])
            ),
            "overall_score": round(overall_score, 2),
            "concept_coverage": concept_coverage
        }

