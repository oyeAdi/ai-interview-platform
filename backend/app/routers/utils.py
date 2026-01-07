from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import Optional
import io
import PyPDF2
# import docx  # python-docx

router = APIRouter(
    prefix="/utils",
    tags=["utils"]
)

@router.post("/parse_resume")
async def parse_resume_file(file: UploadFile = File(...)):
    """
    Parse uploaded resume file (PDF, DOCX, TXT) and return text content.
    """
    filename = file.filename.lower()
    content = await file.read()
    text = ""

    try:
        if filename.endswith('.pdf'):
            # Parse PDF
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        
        elif filename.endswith('.docx'):
            # Parse DOCX (Lazy import to avoid failures if optional dep missing)
            try:
                import docx
                doc = docx.Document(io.BytesIO(content))
                for para in doc.paragraphs:
                    text += para.text + "\n"
            except ImportError:
                 return {"error": "python-docx not installed, cannot parse .docx"}

        elif filename.endswith('.txt'):
            # Parse TXT
            text = content.decode('utf-8')
        
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF, DOCX, or TXT.")

        return {
            "filename": file.filename,
            "text": text.strip(),
            "status": "success"
        }

    except PyPDF2.errors.PdfReadError as e:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid or corrupted PDF file. Please ensure the file is a valid PDF. Error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse file: {str(e)}")
