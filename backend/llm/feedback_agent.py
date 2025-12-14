from typing import Dict, List, Optional
import json
import logging
from llm.gemini_client import GeminiClient

class FeedbackGenerator:
    """
    Specialized agent for generating technical interview feedback reports.
    Follows strict formatting rules for Detailed, Short, and Skill-wise feedback.
    """
    
    def __init__(self):
        self.client = GeminiClient()
        self.logger = logging.getLogger(__name__)

    def generate_feedback(self, log_data: Dict, result_data: Dict, feedback_type: str = "detailed") -> str:
        """
        Generate feedback report based on interview logs and results.
        
        Args:
            log_data: The full interview transcript and events from log.json
            result_data: The calculated scores and metadata from candidate_results.json
            feedback_type: 'detailed' (default), 'short', or 'skill-wise'
            
        Returns:
            str: The formatted feedback report
        """
        
        # 1. Prepare Data Context
        # We summarize the log to avoid context limits while keeping essential details
        interview_summary = self._prepare_context(log_data, result_data)
        
        # 2. Select Style Directive
        style_directive = ""
        if feedback_type == "short":
            style_directive = """
Additional Style Directive – /format-short-concise

When the user requests “short feedback,” “concise feedback,” or explicitly says “use /format-short-concise”, apply the following structure verbatim:

Hi,

Please find feedback for [Candidate Name]:

General Summary:
[Brief summary paragraph – 4–5 lines describing interview focus, candidate performance, and key improvement areas.]

Positive:
• [Positive point 1]
• [Positive point 2]
• [Positive point 3]

Negative:
• [Negative point 1]
• [Negative point 2]
• [Negative point 3]

Rating out of 4:
X.X/4

Regards,
Aditya

Rules:
Always preserve this layout and phrasing.
Keep tone concise, neutral, and professional.
Use bullet points and one short paragraph in “General Summary.”
If rating is omitted or unknown, write “N/A” instead.
"""
        elif feedback_type == "skill-wise":
            style_directive = """
Additional Style Directive – skill-wise-format

When the user says “skill-wise-format”, “skill-wise”, “next skill”, or provides an individual skill name, produce feedback in this exact dashed-line style:
Begin with three sections only: General, Strengths, Weaknesses
Every line must start with a dash followed by a space ("- ")
No bullets, no numbering, no bold formatting, no markdown interpretations
Content must be crisp, direct, and skill-specific.

Format template:

-{skill name}
General:
- [observation]
- [observation]

Strengths:
- [strength]
- [strength]

Weaknesses:
- [weakness]
- [weakness]
- [weakness]

Rules:
Always use the defined dashed-line layout.
Do not include ratings.
"""
        else:
            # Default Detailed Summary
            style_directive = """
Rules for Detailed summary feedback (Default):
There will be no Overall Rating but do include the Recommendation for Hire.
Detailed summary feedback should contain:
Candidate Name: {Name}
Interview Type: {Type}
Recommendation: Hire/No-Hire for {Level} Position
Detailed Reason:

-General Summary
-Technical Skills Evaluation:
  -Java Core & Data Structures
  -Java 8 & Functional Programming
  -Problem Solving & Algorithms
  -SQL
  -Testing & Tooling
  -Communication & Approach
(Adjust skills based on actual interview content)

-Strengths
-Areas for Improvement
-Recommendation
"""

        # 3. Construct System Prompt
        system_prompt = f"""
This Agent is a Technical Interview Feedback Assistant designed to help interviewers produce clear, structured, and professional and very technical feedback after technical interviews. It accepts input in form of log.json and candidate results.json and converts them into consistent, role-appropriate evaluation documents for hiring decisions. This feedback should be mostly technical where It focuses on the skills and related topics discussed during the call.

It follows a formal feedback format unless instructed otherwise. Responses are organized into sections such as: General Summary, Positives, Weaknesses, and (if not omitted) Overall Rating. When 'no rating is needed' is specified, the rating section is excluded. Even with minimal input, the GPT extracts as much meaningful insight as possible without fabricating information.

It ensures objectivity and professionalism, avoiding speculation or personal bias. Writing is concise and business-appropriate, focusing on demonstrated technical competence, reasoning, and communication.

Any skill that was not explicitly discussed in the feedback should be marked as such. Use judgment when deciding what to mention. If a skill was neither covered nor clearly related to the topics discussed, and it is not possible to determine whether the candidate knows it, state this explicitly.

{style_directive}

INPUT DATA:
{json.dumps(interview_summary, indent=2)}

Generate the feedback report now based on the requested format: {feedback_type}
"""

        # 4. Generate Content
        try:
            response = self.client.model.generate_content(system_prompt)
            # Use basic text extraction, handle potential blocks
            return response.text.strip()
        except Exception as e:
            self.logger.error(f"Failed to generate feedback: {e}")
            return f"Error generating feedback report. Please check logs. Details: {str(e)}"

    def _prepare_context(self, log_data: Dict, result_data: Dict) -> Dict:
        """Structure the raw data for the LLM to process efficiently."""
        
        # Extract candidate details
        candidate_name = result_data.get("candidate", {}).get("name") or "Candidate"
        
        # Simplify transcript - mapped by topic/question
        transcript_summary = []
        questions = log_data.get("questions") or log_data.get("rounds") or []
        
        for q in questions:
            # Get the main question text
            q_text = q.get("text", "Unknown Question")
            q_topic = q.get("topic", "General")
            
            # Gather responses and follow-ups
            responses_text = []
            if "responses" in q:
                for r in q["responses"]:
                    ans = r.get("candidate_response") or r.get("response_text") or ""
                    # Truncate very long code blocks for token efficiency if needed, 
                    # but keeping mostly intact for accuracy
                    if len(ans) > 1000:
                        ans = ans[:1000] + "... [truncated]"
                    responses_text.append(f"Answer: {ans}")
            
            # Add to summary
            transcript_summary.append({
                "topic": q_topic,
                "question": q_text,
                "exchanges": responses_text,
                "score": _extract_score(q)
            })
            
        return {
            "meta": {
                "candidate_name": candidate_name,
                "position": result_data.get("position", {}).get("title"),
                "overall_internal_score": result_data.get("overall_score")
            },
            "transcript_summary": transcript_summary
        }

def _extract_score(question_data: Dict) -> int:
    """Helper to safely extract score from question data"""
    try:
        if "responses" in question_data and question_data["responses"]:
            last_resp = question_data["responses"][-1]
            return last_resp.get("evaluation", {}).get("overall_score", 0)
    except:
        return 0
    return 0
