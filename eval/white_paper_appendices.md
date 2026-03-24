# White Paper Appendices

## Appendix A: Prompt Structure

All models were prompted with a structured template combining the PICO criteria from the review protocol with instructions for three-way classification and confidence scoring. The template below is the production prompt used in all evaluations.

### Prompt Template

```
You are a Cochrane Screener conducting systematic review screening.

INCLUSION CRITERIA:
- Population (P): {P}
- Intervention (I): {I}
- Comparator (C): {C}
- Outcome (O): {O}
- Study Design (S): {S}
- Exclusion Criteria (E): {E}

TASK: Evaluate whether the following study meets the inclusion criteria.

You MUST respond with ONLY a valid JSON object (no markdown, no extra text)
with this exact structure:
{
  "ScreeningDecision": "INCLUDE" or "EXCLUDE" or "UNCLEAR",
  "Confidence_Score": <integer 0-100>,
  "Reasoning_Summary": "<brief explanation>",
  "Population_Check": true/false,
  "Intervention_Check": true/false,
  "Comparator_Check": true/false,
  "Outcome_Check": true/false,
  "StudyDesign_Check": true/false,
  "Exclusion_Check": true/false
}
```

The `{P}`, `{I}`, `{C}`, `{O}`, `{S}`, and `{E}` placeholders are populated from the review protocol for each evaluation. The study's title and abstract are appended as user content in the format:

```
STUDY:
Title: {title}
Abstract: {abstract}
```

### Key Design Decisions

**Three-way classification.** The prompt explicitly offers INCLUDE, EXCLUDE, and UNCLEAR as options. This is itself a design choice — most screening tool evaluations force binary classification. We include UNCLEAR to measure whether models can express genuine uncertainty rather than being forced to guess.

**Confidence scoring.** The model outputs an integer confidence score (0–100). In the production system, studies where the model reports confidence below the threshold (default 85%) are reclassified as UNCLEAR regardless of the model's stated decision. This threshold is a tunable parameter. Notably, some models (particularly Claude Sonnet 4.6) also output UNCLEAR on their own initiative with low confidence scores, indicating the model itself judged the case as ambiguous.

**PICO-structured reasoning.** The model outputs individual boolean checks for each PICO criterion (Population, Intervention, Comparator, Outcome, Study Design, Exclusion). This serves two purposes: (1) it provides an explainable audit trail for human reviewers, and (2) it forces the model to consider each criterion separately rather than making a holistic judgment that might skip relevant factors.

**JSON output format.** All models receive the same prompt requesting JSON output. Models that support structured/constrained output (OpenAI via `response_format`) use it; all others parse the JSON from the model's text response with fallback handling for markdown code fences. This ensures consistent evaluation across providers while accommodating different API capabilities.

**Temperature settings.** Single-run evaluations (Tier 1, Tier 2) use temperature=0 for deterministic output. Dual-run consensus (Tier 3a) uses temperature=0 for Run 1 and temperature=0.3 for Run 2 to probe decision stability.

### Example: Donners et al. 2021

For the primary evaluation dataset (Donners et al. 2021), the PICO criteria populated into the template were:

| Criterion | Value |
|-----------|-------|
| Population (P) | Humans (healthy volunteers or people with hemophilia A) |
| Intervention (I) | Emicizumab (bispecific antibody mimicking factor VIII) |
| Comparator (C) | Not required (any comparator or no comparator accepted) |
| Outcome (O) | Original pharmacokinetic (PK) data, modeled PK data, or PK/pharmacodynamic (PD) relationships |
| Study Design (S) | Any study design providing original PK data (clinical trials, pharmacometric analyses, case reports) |
| Exclusion (E) | Non-human studies; studies without PK or PK/PD data; non-English language; abstract or full text not accessible; duplicate reports of the same subject population |

