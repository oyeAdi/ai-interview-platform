"""Gemini API client for LLM operations"""
import json
import google.generativeai as genai
from typing import Dict, Optional, List
from config import Config

class GeminiClient:
    """Client for interacting with Google Gemini API"""
    
    def __init__(self, use_router: bool = True):
        """
        Initialize GeminiClient with optional LLM router
        
        Args:
            use_router: If True, use LLMRouter for intelligent model selection.
                       If False, use direct Gemini API (legacy mode)
        """
        Config.validate()
        genai.configure(api_key=Config.GEMINI_API_KEY)
        
        self.use_router = use_router
        
        if use_router:
            # Use LLM Router for intelligent model selection with fallback
            try:
                from llm.llm_router import get_llm_router
                self.model = get_llm_router()
                print(f"GeminiClient using LLMRouter: {self.model.get_active_model()}")
            except Exception as e:
                print(f"Failed to initialize LLMRouter, falling back to direct Gemini: {e}")
                self.use_router = False
        
        if not self.use_router:
            # Legacy mode: Direct Gemini API
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
        from utils.logger import Logger
        
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
        # TONE: Natural, friendly, professional with light sugar-coating
        prompt = f"""You are a friendly, professional technical interviewer conducting a conversational technical assessment.

Generate a natural follow-up question based on what the candidate just said.

Question: {question.get("text", "")[:200]}
Candidate's Response: {response[:400]}
Score: {evaluation.get("overall_score", 0)}/100

Focus area: {strategy_intent[:150]}

CRITICAL RULES for tone and naturalness:
1. Start with a brief, warm acknowledgment of what the candidate said (e.g., "That's a great point about...", "I see what you mean...", "Interesting approach!")
2. Use conversational, encouraging language - never cold or robotic
3. Reference something SPECIFIC from their answer to show you're listening
4. Naturally transition into probing deeper on a related point
5. Maintain a professional yet supportive tone

{expert_examples_section}
GOOD Examples (natural, conversational, references their answer):
- "That's a great point about using generators! I'm curious - how would you handle a scenario where the data doesn't fit in memory?"
- "I appreciate you walking through that. When you mentioned using a dictionary, what would happen if you needed to modify it while iterating?"
- "Interesting approach with the try-except block! What other edge cases might we need to consider there?"
- "I like how you structured that. Can you tell me more about how you'd test this in a production environment?"

BAD Examples (avoid these - too cold, generic, or robotic):
- "Explain more about X."
- "What about error handling?"
- "Tell me about performance."
- "Can you elaborate?"

Generate ONLY the follow-up question (including the warm acknowledgment). Nothing else.
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
    
    def should_continue_followup(
        self,
        question: str,
        response: str,
        evaluation: Dict,
        followup_count: int,
        experience_level: str = "mid"
    ) -> Dict:
        """
        Determine if the AI should continue asking follow-up questions.
        
        Returns:
        {
            "continue": True/False,
            "reason": "sufficient_skill" | "no_knowledge" | "partial_continue" | "max_reached",
            "confidence": 0.0-1.0
        }
        """
        # Quick check: max reached
        if followup_count >= 10:
            return {"continue": False, "reason": "max_reached", "confidence": 1.0}
        
        # Get score from evaluation
        overall_score = evaluation.get("overall_score", 50)
        
        # Build prompt for AI decision
        prompt = f"""You are assessing a technical interview candidate's response.

Question: {question[:200]}
Candidate's Response: {response[:500]}
Current Score: {overall_score}/100
Experience Level Expected: {experience_level}
Follow-ups Asked So Far: {followup_count}

Analyze if we should continue with more follow-up questions.

STOP CONDITIONS (respond "STOP"):
1. Candidate demonstrates strong, comprehensive understanding (score >= 80 and response shows depth)
2. Candidate explicitly says "I don't know" or similar
3. Response is incoherent or clearly shows no understanding of the topic
4. Candidate keeps repeating the same answer without new information

CONTINUE CONDITIONS (respond "CONTINUE"):
1. Candidate shows partial understanding but could be probed deeper
2. Response indicates "I've read about it" or similar surface knowledge
3. Good answer but missing key details relevant to the role
4. Candidate seems nervous but knowledgeable - needs more probing

Based on the response, decide: STOP or CONTINUE?

