"""Gemini API client for LLM operations"""
import google.generativeai as genai
from typing import Dict, Optional
from backend.config import Config

class GeminiClient:
    """Client for interacting with Google Gemini API"""
    
    def __init__(self):
        Config.validate()
        genai.configure(api_key=Config.GEMINI_API_KEY)
        # Model selection order - try models with separate quotas
        # gemma-3-27b-it often has more available quota than gemini models
        models_to_try = [
            'gemma-3-27b-it',          # Usually has more quota available
            'gemini-2.5-flash-lite',   # Fast, no thinking tokens
            'gemini-flash-latest',     # Stable fallback
        ]
        
        self.model = None
        for model_name in models_to_try:
            try:
                self.model = genai.GenerativeModel(model_name)
                print(f"GeminiClient initialized with model: {model_name}")
                break
            except Exception as e:
                print(f"Failed to initialize {model_name}: {e}")
        
        if not self.model:
            raise ValueError("Could not initialize any Gemini model")
    
    def analyze_language(self, jd_text: str, resume_text: str) -> Dict:
        """
        Analyze JD and Resume to determine required language (Java/Python)
        Returns: { "language": "python" | "java", "confidence": float }
        """
        prompt = f"""Analyze the following job description and resume to determine which programming language is primarily required for this role.

Job Description:
{jd_text}

Resume:
{resume_text}

Based on the job requirements and the candidate's experience, determine if this role requires primarily Java or Python skills.

Respond with ONLY one word: either "Java" or "Python".
"""
        
        try:
            response = self.model.generate_content(prompt)
            language = response.text.strip().lower()
            
            # Normalize response
            if "java" in language:
                return {"language": "java", "confidence": 0.95}
            elif "python" in language:
                return {"language": "python", "confidence": 0.95}
            else:
                # Fallback: keyword counting
                jd_lower = jd_text.lower()
                resume_lower = resume_text.lower()
                java_count = jd_lower.count("java") + resume_lower.count("java")
                python_count = jd_lower.count("python") + resume_lower.count("python")
                
                if java_count > python_count:
                    return {"language": "java", "confidence": 0.7}
                else:
                    return {"language": "python", "confidence": 0.7}
        except Exception as e:
            # Fallback on error
            jd_lower = jd_text.lower()
            resume_lower = resume_text.lower()
            java_count = jd_lower.count("java") + resume_lower.count("java")
            python_count = jd_lower.count("python") + resume_lower.count("python")
            
            if java_count > python_count:
                return {"language": "java", "confidence": 0.6}
            else:
                return {"language": "python", "confidence": 0.6}
    
    def generate_followup(
        self,
        question: Dict,
        response: str,
        evaluation: Dict,
        strategy_guidance: Dict,
        context: Dict
    ) -> str:
        """Generate natural follow-up question using LLM with expert-learned examples"""
        from backend.utils.logger import Logger
        
        # Extract strategy guidance text (the actual instruction, not the meta description)
        strategy_instruction = strategy_guidance.get("strategy_guidance", "")
        reason = strategy_guidance.get("reason", "")
        focus_areas = strategy_guidance.get("focus_areas", [])
        approach = strategy_guidance.get("approach", "")
        strategy_id = strategy_guidance.get("strategy_id", "")
        
        # Extract key information from strategy guidance without the instructional text
        strategy_intent = strategy_instruction
        # Remove common instructional phrases
        strategy_intent = strategy_intent.replace("Ask about", "").replace("Ask for", "").replace("Explore", "").replace("Assess", "")
        strategy_intent = strategy_intent.replace("Ask specifically about", "").replace("Request", "").replace("Focus on", "")
        strategy_intent = strategy_intent.strip()
        
        # === EVOLUTIONARY LEARNING: Get expert-approved examples ===
        expert_examples_section = ""
        try:
            logger = Logger()
            # Get examples for this strategy first, then general examples
            examples = logger.get_successful_examples(strategy_id=strategy_id, limit=2)
            if not examples:
                examples = logger.get_successful_examples(limit=2)
            
            if examples:
                expert_examples_section = "\n\nExpert-Approved Examples (learn from these):\n"
                for i, ex in enumerate(examples, 1):
                    if ex.get("expert_improvement"):
                        expert_examples_section += f'{i}. "{ex["expert_improvement"]}"\n'
                        if ex.get("ai_suggestion") and ex["ai_suggestion"] != ex["expert_improvement"]:
                            expert_examples_section += f'   (Improved from: "{ex["ai_suggestion"][:50]}...")\n'
        except Exception as e:
            print(f"Could not load expert examples: {e}")
            expert_examples_section = ""
        
        # Build a concise prompt with expert examples for few-shot learning
        prompt = f"""Generate a natural follow-up question for a technical interview.

Question: {question.get("text", "")[:200]}
Response: {response[:300]}
Score: {evaluation.get("overall_score", 0)}/100

Focus: {strategy_intent[:150]}

Rules:
- Generate ONLY a natural question (like a real interviewer)
- DO NOT include "Ask about", "Explore", or meta-instructions
- Be specific and reference what the candidate said
{expert_examples_section}
Default Examples (if no expert examples above):
- "Can you walk me through a specific example where you've used this?"
- "What would happen if you modified the dictionary while iterating?"
- "How does this compare to using list comprehensions?"

Generate ONLY the question text, nothing else.
"""
        
        try:
            response_obj = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.8,  # Slightly higher for more natural questions
                    max_output_tokens=2048,  # Increased to 2048 to account for thinking tokens (per Google Cloud docs)
                    top_p=0.95
                )
            )
            
            # Extract text from response
            # The error message says: "Use the result.parts accessor or the full result.candidates[index].content.parts lookup"
            # response.parts is empty, so we MUST use candidates[0].content.parts
            followup_text = None
            
            # Method 1: Use candidates[0].content.parts (this is what actually works)
            try:
                if hasattr(response_obj, 'candidates') and response_obj.candidates:
                    candidate = response_obj.candidates[0]
                    
                    # Check finish reason first - if MAX_TOKENS or other issues, response might be incomplete
                    finish_reason = None
                    if hasattr(candidate, 'finish_reason'):
                        finish_reason = candidate.finish_reason
                        # finish_reason: STOP=1, MAX_TOKENS=2, SAFETY=3, RECITATION=4
                        if finish_reason == 2:  # MAX_TOKENS
                            print(f"WARNING: Response truncated (MAX_TOKENS). This shouldn't happen with max_output_tokens=1024.")
                    
                    if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                        parts = candidate.content.parts
                        
                        # If finish_reason is MAX_TOKENS and parts is empty, response was truncated
                        if finish_reason == 2 and (not parts or len(parts) == 0):
                            print(f"ERROR: Response truncated (MAX_TOKENS) and parts is empty. Using fallback.")
                            raise ValueError("Response truncated and incomplete - empty parts")
                        
                        # If parts is empty regardless of finish_reason, something went wrong
                        if not parts or len(parts) == 0:
                            print(f"ERROR: Parts array is empty. Finish reason: {finish_reason}. Using fallback.")
                            raise ValueError("Response has empty parts array")
                        
                        text_parts = []
                        for part in parts:
                            if hasattr(part, 'text') and part.text:
                                text_parts.append(part.text)
                        if text_parts:
                            followup_text = ''.join(text_parts).strip()
                            # If finish_reason was MAX_TOKENS, log it but still use the text if it's reasonable
                            if finish_reason == 2:
                                print(f"WARNING: Response was truncated (MAX_TOKENS) but has text: '{followup_text[:50]}...'")
                                # Still use it if it's long enough to be useful
                                if len(followup_text) < 20:
                                    raise ValueError("Response truncated and too short to be useful")
            except Exception as e1:
                # Method 2: Try response.parts (usually empty, but try anyway)
                try:
                    if hasattr(response_obj, 'parts') and response_obj.parts:
                        text_parts = []
                        for part in response_obj.parts:
                            if hasattr(part, 'text') and part.text:
                                text_parts.append(part.text)
                        if text_parts:
                            followup_text = ''.join(text_parts).strip()
                except Exception as e2:
                    # Method 3: Try direct text accessor (for simple responses - will fail but try)
                    try:
                        followup_text = response_obj.text.strip()
                    except Exception as e3:
                        # All methods failed
                        print(f"Error extracting text: candidates={type(e1).__name__}: {e1}, parts={type(e2).__name__}: {e2}, text={type(e3).__name__}: {e3}")
                        raise ValueError(f"Could not extract text from response")
            
            # Validate extracted text
            if not followup_text:
                raise ValueError("Generated question too short or empty")
            
            if len(followup_text) < 10:
                raise ValueError(f"Generated question too short: '{followup_text}' (length: {len(followup_text)})")
            
            # Clean up the response - remove any quotes, prefixes, etc.
            followup_text = followup_text.strip('"\'')
            if followup_text.startswith("Follow-up:"):
                followup_text = followup_text.replace("Follow-up:", "").strip()
            if followup_text.startswith("Question:"):
                followup_text = followup_text.replace("Question:", "").strip()
            
            # Validate it's actually a question
            if not followup_text.endswith('?') and len(followup_text) > 20:
                # If it's long enough but missing question mark, it might still be valid
                pass
            elif len(followup_text) < 10:
                # Too short, use fallback
                raise ValueError("Generated question too short")
            
            return followup_text
        except Exception as e:
            print(f"Error generating follow-up with LLM: {e}")
            import traceback
            traceback.print_exc()
            # Better fallback - create a natural question from strategy guidance
            focus_text = ', '.join(focus_areas) if focus_areas else "this topic"
            
            # Create natural fallback based on strategy
            if "edge case" in strategy_instruction.lower() or "advanced" in strategy_instruction.lower():
                return "Can you provide an example of an edge case or advanced scenario where this might be challenging?"
            elif "related topics" in strategy_instruction.lower() or "broader" in strategy_instruction.lower():
                return "How does this concept relate to other Python features you've worked with?"
            elif "deeper" in strategy_instruction.lower() or "depth" in strategy_instruction.lower():
                return "Can you explain this in more detail with a practical example?"
            else:
                return "Can you elaborate on that with a specific example?"
    
    def generate_transition(self, context: Dict) -> str:
        """Generate natural transition message between questions"""
        summaries = context.get("interview_context", {}).get("round_summaries", [])
        if not summaries:
            return "Let me ask you another question."
        
        last_summary = summaries[-1]
        topic = last_summary.get("topic", "")
        score = last_summary.get("final_score", 0)
        
        prompt = f"""Generate a brief, natural transition message for moving to the next interview question.

Previous topic: {topic}
Previous performance: Score of {score}

Generate a 1-2 sentence transition that:
- Acknowledges the previous response appropriately
- Naturally introduces the next question
- Maintains a professional, conversational tone

Respond with ONLY the transition message, nothing else.
"""
        
        try:
            response = self.model.generate_content(prompt)
            # Handle different response formats
            if hasattr(response, 'text'):
                return response.text.strip()
            elif hasattr(response, 'parts') and response.parts:
                return ''.join([part.text for part in response.parts if hasattr(part, 'text')]).strip()
            elif hasattr(response, 'candidates') and response.candidates:
                return ''.join([part.text for part in response.candidates[0].content.parts if hasattr(part, 'text')]).strip()
            else:
                return "Great! Let me ask you another question."
        except Exception as e:
            return "Great! Let me ask you another question."
    
    def generate_interview_narrative(self, log_data: Dict) -> str:
        """
        Generate a narrative summary of the interview progress based on log data.
        This tells the story of how the interview has progressed so far.
        """
        import json
        
        # Extract key information from log - handle both field naming conventions
        language = (log_data.get("detected_language") or log_data.get("language") or "").upper()
        questions = log_data.get("questions") or log_data.get("rounds") or []
        session_id = log_data.get("session_id", "")
        
        if not questions:
            return f"The {language} technical interview has just begun. Waiting for the first question to be asked..."
        
        # Check if there are any responses
        has_responses = False
        for q in questions:
            if q.get("responses") and len(q.get("responses", [])) > 0:
                has_responses = True
                break
        
        if not has_responses:
            return f"The {language} interview is underway. Question has been asked, awaiting the candidate's first response..."
        
        # Build a summary for the LLM
        interview_summary = []
        for i, question_data in enumerate(questions):
            question_id = question_data.get("question_id", f"Question {i+1}")
            round_number = question_data.get("round_number", i + 1)
            responses = question_data.get("responses", [])
            
            question_summary = {
                "question_number": round_number,
                "question_id": question_id,
                "responses": []
            }
            
            for resp in responses:
                # Handle the actual field names from logger
                resp_summary = {
                    "type": resp.get("response_type", "initial"),
                    "answer_preview": (resp.get("candidate_response") or resp.get("response_text") or "")[:80],
                    "score": resp.get("evaluation", {}).get("overall_score", 0),
                    "strategy_used": resp.get("strategy_used", {}).get("strategy_name") or resp.get("strategy_used", {}).get("name", "")
                }
                question_summary["responses"].append(resp_summary)
            
            interview_summary.append(question_summary)
        
        prompt = f"""You are an interview observer. Based on the following interview log data, write a brief narrative (3-5 sentences) that tells the story of how this {language} technical interview has progressed.

Interview Data:
{json.dumps(interview_summary, indent=2)}

Guidelines:
- Write in third person (e.g., "The candidate...", "The interviewer...")
- Mention specific topics covered
- Comment on the candidate's performance trend (improving, consistent, struggling)
- Note any interesting patterns (e.g., strong on theory but weak on examples)
- Keep it professional but engaging
- Be concise - maximum 4-5 sentences

Write ONLY the narrative paragraph, nothing else:"""

        try:
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=300,
                    temperature=0.7
                )
            )
            
            # Extract text from response
            narrative = None
            if hasattr(response, 'candidates') and response.candidates:
                candidate = response.candidates[0]
                if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                    parts = candidate.content.parts
                    if parts:
                        narrative = ''.join([part.text for part in parts if hasattr(part, 'text')]).strip()
            
            if not narrative and hasattr(response, 'text'):
                narrative = response.text.strip()
            
            if narrative and len(narrative) > 20:
                return narrative
            else:
                raise ValueError("Empty or too short response")
                
        except Exception as e:
            print(f"Narrative generation error: {e}")
            # Return a structured fallback
            return self._generate_fallback_narrative(language, interview_summary)
    
    def _generate_fallback_narrative(self, language: str, interview_summary: list) -> str:
        """Generate a basic narrative without LLM"""
        total_score = 0
        response_count = 0
        question_ids = []
        strategies_used = set()
        
        for question_data in interview_summary:
            question_ids.append(question_data.get("question_id", ""))
            for resp in question_data.get("responses", []):
                if resp.get("score"):
                    total_score += resp["score"]
                    response_count += 1
                if resp.get("strategy_used"):
                    strategies_used.add(resp["strategy_used"])
        
        avg_score = total_score / response_count if response_count > 0 else 0
        
        # Build narrative
        parts = []
        parts.append(f"The {language} technical interview has covered {len(interview_summary)} question(s) with {response_count} response(s) evaluated.")
        
        if response_count > 0:
            if avg_score >= 75:
                parts.append(f" The candidate is performing excellently with an average score of {avg_score:.0f}%.")
            elif avg_score >= 55:
                parts.append(f" The candidate demonstrates solid understanding, averaging {avg_score:.0f}%.")
            elif avg_score >= 35:
                parts.append(f" The candidate shows basic knowledge but could elaborate more, scoring {avg_score:.0f}% on average.")
            else:
                parts.append(f" The candidate is finding the questions challenging, averaging {avg_score:.0f}%.")
        
        if strategies_used:
            strategies_list = list(strategies_used)[:2]
            parts.append(f" The interviewer has applied {' and '.join(strategies_list)} strategies.")
        
        return "".join(parts)

