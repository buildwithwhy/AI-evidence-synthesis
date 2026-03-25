"""Screening engine: configurable consensus strategies for study screening.

Supports three strategies:
- single: One model, one pass (fastest, cheapest)
- same_model_dual: One model, two passes (temp=0 and temp=0.3)
- mixed_model: Two different models, one pass each (complementary strengths)

Models are selected from the model registry and can be overridden per-call.
"""

import json
import logging
import time
from enum import Enum
from typing import Optional
from dataclasses import dataclass
from openai import OpenAI

from app.schemas import ScreeningDecisionAI, ReasoningLog
from app.services.model_registry import ModelConfig, get_model

logger = logging.getLogger(__name__)

CONFIDENCE_THRESHOLD = 85


class ConsensusStrategy(str, Enum):
    SINGLE = "single"
    SAME_MODEL_DUAL = "same_model_dual"
    MIXED_MODEL = "mixed_model"


# Default model assignments (can be overridden per-call)
DEFAULT_STRATEGIES = {
    "free": {
        "strategy": ConsensusStrategy.MIXED_MODEL,
        "model_a": "llama-3.3-70b",   # High sensitivity
        "model_b": "deepseek-v3",      # High specificity
    },
    "institutional": {
        "strategy": ConsensusStrategy.SAME_MODEL_DUAL,
        "model_a": "claude-sonnet-4.6",
        "model_b": "claude-sonnet-4.6",
    },
}


def _create_client(config: ModelConfig) -> OpenAI:
    """Create an OpenAI-compatible client from a model config."""
    kwargs = {
        "api_key": config.get_api_key() or "dummy",
        "timeout": 120.0,
    }
    base_url = config.get_base_url()
    if base_url:
        kwargs["base_url"] = base_url
    return OpenAI(**kwargs)


def _single_screen(
    client: OpenAI,
    model_id: str,
    text: str,
    pico: dict,
    stage: str = "level_1",
    temperature: float = 0.0,
    provider: str = "openrouter",
) -> ScreeningDecisionAI:
    """Run a single screening pass against one model."""
    max_chars = 15000 if stage == "level_1" else 100000

    system_prompt = f"""
    You are a Cochrane Screener.
    CRITERIA: P: {pico.get('P','')}, I: {pico.get('I','')}, C: {pico.get('C','')}, O: {pico.get('O','')}, S: {pico.get('S','')}, E: {pico.get('E','')}
    Allow Meta-Analysis? {pico.get('IncludeMetaAnalysis', False)}
    """

    # For non-OpenAI providers, add JSON instructions to prompt
    if provider != "openai":
        system_prompt += """
    You MUST respond with ONLY a valid JSON object (no markdown, no extra text):
    {
      "ScreeningDecision": "INCLUDE" or "EXCLUDE" or "UNCLEAR",
      "Confidence_Score": <integer 0-100>,
      "Reasoning_Summary": "<brief explanation>",
      "ReasoningLog": {
        "Population_Check": true/false, "Population_Reason": "...",
        "Intervention_Check": true/false, "Intervention_Reason": "...",
        "Comparator_Check": true/false, "Comparator_Reason": "...",
        "Outcome_Check": true/false, "Outcome_Reason": "...",
        "StudyDesign_Check": true/false, "StudyDesign_Reason": "...",
        "Exclusion_Check": true/false, "Exclusion_Reason": "..."
      }
    }
    """

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"STUDY:\n{text[:max_chars]}"},
    ]

    max_retries = 3
    for attempt in range(max_retries):
        try:
            if provider == "openai":
                completion = client.beta.chat.completions.parse(
                    model=model_id,
                    messages=messages,
                    response_format=ScreeningDecisionAI,
                    temperature=temperature,
                )
                return completion.choices[0].message.parsed
            else:
                completion = client.chat.completions.create(
                    model=model_id,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=1500,
                )
                raw = completion.choices[0].message.content.strip()
                if raw.startswith("```"):
                    raw = raw.split("```")[1]
                    if raw.startswith("json"):
                        raw = raw[4:]
                    raw = raw.strip()
                data = json.loads(raw)

                reasoning_data = data.get("ReasoningLog", data)
                reasoning = ReasoningLog(
                    Population_Check=bool(reasoning_data.get("Population_Check", False)),
                    Population_Reason=str(reasoning_data.get("Population_Reason", "")),
                    Intervention_Check=bool(reasoning_data.get("Intervention_Check", False)),
                    Intervention_Reason=str(reasoning_data.get("Intervention_Reason", "")),
                    Comparator_Check=bool(reasoning_data.get("Comparator_Check", False)),
                    Comparator_Reason=str(reasoning_data.get("Comparator_Reason", "")),
                    Outcome_Check=bool(reasoning_data.get("Outcome_Check", False)),
                    Outcome_Reason=str(reasoning_data.get("Outcome_Reason", "")),
                    StudyDesign_Check=bool(reasoning_data.get("StudyDesign_Check", False)),
                    StudyDesign_Reason=str(reasoning_data.get("StudyDesign_Reason", "")),
                    Exclusion_Check=bool(reasoning_data.get("Exclusion_Check", False)),
                    Exclusion_Reason=str(reasoning_data.get("Exclusion_Reason", "")),
                )
                return ScreeningDecisionAI(
                    ScreeningDecision=data.get("ScreeningDecision", "UNCLEAR"),
                    Confidence_Score=int(data.get("Confidence_Score", 0)),
                    Reasoning_Summary=str(data.get("Reasoning_Summary", "")),
                    ReasoningLog=reasoning,
                )

        except Exception as e:
            error_str = str(e)
            is_rate_limit = "429" in error_str or "rate limit" in error_str.lower()
            if is_rate_limit and attempt < max_retries - 1:
                logger.warning(f"Rate limited, waiting 35s (attempt {attempt + 1})")
                time.sleep(35)
                continue
            elif is_rate_limit:
                return _error_result("API rate limit exceeded")
            else:
                logger.error(f"Screening failed: {error_str}")
                raise