Format your response as:
DECISION: [STOP or CONTINUE]
REASON: [one of: sufficient_skill, no_knowledge, incoherent, repetitive, partial_understanding, surface_knowledge, needs_probing]
CONFIDENCE: [0.0 to 1.0]
"""

        try:
            response_obj = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=100,
                    temperature=0.2  # Low temperature for consistent decisions
                )
            )
            
            # Extract text
            response_text = ""
            if hasattr(response_obj, 'candidates') and response_obj.candidates:
                candidate = response_obj.candidates[0]
                if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                    parts = candidate.content.parts
                    if parts:
                        response_text = ''.join([part.text for part in parts if hasattr(part, 'text')]).strip()
            
            if not response_text and hasattr(response_obj, 'text'):
                response_text = response_obj.text.strip()
            
            # Parse response
            decision = "CONTINUE"
            reason = "partial_understanding"
            confidence = 0.7
            
            for line in response_text.split('\n'):
                line_upper = line.upper()
                if 'DECISION:' in line_upper:
                    if 'STOP' in line_upper:
                        decision = "STOP"
                    else:
                        decision = "CONTINUE"
                elif 'REASON:' in line.upper():
                    reason_text = line.split(':', 1)[-1].strip().lower()
                    # Map to standard reasons
                    if 'sufficient' in reason_text or 'strong' in reason_text:
                        reason = "sufficient_skill"
                    elif 'no_knowledge' in reason_text or "don't know" in reason_text:
                        reason = "no_knowledge"
                    elif 'incoherent' in reason_text:
                        reason = "no_knowledge"
                    elif 'repetitive' in reason_text:
                        reason = "no_knowledge"
                    elif 'partial' in reason_text or 'surface' in reason_text:
                        reason = "partial_continue"
                    else:
                        reason = reason_text.replace(' ', '_')
                elif 'CONFIDENCE:' in line.upper():
                    try:
                        conf_text = line.split(':', 1)[-1].strip()
                        confidence = float(conf_text)
                        confidence = max(0.0, min(1.0, confidence))
                    except:
                        confidence = 0.7
            
            # Map decision to continue boolean
            should_continue = decision == "CONTINUE"
            
            # If stopping, set appropriate reason
            if not should_continue and reason == "partial_continue":
                reason = "sufficient_skill"  # Default stop reason
            
            return {
                "continue": should_continue,
                "reason": reason,
                "confidence": confidence
            }
            
        except Exception as e:
            print(f"Error in should_continue_followup: {e}")
            # Fallback: use score-based decision
            if overall_score >= 85:
                return {"continue": False, "reason": "sufficient_skill", "confidence": 0.7}
            elif overall_score < 25:
                return {"continue": False, "reason": "no_knowledge", "confidence": 0.6}
            else:
                return {"continue": True, "reason": "partial_continue", "confidence": 0.5}

    def generate_transition(self, context: Dict) -> str:
        """Generate natural, warm transition message between questions"""
        summaries = context.get("interview_context", {}).get("round_summaries", [])
        if not summaries:
            return "That's great! Let's move on to another topic I'd like to discuss with you."
        
        last_summary = summaries[-1]
        topic = last_summary.get("topic", "")
        score = last_summary.get("final_score", 0)
        
        # Determine tone based on performance
        if score >= 75:
            tone_hint = "positive and encouraging"
        elif score >= 50:
            tone_hint = "supportive and neutral"
        else:
            tone_hint = "encouraging but moving forward"
        
        prompt = f"""Generate a brief, warm transition message for moving to the next interview question.

Previous topic discussed: {topic}
Tone to use: {tone_hint}

Generate a 1-2 sentence transition that:
1. Starts with a brief, warm acknowledgment (e.g., "Great insights!", "I appreciate you explaining that", "That's helpful context")
2. Smoothly transitions to the next topic
3. Sounds like a friendly human interviewer, not a robot
4. Avoids generic phrases like "Let's move on" or "Next question"

GOOD examples:
- "I really appreciate you walking me through that. Let me shift gears a bit and ask about something else."
- "That's a great perspective! There's another area I'm curious about."
- "Thanks for that detailed explanation. I'd love to explore a different topic with you."

