"""JD and Resume analysis for language detection"""
from typing import Dict, Optional
from llm.gemini_client import GeminiClient
from utils.file_parser import FileParser

class JDResumeAnalyzer:
    """Analyzes JD and Resume to determine required language"""
    
    def __init__(self):
        self.gemini_client = GeminiClient()
        self.file_parser = FileParser()
    
    def analyze(
        self,
        jd_text: Optional[str] = None,
        jd_file: Optional[str] = None,
        resume_text: Optional[str] = None,
        resume_file: Optional[str] = None
    ) -> Dict:
        """
        Analyze JD and Resume to determine language
        Returns: { "language": "python" | "java" | "General", "confidence": float }
        """
        # Extract text from files if provided
        if jd_file:
            jd_text = self.file_parser.parse_file(jd_file)
        if resume_file:
            resume_text = self.file_parser.parse_file(resume_file)
        
        # Combine text
        combined_text = ""
        if jd_text:
            combined_text += f"Job Description:\n{jd_text}\n\n"
        if resume_text:
            combined_text += f"Resume:\n{resume_text}\n"
        
        if not combined_text.strip():
            raise ValueError("Either JD or Resume text/file must be provided")
        
        # FIRST: Detect if this is a technical role requiring programming
        is_technical = self.detect_technical_role(jd_text or "")
        
        # Extract candidate info if resume text is available
        candidate_info = {}
        if resume_text:
            candidate_info = self.extract_candidate_info(resume_text)
        
        # If non-technical role, return "General" language
        if not is_technical:
            return {
                "language": "General",
                "confidence": 1.0,
                "candidate_info": candidate_info
            }
        
        # Technical role: detect programming language
        result = self.gemini_client.analyze_language(
            jd_text or "",
            resume_text or ""
        )
            
        return {**result, "candidate_info": candidate_info}
    
    def detect_technical_role(self, jd_text: str) -> bool:
        """
        Detect if JD is for a technical role requiring programming skills
        
        Returns:
            True if technical (software development) role
            False if non-technical role
        """
        if not jd_text:
            return False  # Default to non-technical if no JD
        
        jd_lower = jd_text.lower()
        
        # Non-technical keywords (checked first - higher priority)
        non_technical_keywords = [
            'janitor', 'helper', 'cleaner', 'cleaning', 'maintenance worker',
            'receptionist', 'secretary', 'administrative assistant',
            'sales representative', 'sales manager', 'account manager',
            'marketing manager', 'marketing coordinator',
            'customer service', 'customer support', 'support representative',
            'hr manager', 'hr coordinator', 'recruiter', 'talent acquisition',
            'product manager', 'product owner',  # PM is non-coding
            'project manager', 'scrum master',
            'business analyst', 'data analyst',  # Analyst roles (not coding-heavy)
            'accountant', 'finance manager',
            'operations manager', 'logistics'
        ]
        
        # Technical keywords (software development roles)
        technical_keywords = [
            'software engineer', 'software developer',
            'backend developer', 'backend engineer',
            'frontend developer', 'frontend engineer',
            'full stack', 'fullstack',
            'web developer', 'web engineer',
            'mobile developer', 'ios developer', 'android developer',
            'devops engineer', 'site reliability engineer',
            'data engineer', 'ml engineer', 'machine learning engineer',
            'python developer', 'java developer', 'javascript developer',
            'programmer', 'coding', 'programming'
        ]
        
        # Check for non-technical keywords FIRST (higher priority)
        for keyword in non_technical_keywords:
            if keyword in jd_lower:
                return False  # Non-technical role
        
        # Then check for technical keywords
        for keyword in technical_keywords:
            if keyword in jd_lower:
                return True  # Technical role
        
        # Check for programming language mentions (strong indicator)
        programming_languages = ['python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'ruby', 'go', 'rust']
        for lang in programming_languages:
            # Only count if it's a clear programming context
            if f'{lang} ' in jd_lower or f'{lang},' in jd_lower or f'{lang}.' in jd_lower:
                return True
        
        # Default to non-technical (safer - avoids coding questions for unclear roles)
        return False

    def extract_candidate_info(self, resume_text: str) -> Dict:
        """
        Extract candidate detailed info (Name, Email, Experience) from resume regex/LLM
        """
        if not resume_text:
            return {"name": "Anonymous Candidate", "email": ""}
            
        prompt = f"""Extract the following details from the Resume text below.
        
RESUME:
{resume_text[:2000]}

RETURN JSON ONLY:
{{
  "name": "Full Name",
  "email": "Email Address",
  "experience_years": "Number (estimate if not explicit, default 0)"
}}
If name not found, use "Anonymous Candidate".
"""
        try:
            response = self.gemini_client.model.generate_content(prompt)
            import json
            text = response.text.replace('```json', '').replace('```', '').strip()
            data = json.loads(text)
            return data
        except:
            return {"name": "Anonymous Candidate", "email": ""}