def _error_result(reason: str) -> ScreeningDecisionAI:
    return ScreeningDecisionAI(
        ScreeningDecision="UNCLEAR",
        Confidence_Score=0,
        Reasoning_Summary=f"Error: {reason}",
        ReasoningLog=ReasoningLog(
            Population_Check=False, Population_Reason="Error",
            Intervention_Check=False, Intervention_Reason="Error",
            Comparator_Check=False, Comparator_Reason="Error",
            Outcome_Check=False, Outcome_Reason="Error",
            StudyDesign_Check=False, StudyDesign_Reason="Error",
            Exclusion_Check=False, Exclusion_Reason="Error",
        ),
    )


def _apply_consensus(
    run1: ScreeningDecisionAI,
    run2: ScreeningDecisionAI,
    label_a: str = "Run 1",
    label_b: str = "Run 2",
) -> ScreeningDecisionAI:
    """Apply consensus logic between two screening results."""
    r1d = run1.ScreeningDecision
    r2d = run2.ScreeningDecision
    r1c = run1.Confidence_Score
    r2c = run2.Confidence_Score

    both_agree = r1d == r2d
    both_high_conf = r1c >= CONFIDENCE_THRESHOLD and r2c >= CONFIDENCE_THRESHOLD
    min_conf = min(r1c, r2c)
    avg_conf = (r1c + r2c) // 2

    if both_agree and both_high_conf and r1d in ("INCLUDE", "EXCLUDE"):
        result = run1
        result.Confidence_Score = avg_conf
        result.Reasoning_Summary = (
            f"[CONSENSUS] {label_a} and {label_b} agreed: {r1d} "
            f"(confidence: {r1c}%, {r2c}%). "
            f"{label_a}: {run1.Reasoning_Summary}"
        )
    elif both_agree and r1d in ("INCLUDE", "EXCLUDE"):
        result = run1
        result.ScreeningDecision = "UNCLEAR"
        result.Confidence_Score = min_conf
        result.Reasoning_Summary = (
            f"[FLAGGED - LOW CONFIDENCE] Both said {r1d} but confidence low "
            f"({r1c}%, {r2c}%). "
            f"{label_a}: {run1.Reasoning_Summary} | "
            f"{label_b}: {run2.Reasoning_Summary}"
        )
    else:
        result = run1
        result.ScreeningDecision = "UNCLEAR"
        result.Confidence_Score = min_conf
        result.Reasoning_Summary = (
            f"[FLAGGED - DISAGREEMENT] {label_a}: {r1d} ({r1c}%), "
            f"{label_b}: {r2d} ({r2c}%). "
            f"{label_a}: {run1.Reasoning_Summary} | "
            f"{label_b}: {run2.Reasoning_Summary}"
        )

    return result


