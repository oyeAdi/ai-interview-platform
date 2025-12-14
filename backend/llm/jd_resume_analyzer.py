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
        Returns: { "language": "python" | "java", "confidence": float }
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
        
        result = self.gemini_client.analyze_language(
            jd_text or "",
            resume_text or ""
        )
        
        # Extract candidate info if resume text is available
        candidate_info = {}
        if resume_text:
            candidate_info = self.extract_candidate_info(resume_text)
            
        return {**result, "candidate_info": candidate_info}

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