These criteria were extracted directly from the published systematic review (Donners et al., *Clinical Pharmacokinetics*, 2021; [PMC8585815](https://pmc.ncbi.nlm.nih.gov/articles/PMC8585815/)).


## Appendix B: Dataset Characteristics

Table B1 provides summary statistics for the evaluation datasets used in this paper. Inclusion rates below 10% are characteristic of abstract screening in systematic reviews; methods that report only accuracy rather than sensitivity/recall and specificity are therefore uninformative at these prevalence levels and should be disregarded.

### Table B1: Evaluation Dataset Summary

| Dataset | Review | Domain | Total Studies | Included | Excluded | Inclusion Rate | Avg Abstract Length | PICO Source | Complete Set |
|---------|--------|--------|:---:|:---:|:---:|:---:|:---:|--------|:---:|
| **Tier 1** | Donners et al. 2021 | Human pharmacology | 10 | 5 | 5 | 50.0%† | — | Published paper | Sampled |
| **Tier 2** | Donners et al. 2021 | Human pharmacology | 250 | 14 | 236 | 5.6% | 2,243 chars | Published paper | Yes |
| Tier 2 (prepared) | Sep et al. 2021 | Preclinical / rodent behaviour | 270 | 40 | 230 | 14.8% | 1,569 chars | Published paper | Yes |
| Tier 2 (prepared) | Meijboom et al. 2021 | Clinical biosimilars | 825 | 36 | 789 | 4.4% | 1,642 chars | Published paper | Yes |
| **Tier 2 total** | 3 reviews | Mixed | **1,345** | **90** | **1,255** | **6.7%** | 1,758 chars | All verified | Yes |

† Tier 1 is deliberately balanced (5 include, 5 exclude) for smoke testing. It is not representative of real screening ratios.

### Table B2: Dataset Provenance

| Review | Published Paper DOI | PICO Verification | Data Source | License |
|--------|-------------------|--------------------|-------------|---------|
| Donners et al. 2021 | [10.1007/s40262-021-01042-w](https://doi.org/10.1007/s40262-021-01042-w) | Extracted from Methods section ([PMC8585815](https://pmc.ncbi.nlm.nih.gov/articles/PMC8585815/)) | SYNERGY dataset | CC0 |
| Sep et al. 2021 | [10.1371/journal.pone.0249102](https://doi.org/10.1371/journal.pone.0249102) | Extracted from Methods section ([PMC8284613](https://pmc.ncbi.nlm.nih.gov/articles/PMC8284613/)) | SYNERGY dataset | CC0 |
| Meijboom et al. 2021 | [10.1007/s40259-021-00508-4](https://doi.org/10.1007/s40259-021-00508-4) | Extracted from Methods section ([PMC8847209](https://pmc.ncbi.nlm.nih.gov/articles/PMC8847209/)) | SYNERGY dataset | CC0 |

### Notes on Dataset Selection

**Why one review for current results.** The results presented in this paper use only the Donners et al. 2021 dataset (258 studies). We prioritised having one review with PICO criteria verified directly from the published paper over evaluating on more reviews with approximated or generic criteria. Our initial evaluation attempt using AI-approximated PICO criteria produced significantly incorrect criteria for two of three reviews (e.g., a rodent behavioural study was mislabeled as a PTSD treatment trial), which would have invalidated the evaluation entirely. We therefore adopted a policy of only evaluating on reviews where the PICO criteria have been manually verified against the source publication.

**Why SYNERGY and not Cohen et al. or Chan et al.** The SYNERGY dataset provides complete screening sets (all studies that were screened, not just included ones) with OpenAlex identifiers linking to abstracts. The Cohen et al. drug review dataset provides 9-category exclusion reasons but lacks abstracts. The Chan et al. Cochrane dataset (544K studies, 8,608 reviews) provides three-level labels and review protocols but requires additional processing to extract structured PICO criteria. Both are planned for future evaluation.

**Inclusion rate context.** The 5.6% inclusion rate for Donners et al. 2021 is typical of systematic review screening. At these prevalence levels, a model that excludes every study would achieve ~94% accuracy. This is why we report sensitivity/recall, specificity, and precision rather than accuracy — accuracy is uninformative when classes are severely imbalanced.
