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
        if feedback_type == "detailed":
            # Extract necessary details for the detailed prompt
            candidate_name = interview_summary.get("meta", {}).get("candidate_name", "Candidate")
            position_title = interview_summary.get("meta", {}).get("position", "Unknown Position")
            overall_score = interview_summary.get("meta", {}).get("overall_internal_score", "N/A")
            
            # Placeholder for duration, total_questions, metrics_str, transcript_str, expert_name
            # These would typically be derived from log_data or result_data in a real implementation
            duration_str = "60 minutes" # Example placeholder
            total_questions = len(interview_summary.get("transcript_summary", [])) # Example placeholder
            metrics_str = "Technical Skills: 70/100, Problem Solving: 80/100" # Example placeholder
            transcript_str = json.dumps(interview_summary.get("transcript_summary", []), indent=2) # Example placeholder
            expert_name = "Aditya" # Example placeholder

            style_directive = f"""You are an expert technical interviewer providing COMPREHENSIVE, DETAILED feedback for a candidate interview.

**IMPORTANT**: This is a LONG, DETAILED feedback report. Provide in-depth technical analysis with specific examples.

Interview Context:
- Candidate: {candidate_name}
- Position: {position_title}
- Duration: {duration_str}
- Questions Asked: {total_questions}
- Overall Score: {overall_score}/100

Performance Breakdown:
{metrics_str}

Interview Transcript:
{transcript_str}

Generate a DETAILED, COMPREHENSIVE technical feedback report (minimum 400 words) that includes:

1. **General Summary** (2-3 paragraphs):
   - Overall performance assessment
   - Key technical strengths demonstrated
   - Main areas needing improvement
   - Specific examples from the interview

2. **Detailed Technical Analysis**:
   - Deep dive into each technical area covered
   - Specific code quality observations
   - Problem-solving approach evaluation
   - Communication effectiveness

3. **Positive Highlights** (bullet points with details):
   - Specific technical concepts mastered
   - Strong problem-solving moments
   - Good coding practices observed
   - Effective communication examples

4. **Areas for Improvement** (bullet points with details):
   - Technical gaps identified
   - Missed optimization opportunities
   - Communication issues
   - Specific recommendations for each area

5. **Rating Justification**:
   - Explain the {overall_score}/100 score
   - Break down by technical competency
   - Compare to position requirements

6. **Recommendations**:
   - Specific topics to study
   - Practice suggestions
   - Next steps for the candidate

Be specific, constructive, and reference actual moments from the interview. This should be a thorough technical assessment.

Regards,
{expert_name}"""
        elif feedback_type == "short":
            candidate_name = interview_summary.get("meta", {}).get("candidate_name", "Candidate")
            position_title = interview_summary.get("meta", {}).get("position", "Unknown Position")
            
            style_directive = f"""
You are an expert technical interviewer providing COMPREHENSIVE, DETAILED feedback for {candidate_name}'s interview for the {position_title} position.

**CRITICAL REQUIREMENTS**:
1. **Length**: Generate 1000-1500 words of exhaustive, detailed feedback
2. **Structure**: Follow the exact format below
3. **Depth**: Provide specific examples from the interview, not generic statements
4. **Skills**: Include detailed skill-wise breakdown with technical analysis

**FORMAT** (MUST FOLLOW EXACTLY):

Hi,

Please find comprehensive feedback for {candidate_name}:

**General Summary** (200-250 words):
[Provide a detailed overview covering:
- Interview focus and question types asked
- Overall performance assessment
- Key strengths demonstrated
- Main areas requiring improvement
- Candidate's communication style and approach
- Technical depth and problem-solving ability
- Comparison to expected level for {position_title}]

**Skill-Wise Technical Analysis** (500-700 words):

For each relevant technical skill area, provide detailed assessment:

• **[Skill Area 1]** (e.g., Java Core & Data Structures):
  - Demonstrated understanding: [Specific examples from interview]
  - Strengths: [What they did well]
  - Gaps: [What was missing or weak]
  - Score: X/10

• **[Skill Area 2]** (e.g., Problem Solving & Algorithms):
  - Demonstrated understanding: [Specific examples]
  - Strengths: [What they did well]
  - Gaps: [What was missing]
  - Score: X/10

• **[Skill Area 3]** (e.g., System Design/Architecture):
  - Demonstrated understanding: [Specific examples]
  - Strengths: [What they did well]
  - Gaps: [What was missing]
  - Score: X/10

[Continue for all relevant skills - minimum 3-4 skill areas]

**Communication & Approach** (100-150 words):
- Clarity of explanations
- Ability to articulate thought process
- Response to follow-up questions
- Handling of challenging questions
- Overall interview presence

**Detailed Strengths** (150-200 words):
• [Strength 1 with specific example from interview]
• [Strength 2 with specific example]
• [Strength 3 with specific example]
• [Strength 4 with specific example]
• [Strength 5 with specific example]

**Areas for Improvement** (150-200 words):
• [Improvement area 1 with specific gap identified]
• [Improvement area 2 with specific gap]
• [Improvement area 3 with specific gap]
• [Improvement area 4 with specific gap]
• [Improvement area 5 with specific gap]

**Recommendation** (100-150 words):
[Clear hire/no-hire recommendation with justification based on:
- Overall technical competency
- Fit for {position_title} role
- Comparison to required skill level
- Potential for growth
- Specific next steps if not hired]

**Overall Rating**: X.X/4
[Provide rating with brief justification]

Regards,
Aditya

**RULES**:
- MUST be 1000-1500 words total
- Use specific examples from the actual interview transcript
- Avoid generic statements - be specific and detailed
- Include technical terminology relevant to {position_title}
- Provide actionable feedback
- Be constructive but honest
- Reference actual questions asked and answers given
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
You are a Technical Interview Feedback Assistant. Generate ONLY the feedback content itself - no meta-commentary, no explanations about what you're doing, no preambles.

CRITICAL RULES:
1. Start DIRECTLY with the feedback content (e.g., "Hi," or "Dear [Name],")
2. Do NOT include phrases like "Okay, here's the feedback..." or "Based on the input..."
3. Do NOT include markdown code fences (```) in your output
4. Do NOT explain limitations or missing data - work with what you have
5. Be professional, technical, and concise

{style_directive}

INPUT DATA:
{json.dumps(interview_summary, indent=2)}

Generate ONLY the {feedback_type} feedback content now. Start directly with the greeting.
"""
        
        # 4. Generate Content
        try:
            response = self.client.model.generate_content(system_prompt)
            feedback_text = response.text.strip()
            
            # Clean up any remaining artifacts
            # Remove markdown code fences if present
            if feedback_text.startswith('```'):
                lines = feedback_text.split('\n')
                # Remove first and last lines if they're code fences
                if lines[0].startswith('```'):
                    lines = lines[1:]
                if lines and lines[-1].startswith('```'):
                    lines = lines[:-1]
                feedback_text = '\n'.join(lines).strip()
            
            # Remove common meta-commentary patterns
            meta_patterns = [
                "Okay, here's the detailed feedback",
                "Here is the feedback",
                "Based on the provided input",
                "Given the limited input",
                "Here's the feedback for"
            ]
            for pattern in meta_patterns:
                if feedback_text.lower().startswith(pattern.lower()):
                    # Find the first actual content (usually after first newline or colon)
                    if ':' in feedback_text[:100]:
                        feedback_text = feedback_text.split(':', 1)[1].strip()
                    elif '\n' in feedback_text[:100]:
                        lines = feedback_text.split('\n', 1)
                        if len(lines) > 1:
                            feedback_text = lines[1].strip()
            
            return feedback_text
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
