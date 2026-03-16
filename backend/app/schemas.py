from pydantic import BaseModel, Field
from typing import Literal


# --- AI Response Models (preserved from original audit_engine.py) ---
class ReasoningLog(BaseModel):
    Population_Check: bool = Field(description="Strictly meets Population criteria?")
    Population_Reason: str = Field(description="Reason for P check.")
    Intervention_Check: bool = Field(description="Strictly meets Intervention criteria?")
    Intervention_Reason: str = Field(description="Reason for I check.")
    Comparator_Check: bool = Field(description="Strictly meets Comparator criteria?")
    Comparator_Reason: str = Field(description="Reason for C check.")
    Outcome_Check: bool = Field(description="Strictly meets Outcome criteria?")
    Outcome_Reason: str = Field(description="Reason for O check.")
    StudyDesign_Check: bool = Field(description="Strictly meets Study Design criteria?")
    StudyDesign_Reason: str = Field(description="Reason for S check.")
    Exclusion_Check: bool = Field(description="Violates Exclusion Criteria? (True = Exclude)")
    Exclusion_Reason: str = Field(description="Which rule was violated?")


class ScreeningDecisionAI(BaseModel):
    ScreeningDecision: Literal["INCLUDE", "EXCLUDE", "UNCLEAR"]
    Confidence_Score: int
    Reasoning_Summary: str
    ReasoningLog: ReasoningLog


class ProtocolStructure(BaseModel):
    Population: str = Field(description="The specific population defined.")
    Intervention: str = Field(description="The intervention being studied.")
    Comparator: str = Field(description="The comparator/control.")
    Outcome: str = Field(description="Primary outcomes.")
    IncludeMetaAnalysis: bool = Field(description="Does the protocol explicitly allow including Systematic Reviews?")
    StudyDesign: str = Field(description="Required study design.")
    Exclusion: str = Field(description="Exclusion criteria.")


class CitationItem(BaseModel):
    Title: str = Field(description="Title of the study.")
    AuthorYear: str = Field(description="First author and Year.")
    Context: str = Field(description="Section found.")
    IsRelevant: bool = False
    Confidence: int = 0
    Reason: str = ""


class MiningResponse(BaseModel):
    Included_Study_Names: list[str] = Field(description="Author/Year keys from 'Included Studies' table.")
    Full_Bibliography: list[CitationItem] = Field(description="All citations from References.")


class CitationList(BaseModel):
    Citations: list[CitationItem]


# --- API Request/Response Models ---
class ScreenRequest(BaseModel):
    title: str = ""
    text: str = ""
    level: int = 1


class ExtractPicoRequest(BaseModel):
    text: str


class ScreeningResultOut(BaseModel):
    decision: str
    confidence: int
    reason: str
    p_check: bool
    i_check: bool
    c_check: bool
    o_check: bool
    s_check: bool
    e_check: bool
    p_reas: str
    i_reas: str
    c_reas: str
    o_reas: str
    s_reas: str
    e_reas: str
