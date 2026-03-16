from fastapi import APIRouter, Depends, UploadFile, File, Form
from app.dependencies import get_current_user
from app.services.ai_provider import get_ai_provider
from app.services.pdf_service import extract_text_from_pdf

router = APIRouter(prefix="/api/mining", tags=["mining"])


@router.post("/extract")
async def extract_citations(
    file: UploadFile = File(...),
    pico_p: str = Form(""),
    pico_i: str = Form(""),
    pico_c: str = Form(""),
    pico_o: str = Form(""),
    pico_s: str = Form(""),
    pico_e: str = Form(""),
    user: dict = Depends(get_current_user),
):
    """Extract citations from a systematic review PDF."""
    file_bytes = await file.read()
    text = extract_text_from_pdf(file_bytes, strict_crop=False)

    pico = {"P": pico_p, "I": pico_i, "C": pico_c, "O": pico_o, "S": pico_s, "E": pico_e}
    provider = get_ai_provider()
    result = provider.mine_citations(text, pico)

    return {"citations": [c.model_dump() for c in result.Citations]}
