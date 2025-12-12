"""JD and Resume analysis for language detection"""
from typing import Dict, Optional
from backend.llm.gemini_client import GeminiClient
from backend.utils.file_parser import FileParser

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
        
        # Use Gemini to analyze
        return self.gemini_client.analyze_language(
            jd_text or "",
            resume_text or ""
        )