# ============================================================
# Main screening function
# ============================================================

def screen_study(
    text: str,
    pico: dict,
    stage: str = "level_1",
    strategy: Optional[ConsensusStrategy] = None,
    model_a_name: Optional[str] = None,
    model_b_name: Optional[str] = None,
    tier: str = "free",
) -> ScreeningDecisionAI:
    """Screen a study with configurable strategy and models.

    Args:
        text: Study text (title + abstract)
        pico: PICO criteria dict
        stage: "level_1" or "level_2"
        strategy: Consensus strategy (defaults from tier config)
        model_a_name: Primary model name (from registry)
        model_b_name: Secondary model name (for dual/mixed consensus)
        tier: "free" or "institutional" (determines defaults)

    Returns:
        ScreeningDecisionAI with consensus result
    """
    # Resolve defaults from tier config
    defaults = DEFAULT_STRATEGIES.get(tier, DEFAULT_STRATEGIES["free"])

    if strategy is None:
        strategy = ConsensusStrategy(defaults["strategy"])
    if model_a_name is None:
        model_a_name = defaults["model_a"]
    if model_b_name is None:
        model_b_name = defaults.get("model_b", model_a_name)

    model_a = get_model(model_a_name)
    client_a = _create_client(model_a)

    if strategy == ConsensusStrategy.SINGLE:
        result = _single_screen(
            client_a, model_a.model_id, text, pico, stage,
            temperature=0.0, provider=model_a.provider,
        )
        # Apply confidence threshold
        if result.Confidence_Score < CONFIDENCE_THRESHOLD and result.ScreeningDecision != "UNCLEAR":
            result.ScreeningDecision = "UNCLEAR"
            result.Reasoning_Summary = (
                f"[AUTO-FLAGGED] Confidence {result.Confidence_Score}% < {CONFIDENCE_THRESHOLD}%. "
                f"{result.Reasoning_Summary}"
            )
        return result

    elif strategy == ConsensusStrategy.SAME_MODEL_DUAL:
        run1 = _single_screen(
            client_a, model_a.model_id, text, pico, stage,
            temperature=0.0, provider=model_a.provider,
        )
        run2 = _single_screen(
            client_a, model_a.model_id, text, pico, stage,
            temperature=0.3, provider=model_a.provider,
        )
        return _apply_consensus(run1, run2, f"{model_a.name} (t=0)", f"{model_a.name} (t=0.3)")

    elif strategy == ConsensusStrategy.MIXED_MODEL:
        model_b = get_model(model_b_name)
        client_b = _create_client(model_b) if model_b.name != model_a.name else client_a

        run1 = _single_screen(
            client_a, model_a.model_id, text, pico, stage,
            temperature=0.0, provider=model_a.provider,
        )
        run2 = _single_screen(
            client_b, model_b.model_id, text, pico, stage,
            temperature=0.0, provider=model_b.provider,
        )
        return _apply_consensus(run1, run2, model_a.name, model_b.name)

    else:
        raise ValueError(f"Unknown strategy: {strategy}")
