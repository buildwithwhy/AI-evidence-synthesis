from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from app.dependencies import get_current_user
from app.services.ai_provider import get_ai_provider
from app.services.pdf_service import extract_text_from_pdf

router = APIRouter(prefix="/api/pico", tags=["pico"])


@router.post("/extract")
async def extract_pico(
    text: str = Form(""),
    file: UploadFile | None = File(None),
    user: dict = Depends(get_current_user),
):
    """Extract PICO criteria from protocol text or PDF."""
    if file:
        file_bytes = await file.read()
        text = extract_text_from_pdf(file_bytes, strict_crop=False)

    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="No text provided")

    try:
        provider = get_ai_provider()
        result = provider.extract_pico(text)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"PICO extraction failed: {str(e)}")

    return {
        "P": result.Population,
        "I": result.Intervention,
        "C": result.Comparator,
        "O": result.Outcome,
        "S": result.StudyDesign,
        "E": result.Exclusion,
        "IncludeMetaAnalysis": result.IncludeMetaAnalysis,
    }
