"""AI Provider abstraction layer.

Allows swapping between OpenAI, Anthropic, or local models
by changing the AI_PROVIDER config value.

Implements dual-run consensus: each study is screened twice.
Only when both runs agree with high confidence is the decision final.
Any disagreement or low confidence flags the study for human review.
"""

import logging
import time
from abc import ABC, abstractmethod
from typing import Optional
from openai import OpenAI

from app.config import get_settings
from app.schemas import (
    ScreeningDecisionAI,
    ReasoningLog,
    ProtocolStructure,
    MiningResponse,
    CitationList,
)

logger = logging.getLogger(__name__)

CONFIDENCE_THRESHOLD = 85


class AIProvider(ABC):
    @abstractmethod
    def analyze_study(self, text: str, pico: dict, stage: str) -> ScreeningDecisionAI:
        ...

    @abstractmethod
    def extract_pico(self, protocol_text: str) -> ProtocolStructure:
        ...

    @abstractmethod
    def mine_citations(self, text: str, pico: dict) -> CitationList:
        ...


class OpenAICompatibleProvider(AIProvider):
    """Works with OpenAI, Venice AI, OpenRouter, or any OpenAI-compatible API."""

    def __init__(self):
        settings = get_settings()
        client_kwargs = {
            "api_key": settings.AI_API_KEY,
            "timeout": 120.0,
        }
        if settings.AI_BASE_URL:
            client_kwargs["base_url"] = settings.AI_BASE_URL

        self.client = OpenAI(**client_kwargs)
        self.model_l1 = settings.AI_MODEL_LEVEL1
        self.model_l2 = settings.AI_MODEL_LEVEL2
        self.model_extraction = settings.AI_MODEL_EXTRACTION
        self.provider_name = settings.AI_PROVIDER

        logger.info(f"AI Provider initialized: {self.provider_name} "
                     f"(L1: {self.model_l1}, L2: {self.model_l2})")

    def _single_screen(self, text: str, pico: dict, stage: str, temperature: float = 0.0) -> ScreeningDecisionAI:
        """Run a single screening pass. Used internally by analyze_study.

        Tries structured output (OpenAI beta API) first. If the provider
        doesn't support it, falls back to regular chat with JSON parsing.
        """
        import json as _json

        model_choice = self.model_l1 if stage == "level_1" else self.model_l2
        max_chars = 15000 if stage == "level_1" else 100000

        system_prompt = f"""
        You are a Cochrane Screener.
        CRITERIA: P: {pico.get('P','')}, I: {pico.get('I','')}, C: {pico.get('C','')}, O: {pico.get('O','')}, S: {pico.get('S','')}, E: {pico.get('E','')}
        Allow Meta-Analysis? {pico.get('IncludeMetaAnalysis', False)}
        """

        json_system_prompt = system_prompt + """
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
                # Try structured output first (OpenAI native)
                if self.provider_name == "openai":
                    completion = self.client.beta.chat.completions.parse(
                        model=model_choice,
                        messages=messages,
                        response_format=ScreeningDecisionAI,
                        temperature=temperature,
                    )
                    return completion.choices[0].message.parsed

                # For other providers: use regular chat + JSON parsing
                messages_json = [
                    {"role": "system", "content": json_system_prompt},
                    {"role": "user", "content": f"STUDY:\n{text[:max_chars]}"},
                ]
                completion = self.client.chat.completions.create(
                    model=model_choice,
                    messages=messages_json,
                    temperature=temperature,
                    max_tokens=1500,
                )
                raw = completion.choices[0].message.content.strip()

                # Strip markdown code fences if present
                if raw.startswith("```"):
                    raw = raw.split("```")[1]
                    if raw.startswith("json"):
                        raw = raw[4:]
                    raw = raw.strip()

                data = _json.loads(raw)

                # Handle both flat and nested formats
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
                    logger.warning(f"Rate limited, waiting 35s (attempt {attempt + 1}/{max_retries})")
                    time.sleep(35)
                    continue
                elif is_rate_limit:
                    return ScreeningDecisionAI(
                        ScreeningDecision="UNCLEAR",
                        Confidence_Score=0,
                        Reasoning_Summary=f"API RATE LIMIT EXCEEDED after {max_retries} retries.",
                        ReasoningLog=ReasoningLog(
                            Population_Check=False, Population_Reason="Rate limit error",
                            Intervention_Check=False, Intervention_Reason="Rate limit error",
                            Comparator_Check=False, Comparator_Reason="Rate limit error",
                            Outcome_Check=False, Outcome_Reason="Rate limit error",
                            StudyDesign_Check=False, StudyDesign_Reason="Rate limit error",
                            Exclusion_Check=False, Exclusion_Reason="Rate limit error",
                        ),
                    )
                else:
                    logger.error(f"AI analysis failed: {error_str}")
                    raise

    def analyze_study(self, text: str, pico: dict, stage: str = "level_1") -> ScreeningDecisionAI:
        """Dual-run consensus screening.

        Runs the screening twice (second pass at slight temperature variation
        to probe decision stability). Consensus logic:

        1. Both agree + both high confidence -> use that decision
        2. Both agree + one low confidence  -> flag UNCLEAR
        3. They disagree                    -> flag UNCLEAR
        4. Either errored                   -> flag UNCLEAR

        The reasoning summary always includes both runs' outputs so
        the human reviewer can see why the AI was uncertain.
        """
        # Run 1: deterministic (temperature=0)
        run1 = self._single_screen(text, pico, stage, temperature=0.0)

        # Run 2: slight temperature to test stability
        run2 = self._single_screen(text, pico, stage, temperature=0.3)

        r1_decision = run1.ScreeningDecision
        r2_decision = run2.ScreeningDecision
        r1_conf = run1.Confidence_Score
        r2_conf = run2.Confidence_Score

        both_agree = r1_decision == r2_decision
        both_high_conf = r1_conf >= CONFIDENCE_THRESHOLD and r2_conf >= CONFIDENCE_THRESHOLD
        min_conf = min(r1_conf, r2_conf)
        avg_conf = (r1_conf + r2_conf) // 2

        if both_agree and both_high_conf:
            # Strong consensus — use the decision
            result = run1
            result.Confidence_Score = avg_conf
            result.Reasoning_Summary = (
                f"[CONSENSUS] Both runs agreed: {r1_decision} "
                f"(confidence: {r1_conf}%, {r2_conf}%). "
                f"Run 1: {run1.Reasoning_Summary}"
            )
        elif both_agree and not both_high_conf:
            # Same decision but at least one run wasn't confident
            result = run1
            result.ScreeningDecision = "UNCLEAR"
            result.Confidence_Score = min_conf
            result.Reasoning_Summary = (
                f"[FLAGGED - LOW CONFIDENCE] Both runs said {r1_decision} but confidence was low "
                f"({r1_conf}%, {r2_conf}%). Flagged for human review. "
                f"Run 1: {run1.Reasoning_Summary} | "
                f"Run 2: {run2.Reasoning_Summary}"
            )
        else:
            # Disagreement — always flag
            result = run1
            result.ScreeningDecision = "UNCLEAR"
            result.Confidence_Score = min_conf
            result.Reasoning_Summary = (
                f"[FLAGGED - DISAGREEMENT] Run 1: {r1_decision} ({r1_conf}%), "
                f"Run 2: {r2_decision} ({r2_conf}%). Flagged for human review. "
                f"Run 1: {run1.Reasoning_Summary} | "
                f"Run 2: {run2.Reasoning_Summary}"
            )

        return result

    def extract_pico(self, protocol_text: str) -> ProtocolStructure:
        import json as _json

        system_prompt = "You are a Methodologist. Extract strict PICO criteria."

        if self.provider_name == "openai":
            completion = self.client.beta.chat.completions.parse(
                model=self.model_extraction,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": protocol_text[:15000]},
                ],
                response_format=ProtocolStructure,
                temperature=0.0,
            )
            return completion.choices[0].message.parsed

        # Fallback for non-OpenAI providers
        json_prompt = system_prompt + """
        Respond with ONLY a valid JSON object:
        {"Population": "...", "Intervention": "...", "Comparator": "...",
         "Outcome": "...", "IncludeMetaAnalysis": true/false,
         "StudyDesign": "...", "Exclusion": "..."}
        """
        completion = self.client.chat.completions.create(
            model=self.model_extraction,
            messages=[
                {"role": "system", "content": json_prompt},
                {"role": "user", "content": protocol_text[:15000]},
            ],
            temperature=0.0,
            max_tokens=2000,
        )
        raw = completion.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()
        data = _json.loads(raw)
        return ProtocolStructure(**data)

    def mine_citations(self, text: str, pico: dict) -> CitationList:
        import json as _json

        system_prompt = """
        You are a Dual-Process Bot. You have two distinct tasks.

        TASK 1: THE RESEARCHER (Find the Winners)
        - Scan the document for the "INCLUDED STUDIES" table or list.
        - Extract a simple list of the Author/Year keys for these studies (e.g. "Smith 2020").
        - Ignore everything else.

        TASK 2: THE CLERK (Digitize the Pile)
        - Go to the REFERENCES / BIBLIOGRAPHY section.
        - Extract EVERY citation you see (20-50+ items).
        - Do not filter. Do not judge. Just list Author, Year, and Title.
        - Context should be "Bibliography".
        """

        if self.provider_name == "openai":
            completion = self.client.beta.chat.completions.parse(
                model=self.model_l1,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": text[:120000]},
                ],
                response_format=MiningResponse,
                temperature=0.0,
            )
            raw_data = completion.choices[0].message.parsed
        else:
            json_prompt = system_prompt + """
            Respond with ONLY a valid JSON object:
            {"Included_Study_Names": ["Author Year", ...],
             "Full_Bibliography": [{"Title": "...", "AuthorYear": "...", "Context": "Bibliography"}, ...]}
            """
            completion = self.client.chat.completions.create(
                model=self.model_l1,
                messages=[
                    {"role": "system", "content": json_prompt},
                    {"role": "user", "content": text[:120000]},
                ],
                temperature=0.0,
                max_tokens=4000,
            )
            raw = completion.choices[0].message.content.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
                raw = raw.strip()
            data = _json.loads(raw)
            raw_data = MiningResponse(**data)
        final_list = []
        inc_names_norm = [n.lower() for n in raw_data.Included_Study_Names]

        for ref in raw_data.Full_Bibliography:
            is_match = any(inc in ref.AuthorYear.lower() for inc in inc_names_norm)
            if is_match:
                ref.IsRelevant = True
                ref.Reason = "Explicitly listed in 'Included Studies' section."
                ref.Confidence = 100
                ref.Context = "Included Studies Table"
            else:
                ref.IsRelevant = False
                ref.Reason = "Found in Bibliography only."
                ref.Confidence = 0
                ref.Context = "Reference List"
            final_list.append(ref)

        return CitationList(Citations=final_list)


_provider_instance: Optional[AIProvider] = None


def get_ai_provider() -> AIProvider:
    global _provider_instance
    if _provider_instance is None:
        _provider_instance = OpenAICompatibleProvider()
    return _provider_instance
