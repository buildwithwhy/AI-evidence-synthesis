import io
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from app.dependencies import get_current_user
from app.services.ai_provider import get_ai_provider
from app.services.pdf_service import extract_text_from_pdf
from app.schemas import ScreeningResultOut

router = APIRouter(prefix="/api/screening", tags=["screening"])


@router.post("/analyze", response_model=ScreeningResultOut)
async def analyze_study(
    level: int = Form(1),
    title: str = Form(""),
    text: str = Form(""),
    pico_p: str = Form(""),
    pico_i: str = Form(""),
    pico_c: str = Form(""),
    pico_o: str = Form(""),
    pico_s: str = Form(""),
    pico_e: str = Form(""),
    file: UploadFile | None = File(None),
    user: dict = Depends(get_current_user),
):
    """Analyze a single study against PICO criteria."""
    if file:
        file_bytes = await file.read()
        strict_crop = level == 1
        text = extract_text_from_pdf(file_bytes, strict_crop=strict_crop)
        if not title:
            title = file.filename or "Uploaded File"

    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="No text or file provided")

    content = f"Title: {title}\nText: {text}" if title else text
    pico = {"P": pico_p, "I": pico_i, "C": pico_c, "O": pico_o, "S": pico_s, "E": pico_e}
    stage = "level_1" if level == 1 else "level_2"

    try:
        provider = get_ai_provider()
        result = provider.analyze_study(content, pico, stage)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI analysis failed: {str(e)}")

    return ScreeningResultOut(
        decision=result.ScreeningDecision,
        confidence=result.Confidence_Score,
        reason=result.Reasoning_Summary,
        p_check=result.ReasoningLog.Population_Check,
        i_check=result.ReasoningLog.Intervention_Check,
        c_check=result.ReasoningLog.Comparator_Check,
        o_check=result.ReasoningLog.Outcome_Check,
        s_check=result.ReasoningLog.StudyDesign_Check,
        e_check=result.ReasoningLog.Exclusion_Check,
        p_reas=result.ReasoningLog.Population_Reason,
        i_reas=result.ReasoningLog.Intervention_Reason,
        c_reas=result.ReasoningLog.Comparator_Reason,
        o_reas=result.ReasoningLog.Outcome_Reason,
        s_reas=result.ReasoningLog.StudyDesign_Reason,
        e_reas=result.ReasoningLog.Exclusion_Reason,
    )


def _build_result_dict(title: str, result, abstract: str = "") -> dict:
    """Helper to build a result dict from an AI screening result."""
    return {
        "title": title,
        "abstract": abstract,
        "decision": result.ScreeningDecision,
        "confidence": result.Confidence_Score,
        "reason": result.Reasoning_Summary,
        "p_check": result.ReasoningLog.Population_Check,
        "i_check": result.ReasoningLog.Intervention_Check,
        "c_check": result.ReasoningLog.Comparator_Check,
        "o_check": result.ReasoningLog.Outcome_Check,
        "s_check": result.ReasoningLog.StudyDesign_Check,
        "e_check": result.ReasoningLog.Exclusion_Check,
        "p_reas": result.ReasoningLog.Population_Reason,
        "i_reas": result.ReasoningLog.Intervention_Reason,
        "c_reas": result.ReasoningLog.Comparator_Reason,
        "o_reas": result.ReasoningLog.Outcome_Reason,
        "s_reas": result.ReasoningLog.StudyDesign_Reason,
        "e_reas": result.ReasoningLog.Exclusion_Reason,
    }


@router.post("/analyze/batch")
async def analyze_batch(
    level: int = Form(1),
    pico_p: str = Form(""),
    pico_i: str = Form(""),
    pico_c: str = Form(""),
    pico_o: str = Form(""),
    pico_s: str = Form(""),
    pico_e: str = Form(""),
    files: list[UploadFile] = File(...),
    user: dict = Depends(get_current_user),
):
    """Batch analyze multiple PDF files."""
    pico = {"P": pico_p, "I": pico_i, "C": pico_c, "O": pico_o, "S": pico_s, "E": pico_e}
    stage = "level_1" if level == 1 else "level_2"
    provider = get_ai_provider()

    results = []
    errors = []

    for f in files:
        try:
            file_bytes = await f.read()
            strict_crop = level == 1
            text = extract_text_from_pdf(file_bytes, strict_crop=strict_crop)
            title = f.filename or "Unknown"
            content = f"Title: {title}\nText: {text}"
            result = provider.analyze_study(content, pico, stage)
            results.append(_build_result_dict(title, result))
        except Exception as e:
            errors.append({"title": f.filename or "Unknown", "error": str(e)})

    return {"processed": len(results), "failed": len(errors), "results": results, "errors": errors}


@router.post("/analyze/batch-csv")
async def analyze_batch_csv(
    level: int = Form(1),
    pico_p: str = Form(""),
    pico_i: str = Form(""),
    pico_c: str = Form(""),
    pico_o: str = Form(""),
    pico_s: str = Form(""),
    pico_e: str = Form(""),
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    """Batch analyze a CSV file (for Level 1 abstract screening)."""
    import pandas as pd

    pico = {"P": pico_p, "I": pico_i, "C": pico_c, "O": pico_o, "S": pico_s, "E": pico_e}
    stage = "level_1" if level == 1 else "level_2"
    provider = get_ai_provider()

    content_bytes = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content_bytes))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {e}")

    if df.empty:
        raise HTTPException(status_code=400, detail="CSV file is empty")

    results = []
    errors = []

    for _, row in df.iterrows():
        try:
            title_key = next((k for k in row.index if k.lower() in ["title", "study title", "name"]), None)
            abstract_key = next((k for k in row.index if k.lower() in ["abstract", "summary", "text", "description"]), None)

            if not title_key:
                title_key = row.index[0]
            if not abstract_key:
                abstract_key = row.index[1] if len(row.index) > 1 else title_key

            title = str(row[title_key])
            abstract = str(row[abstract_key])
            text = f"{title}\n{abstract}"

            result = provider.analyze_study(text, pico, stage)
            results.append(_build_result_dict(title, result, abstract))
        except Exception as e:
            errors.append({"title": str(row.iloc[0]) if len(row) > 0 else "Unknown", "error": str(e)})

    return {"processed": len(results), "failed": len(errors), "results": results, "errors": errors}
