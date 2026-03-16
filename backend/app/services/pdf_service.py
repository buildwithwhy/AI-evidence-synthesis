import fitz  # PyMuPDF
from fastapi import HTTPException


def extract_text_from_pdf(file_bytes: bytes, strict_crop: bool = True) -> str:
    """Extract text from PDF bytes. If strict_crop, stop at references section."""
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    all_text = ""
    stop_keywords = ["REFERENCES", "References", "BIBLIOGRAPHY", "Bibliography", "LITERATURE CITED"]

    try:
        with fitz.open(stream=file_bytes, filetype="pdf") as doc:
            for page in doc:
                text = page.get_text()
                if strict_crop and any(k in text[:500] for k in stop_keywords):
                    all_text += "\n\n[...References Removed...]"
                    break
                all_text += text + "\n"
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read PDF: {e}")

    if not all_text.strip():
        raise HTTPException(status_code=400, detail="PDF appears to be empty or image-only")

    return all_text
