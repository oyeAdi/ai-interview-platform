"""Email generation using Gemini LLM"""
from ..llm.gemini_client import GeminiClient
import google.generativeai as genai

def generate_interview_email(
    candidate_name: str,
    position_title: str,
    company_name: str,
    interview_link: str,
    expires_at: str,
    ttl_minutes: int,
    interviewer_name: str = "Hiring Team"
) -> str:
    """
    Generate professional, personalized interview invitation email using Gemini
    
    Features:
    - Professional yet warm tone
    - Personalized to candidate and position
    - Persuasive (encourages participation)
    - Anti-cheating disclaimers
    - Clear instructions
    """
    
    # Use existing Gemini client
    client = GeminiClient()
    
    prompt = f"""Generate a high-quality, professional html email invitation.
    
CONTEXT:
- Candidate Name: {candidate_name}
- Position: {position_title}
- Company: {company_name}
- Interview Link: {interview_link}
- Link Expires: {expires_at} ({ttl_minutes} minutes from now)
- Interviewer: {interviewer_name}

DESIGN SYSTEM (SILICON VALLEY STANDARD):
1. **Container**: Max-width 600px, centered, white background, subtle border-radius (8px), no borders, soft shadow.
2. **Typography**: System fonts ('-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif).
   - Headings: Dark gray (#1F2937), semibold.
   - Body: Medium gray (#4B5563), legible size (16px), 1.6 line-height.
3. **Colors**:
   - Primary Accent: #0F172A (Deep Navy) or #2563EB (Subtle Royal Blue). Avoid neon or bright cyan.
   - Background Page: #F3F4F6 (Light Gray).
4. **Header**: Minimalist. Simple logo placeholder or clean text branding at the top.
5. **Call to Action**: 
   - Button: #000000 (Black) or #2563EB (Royal Blue). White text. Rounded corners (6px). Medium padding.
   - No gradients on buttons. Flat design.

CONTENT STRUCTURE:
1. **Preheader**: "Invitation to interview for {position_title}"
2. **Greeting**: Warm and professional ("Hi {candidate_name},").
3. **Opening**: "We were impressed by your background" context.
4. **The Ask**: Clear details about the interview (Duration, Format).
5. **The Link**: Distinct section with the CTA button.
6. **Anti-Cheating / Integrity**: 
   - styling: Small font (12px), gray text (#6B7280), subtle background (#F9FAFB), rounded box.
   - content: "This session employs automated integrity monitoring..."
7. **Footer**: Minimalist signature.

OUTPUT REQUIREMENT:
- Return ONLY the raw HTML code. 
- Use inline CSS for all styling (email client compatibility).
- Ensure specific attention to the "Link Expires" warning (make it tasteful but visible).
"""
    
    try:
        response = client.model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,  # Creative but controlled
                max_output_tokens=2048,
                top_p=0.9
            )
        )
        
        # Extract text using existing pattern
        email_html = ""
        if hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
            if hasattr(candidate, 'content') and hasattr(candidate.content, 'parts'):
                parts = candidate.content.parts
                if parts:
                    email_html = ''.join([part.text for part in parts if hasattr(part, 'text')]).strip()
        
        if not email_html and hasattr(response, 'text'):
            email_html = response.text.strip()
        
        if not email_html:
            raise ValueError("Empty response from Gemini")
        
        # Clean up any markdown code blocks if present
        email_html = email_html.replace('```html', '').replace('```', '').strip()
        
        return email_html
        
    except Exception as e:
        print(f"Error generating email with Gemini: {e}")
        # Fallback to template
        return _get_fallback_email_template(
            candidate_name, position_title, company_name,
            interview_link, expires_at, ttl_minutes
        )

def _get_fallback_email_template(
    candidate_name: str,
    position_title: str,
    company_name: str,
    interview_link: str,
    expires_at: str,
    ttl_minutes: int
) -> str:
    """Fallback HTML email template if Gemini fails"""
    return f"""<html>
<body style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0;">
    <div style="background: linear-gradient(135deg, #00E5FF 0%, #0099CC 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Interview Invitation</h1>
    </div>
    
    <div style="background: white; padding: 30px; border: 1px solid #e0e0e0;">
        <p style="font-size: 16px; color: #333;">Hi {candidate_name},</p>
        
        <p style="font-size: 16px; color: #333; line-height: 1.6;">
            We're excited to invite you to interview for the <strong>{position_title}</strong> position at <strong>{company_name}</strong>! 
            Your background caught our attention, and we'd love to learn more about you.
        </p>
        
        <div style="background: #f8f9fa; padding: 20px; margin: 25px 0; border-left: 4px solid #00E5FF;">
            <h3 style="margin-top: 0; color: #00E5FF;">Join Your Interview</h3>
            <p style="margin: 10px 0;"><strong>Link Expires:</strong> <span style="color: #d32f2f;">{expires_at} ({ttl_minutes} minutes)</span></p>
            <a href="{interview_link}" style="display: inline-block; background: #00E5FF; color: black; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 15px; font-size: 16px;">
                Start Interview Now →
            </a>
        </div>
        
        <h3 style="color: #333;">What to Expect:</h3>
        <ul style="color: #555; line-height: 1.8;">
            <li>Duration: Approximately 45-60 minutes</li>
            <li>Format: Technical questions, coding challenges, behavioral questions</li>
            <li>Requirements: Stable internet, laptop/desktop, microphone</li>
        </ul>
        
        <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 25px 0; border-radius: 4px;">
            <h4 style="margin-top: 0; color: #856404;">⚠️ Important: Interview Integrity</h4>
            <p style="color: #856404; margin: 0; font-size: 14px;">
                This interview is monitored by AI to ensure fairness. Please note:
            </p>
            <ul style="color: #856404; font-size: 14px; margin: 10px 0;">
                <li>Session may be recorded</li>
                <li>AI monitors for suspicious activity</li>
                <li>Cheating results in disqualification</li>
            </ul>
        </div>
        
        <p style="color: #333;">
            Best of luck!<br>
            <strong>{company_name} Hiring Team</strong>
        </p>
    </div>
    
    <div style="background: #f5f5f5; padding: 20px; text-align: center;">
        <p style="color: #999; font-size: 12px; margin: 0;">
            This is an automated email. Please do not reply.
        </p>
    </div>
</body>
</html>"""
