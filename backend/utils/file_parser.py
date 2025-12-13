"""File parsing utilities for PDF, DOCX, TXT"""
import os
from typing import Optional

class FileParser:
    """Parse various file formats to extract text"""
    
    @staticmethod
    def parse_file(file_path: str) -> str:
        """Parse file and return text content"""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        ext = os.path.splitext(file_path)[1].lower()
        
        if ext == ".txt":
            return FileParser._parse_txt(file_path)
        elif ext == ".pdf":
            return FileParser._parse_pdf(file_path)
        elif ext in [".docx", ".doc"]:
            return FileParser._parse_docx(file_path)
        else:
            raise ValueError(f"Unsupported file type: {ext}")
    
    @staticmethod
    def _parse_txt(file_path: str) -> str:
        """Parse plain text file"""
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()
    
    @staticmethod
    def _parse_pdf(file_path: str) -> str:
        """Parse PDF file"""
        try:
            import PyPDF2
            text = ""
            with open(file_path, 'rb') as f:
                pdf_reader = PyPDF2.PdfReader(f)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
            return text
        except ImportError:
            # Fallback: return placeholder
            return f"[PDF content from {os.path.basename(file_path)} - PyPDF2 not installed]"
        except Exception as e:
            return f"[Error parsing PDF: {str(e)}]"
    
    @staticmethod
    def _parse_docx(file_path: str) -> str:
        """Parse DOCX file"""
        try:
            from docx import Document
            doc = Document(file_path)
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            return text
        except ImportError:
            # Fallback: return placeholder
            return f"[DOCX content from {os.path.basename(file_path)} - python-docx not installed]"
        except Exception as e:
            return f"[Error parsing DOCX: {str(e)}]"