BAD examples (avoid these):
- "Moving on to the next question."
- "Let's discuss something else."
- "Now I will ask about..."

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

    # ==================== Wiki Documentation Methods ====================
    
    def answer_codebase_question(self, question: str, code_context: str, category: str = None) -> Dict:
        """
        Generate an answer about the codebase using LLM.
        Returns: { "answer": str, "code_refs": List[str], "keywords": List[str] }
        """
        prompt = f"""You are a documentation assistant for the AI Interview Platform codebase.

Question: {question}

Relevant code context:
{code_context[:3000]}

Category hint: {category or "General"}

Provide a clear, concise answer about the BUSINESS LOGIC.

Rules:
- Focus on explaining HOW the system works, not just WHAT it does
- Include specific file references where the logic lives
- Use technical terms correctly
- Keep the answer under 300 words
- Be direct and helpful

Format your response as:
ANSWER: [Your detailed answer here]
CODE_REFS: [comma-separated list of file paths, e.g., backend/main.py, frontend/src/components/XYZ.tsx]
KEYWORDS: [5-8 relevant keywords for searching]
"""

        try:
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=1024,
                    temperature=0.3  # Lower temperature for factual answers
                )
            )
            
            # Extract text from response
            response_text = ""
            if hasattr(response, 'candidates') and response.candidates:
                candidate = response.candidates[0]
                if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                    parts = candidate.content.parts
                    if parts:
                        response_text = ''.join([part.text for part in parts if hasattr(part, 'text')]).strip()
            
            if not response_text and hasattr(response, 'text'):
                response_text = response.text.strip()
            
            # Parse response
            answer = ""
            code_refs = []
            keywords = []
            
            lines = response_text.split('\n')
            current_section = None
            
            for line in lines:
                if line.startswith('ANSWER:'):
                    current_section = 'answer'
                    answer = line.replace('ANSWER:', '').strip()
                elif line.startswith('CODE_REFS:'):
                    current_section = 'refs'
                    refs_text = line.replace('CODE_REFS:', '').strip()
                    code_refs = [r.strip() for r in refs_text.split(',') if r.strip()]
                elif line.startswith('KEYWORDS:'):
                    current_section = 'keywords'
                    kw_text = line.replace('KEYWORDS:', '').strip()
                    keywords = [k.strip().lower() for k in kw_text.split(',') if k.strip()]
                elif current_section == 'answer' and line.strip():
                    answer += ' ' + line.strip()
            
            # Fallback if parsing failed
            if not answer:
                answer = response_text
            
            return {
                "answer": answer,
                "code_refs": code_refs,
                "keywords": keywords
            }
            
        except Exception as e:
            print(f"Error generating wiki answer: {e}")
            return {
                "answer": f"I couldn't generate an answer for: '{question}'. Please try rephrasing your question.",
                "code_refs": [],
                "keywords": question.lower().split()[:5]
            }
    
    def generate_wiki_documentation(self, entry_name: str, code_context: str, focus: str = "business_logic") -> Dict:
        """
        Generate comprehensive documentation for a codebase entry.
        Used during initial indexing.
        Returns: { "question": str, "answer": str, "code_refs": List[str], "keywords": List[str] }
        """
        prompt = f"""You are documenting the AI Interview Platform codebase.

Entry to document: {entry_name}

Code context:
{code_context[:4000]}

Focus: {focus}

Generate documentation in the form of a Q&A entry.

Rules:
- Create a clear, searchable question about this functionality
- Answer should explain the business logic and implementation
- Include specific file paths as references
- Add relevant keywords for search
- Be comprehensive but concise (max 400 words for answer)

Format:
QUESTION: [A natural question someone might ask about this, e.g., "How does candidate matching work?"]
ANSWER: [Detailed explanation of the business logic]
CODE_REFS: [file paths, comma-separated]
KEYWORDS: [8-10 search keywords]
"""

        try:
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=1500,
                    temperature=0.2
                )
            )
            
            # Extract text
            response_text = ""
            if hasattr(response, 'candidates') and response.candidates:
                candidate = response.candidates[0]
                if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                    parts = candidate.content.parts
                    if parts:
                        response_text = ''.join([part.text for part in parts if hasattr(part, 'text')]).strip()
            
            if not response_text and hasattr(response, 'text'):
                response_text = response.text.strip()
            
            # Parse response
            question = ""
            answer = ""
            code_refs = []
            keywords = []
            
            lines = response_text.split('\n')
            current_section = None
            
            for line in lines:
                if line.startswith('QUESTION:'):
                    current_section = 'question'
                    question = line.replace('QUESTION:', '').strip()
                elif line.startswith('ANSWER:'):
                    current_section = 'answer'
                    answer = line.replace('ANSWER:', '').strip()
                elif line.startswith('CODE_REFS:'):
                    current_section = 'refs'
                    refs_text = line.replace('CODE_REFS:', '').strip()
                    code_refs = [r.strip() for r in refs_text.split(',') if r.strip()]
                elif line.startswith('KEYWORDS:'):
                    current_section = 'keywords'
                    kw_text = line.replace('KEYWORDS:', '').strip()
                    keywords = [k.strip().lower() for k in kw_text.split(',') if k.strip()]
                elif current_section == 'question' and line.strip() and not line.startswith('ANSWER'):
                    question += ' ' + line.strip()
                elif current_section == 'answer' and line.strip() and not line.startswith('CODE_REFS'):
                    answer += ' ' + line.strip()
            
            return {
                "question": question or f"How does {entry_name} work?",
                "answer": answer or "Documentation pending.",
                "code_refs": code_refs,
                "keywords": keywords or entry_name.lower().split()
            }
            
        except Exception as e:
            print(f"Error generating wiki documentation: {e}")
            return {
                "question": f"How does {entry_name} work?",
                "answer": f"Documentation for {entry_name} is pending generation.",
                "code_refs": [],
                "keywords": entry_name.lower().split()
            }
    
    def generate_followup_suggestion(self, question: str, answer: str) -> str:
        """
        Generate a follow-up question suggestion based on the answer.
        Returns: A suggested follow-up question string
        """
        prompt = f"""Based on this Q&A about a codebase, suggest ONE follow-up question the user might want to ask.

Question: {question}
Answer: {answer[:500]}

Rules:
- Suggest a natural follow-up (e.g., about architecture, implementation details, or related concepts)
- Keep it short and specific
- Make it actionable

Respond with ONLY the follow-up question, nothing else.
"""

        try:
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=100,
                    temperature=0.5
                )
            )
            
            followup = ""
            if hasattr(response, 'candidates') and response.candidates:
                candidate = response.candidates[0]
                if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                    parts = candidate.content.parts
                    if parts:
                        followup = ''.join([part.text for part in parts if hasattr(part, 'text')]).strip()
            
            if not followup and hasattr(response, 'text'):
                followup = response.text.strip()
            
            return followup if followup else "Would you like to see the code architecture for this?"
            
        except Exception as e:
            print(f"Error generating follow-up suggestion: {e}")
            return "Would you like to see the code architecture for this?"

    def enhance_question(
        self,
        seed_question: Dict,
        context: Dict,
        experience_level: str = "mid"
    ) -> Dict:
        """
        Enhance a bank question based on interview context.
        Uses the seed question as a template and adapts it.
        
        Args:
            seed_question: The bank question to enhance
            context: Interview context (previous answers, topics covered)
            experience_level: Target experience level
        
        Returns:
            Enhanced question dict with original seed_id preserved
        """
        seed_text = seed_question.get("text", "")
        seed_topic = seed_question.get("topic", "")
        seed_category = seed_question.get("category", "conceptual")
        
        # Get context from previous rounds
        round_summaries = context.get("interview_context", {}).get("round_summaries", [])
        previous_topics = [s.get("topic", "") for s in round_summaries]
        
        prompt = f"""You are enhancing an interview question based on the interview context.

SEED QUESTION:
"{seed_text}"
Topic: {seed_topic}
Category: {seed_category}

INTERVIEW CONTEXT:
- Experience Level: {experience_level}
- Topics Already Covered: {', '.join(previous_topics) if previous_topics else 'None yet'}
- Number of Questions Asked: {len(round_summaries)}

TASK:
1. Keep the core concept from the seed question
2. Adapt the phrasing to feel natural in the interview flow
3. If topics have been covered, you may connect this question to previous discussions
4. Adjust complexity for {experience_level} level
5. Make it conversational and engaging

Generate ONLY the enhanced question text. Keep it concise (1-3 sentences).
"""

        try:
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=300,
                    temperature=0.4  # Moderate creativity
                )
            )
            
            enhanced_text = ""
            if hasattr(response, 'candidates') and response.candidates:
                candidate = response.candidates[0]
                if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                    parts = candidate.content.parts
                    if parts:
                        enhanced_text = ''.join([part.text for part in parts if hasattr(part, 'text')]).strip()
            
            if not enhanced_text and hasattr(response, 'text'):
                enhanced_text = response.text.strip()
            
            # Clean up
            if enhanced_text.startswith('"') and enhanced_text.endswith('"'):
                enhanced_text = enhanced_text[1:-1]
            
            # Return enhanced question with original metadata
            return {
                **seed_question,
                "text": enhanced_text if enhanced_text else seed_text,
                "is_enhanced": True,
                "seed_question_id": seed_question.get("id")
            }
            
        except Exception as e:
            print(f"Error enhancing question: {e}")
            # Return original seed question on error
            return seed_question

    def review_code(
        self,
        code: str,
        question: Dict,
        language: str = "python"
    ) -> Dict:
        """
        Review submitted code and provide evaluation.
        
        Args:
            code: The submitted code
            question: The coding question with test cases and rubric
            language: Programming language
        
        Returns:
            Evaluation dict with scores and feedback
        """
        question_text = question.get("text", "")
        test_cases = question.get("test_cases", [])
        rubric = question.get("evaluation_rubric", {})
        
        prompt = f"""You are a code reviewer evaluating a candidate's solution.

QUESTION:
{question_text}

SUBMITTED CODE:
```{language}
{code}
```

TEST CASES:
{json.dumps(test_cases[:5], indent=2) if test_cases else "Not provided"}

EVALUATION RUBRIC:
{json.dumps(rubric, indent=2) if rubric else "Standard evaluation"}

TASK: Evaluate the code and provide scores.

Evaluate these aspects (0-100 each):
1. CORRECTNESS: Does the code solve the problem correctly?
2. EFFICIENCY: Is the time/space complexity optimal?
3. CODE_QUALITY: Is the code clean, readable, well-structured?
4. EDGE_CASES: Does it handle edge cases properly?

Format your response as:
CORRECTNESS: [score]
EFFICIENCY: [score]
CODE_QUALITY: [score]
EDGE_CASES: [score]
FEEDBACK: [2-3 sentences of constructive feedback]
APPROACH: [1 sentence describing their approach]
"""

        try:
            import json
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=500,
                    temperature=0.2  # Low temperature for consistent evaluation
                )
            )
            
            response_text = ""
            if hasattr(response, 'candidates') and response.candidates:
                candidate = response.candidates[0]
                if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                    parts = candidate.content.parts
                    if parts:
                        response_text = ''.join([part.text for part in parts if hasattr(part, 'text')]).strip()
            
            if not response_text and hasattr(response, 'text'):
                response_text = response.text.strip()
            
            # Parse response
            result = {
                "correctness": 50,
                "efficiency": 50,
                "code_quality": 50,
                "edge_cases": 50,
                "feedback": "",
                "approach": ""
            }
            
            for line in response_text.split('\n'):
                line_upper = line.upper()
                if line_upper.startswith('CORRECTNESS:'):
                    try:
                        result["correctness"] = int(line.split(':')[1].strip().split()[0])
                    except:
                        pass
                elif line_upper.startswith('EFFICIENCY:'):
                    try:
                        result["efficiency"] = int(line.split(':')[1].strip().split()[0])
                    except:
                        pass
                elif line_upper.startswith('CODE_QUALITY:'):
                    try:
                        result["code_quality"] = int(line.split(':')[1].strip().split()[0])
                    except:
                        pass
                elif line_upper.startswith('EDGE_CASES:'):
                    try:
                        result["edge_cases"] = int(line.split(':')[1].strip().split()[0])
                    except:
                        pass
                elif line_upper.startswith('FEEDBACK:'):
                    result["feedback"] = line.split(':', 1)[1].strip()
                elif line_upper.startswith('APPROACH:'):
                    result["approach"] = line.split(':', 1)[1].strip()
            
            # Calculate combined score
            weights = rubric if rubric else {
                "correctness": {"weight": 0.40},
                "efficiency": {"weight": 0.25},
                "code_quality": {"weight": 0.20},
                "edge_cases": {"weight": 0.15}
            }
            
            combined = 0
            for key in ["correctness", "efficiency", "code_quality", "edge_cases"]:
                weight = weights.get(key, {}).get("weight", 0.25)
                combined += result[key] * weight
            
            result["combined_score"] = round(combined, 1)
            
            return result
            
        except Exception as e:
            print(f"Error reviewing code: {e}")
            return {
                "correctness": 50,
                "efficiency": 50,
                "code_quality": 50,
                "edge_cases": 50,
                "combined_score": 50,
                "feedback": "Unable to evaluate code automatically.",
                "approach": "Review required."
            }

