"""AI Provider abstraction layer.

Allows swapping between OpenAI, Anthropic, or local models
by changing the AI_PROVIDER config value.
"""

import asyncio
import logging
from abc import ABC, abstractmethod
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


class OpenAIProvider(AIProvider):
    def __init__(self):
        settings = get_settings()
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY, timeout=120.0)
        self.model_l1 = settings.AI_MODEL_LEVEL1
        self.model_l2 = settings.AI_MODEL_LEVEL2
        self.model_extraction = settings.AI_MODEL_EXTRACTION

    def analyze_study(self, text: str, pico: dict, stage: str = "level_1") -> ScreeningDecisionAI:
        model_choice = self.model_l1 if stage == "level_1" else self.model_l2
        max_chars = 15000 if stage == "level_1" else 100000

        system_prompt = f"""
        You are a Cochrane Screener.
        CRITERIA: P: {pico.get('P','')}, I: {pico.get('I','')}, C: {pico.get('C','')}, O: {pico.get('O','')}, S: {pico.get('S','')}, E: {pico.get('E','')}
        Allow Meta-Analysis? {pico.get('IncludeMetaAnalysis', False)}
        """

        max_retries = 3
        for attempt in range(max_retries):
            try:
                completion = self.client.beta.chat.completions.parse(
                    model=model_choice,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"STUDY:\n{text[:max_chars]}"},
                    ],
                    response_format=ScreeningDecisionAI,
                    temperature=0.0,
                )
                result = completion.choices[0].message.parsed

                if result.Confidence_Score < 85:
                    result.ScreeningDecision = "UNCLEAR"
                    result.Reasoning_Summary = (
                        f"[AUTO-FLAGGED] Confidence {result.Confidence_Score}% < 85%. "
                        f"AI Reasoning: {result.Reasoning_Summary}"
                    )
                return result

            except Exception as e:
                error_str = str(e)
                is_rate_limit = "429" in error_str or "rate limit" in error_str.lower()

                if is_rate_limit and attempt < max_retries - 1:
                    logger.warning(f"Rate limited, waiting 35s (attempt {attempt + 1}/{max_retries})")
                    # Use asyncio-safe sleep when called from async context
                    import time
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

    def extract_pico(self, protocol_text: str) -> ProtocolStructure:
        system_prompt = "You are a Methodologist. Extract strict PICO criteria."
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

    def mine_citations(self, text: str, pico: dict) -> CitationList:
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


_provider_instance: AIProvider | None = None


def get_ai_provider() -> AIProvider:
    global _provider_instance
    if _provider_instance is None:
        settings = get_settings()
        if settings.AI_PROVIDER == "openai":
            _provider_instance = OpenAIProvider()
        else:
            raise ValueError(f"Unsupported AI provider: {settings.AI_PROVIDER}")
    return _provider_instance
