"""Input validation utilities"""
from typing import Optional

class Validators:
    """Validation utilities"""
    
    @staticmethod
    def validate_language(language: str) -> bool:
        """Validate language is supported"""
        return language.lower() in ["python", "java"]
    
    @staticmethod
    def validate_response_text(text: str) -> bool:
        """Validate response text is not empty"""
        return bool(text and text.strip())
    
    @staticmethod
    def validate_file_extension(filename: str, allowed_extensions: list) -> bool:
        """Validate file extension"""
        if not filename:
            return False
        ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
        return ext in allowed_extensions









