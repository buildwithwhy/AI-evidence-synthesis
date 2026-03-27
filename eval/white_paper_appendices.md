# White Paper Appendices

From: *Deference-Aware Evaluation for Human-in-the-Loop AI Systems: A Unified Quality Signal for AI Systems Operating Under Human Oversight*
Yuyu Shen | KalliDao Research | March 2026 | CC BY 4.0

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

The `{P}`, `{I}`, `{C}`, `{O}`, `{S}`, and `{E}` placeholders are populated from the review protocol for each evaluation. The study's title and abstract are appended as user content:

```
STUDY:
Title: {title}
Abstract: {abstract}
```

### A.1 Key Design Decisions

**Three-way classification.** The prompt explicitly offers INCLUDE, EXCLUDE, and UNCLEAR as options. Most screening tool evaluations force binary classification. Including UNCLEAR measures whether models can express genuine uncertainty rather than being forced to guess — this is the core design choice that enables DA evaluation. The JSON output uses UNCLEAR as the field value; throughout the main paper this state is referred to as UNSURE for conceptual clarity, as noted in Section 3.2.

**Confidence scoring.** The model outputs an integer confidence score (0–100). In the production system, studies where the model reports confidence below the threshold (default 85%) are reclassified as UNCLEAR regardless of the model's stated decision. This threshold is tunable. Notably, some models — particularly Claude Sonnet 4.6 — also output UNCLEAR on their own initiative with low confidence scores, indicating the model itself judged the case as genuinely ambiguous. This self-initiated deference was observed in both Tier 1 (40% deferral) and Tier 2 (23.3% deferral) evaluations.

**PICO-structured reasoning.** The model outputs individual boolean checks for each PICO criterion. This serves two purposes: it provides an explainable audit trail for human reviewers examining deferred studies, and it forces the model to consider each criterion separately rather than making a holistic judgment that might skip relevant factors.

**JSON output format.** All models receive the same prompt requesting JSON output. Models that support structured output (OpenAI via `response_format`) use it; all others parse the JSON from the model's text response with fallback handling for markdown code fences. This ensures consistent evaluation across providers while accommodating different API capabilities.

**Temperature settings.** Single-run evaluations (Tier 1, Tier 2) use temperature=0 for deterministic output. Same-model dual-run (Tier 3a) uses temperature=0 for Run 1 and temperature=0.3 for Run 2 to probe decision stability. Mixed-model consensus (Tier 3b) uses temperature=0 for both models.

### A.2 Example: Donners et al. 2021 PICO Criteria

For the primary evaluation dataset, the PICO criteria were extracted directly from the published systematic review (Donners et al., *Clinical Pharmacokinetics*, 2021; [PMC8585815](https://pmc.ncbi.nlm.nih.gov/articles/PMC8585815/)).

| Criterion | Value |
|-----------|-------|
| Population (P) | Humans (healthy volunteers or people with hemophilia A) |
| Intervention (I) | Emicizumab (bispecific antibody mimicking factor VIII) |
| Comparator (C) | Not required (any comparator or no comparator accepted) |
| Outcome (O) | Original pharmacokinetic (PK) data, modeled PK data, or PK/pharmacodynamic (PD) relationships |
| Study Design (S) | Any study design providing original PK data (clinical trials, pharmacometric analyses, case reports) |
| Exclusion (E) | Non-human studies; studies without PK or PK/PD data; non-English language; abstract or full text not accessible; duplicate reports of the same subject population |


## Appendix B: Dataset Characteristics

Table B1 provides summary statistics for the evaluation datasets used in this paper. Inclusion rates below 10% are characteristic of abstract screening in systematic reviews; methods that report only accuracy rather than sensitivity/recall and specificity are uninformative at these prevalence levels and should be disregarded.

### Table B1: Evaluation Dataset Summary

| Dataset | Review | Domain | Total Studies | Included | Excluded | Inclusion Rate | Avg Abstract Length | PICO Source | Complete Set |
|---------|--------|--------|:---:|:---:|:---:|:---:|:---:|--------|:---:|
| **Tier 1** | Donners et al. 2021 | Human pharmacology | 10 | 5 | 5 | 50.0%† | — | Published paper | Sampled |
| **Tier 2 (evaluated)** | Donners et al. 2021 | Human pharmacology | 258* | 15 | 243 | 5.8% | 2,243 ch | Published paper | Yes |
| Tier 2 (prepared) | Sep et al. 2021 | Preclinical / rodent behaviour | 271 | 40 | 231 | 14.8% | 1,569 ch | Published paper | Yes |
| Tier 2 (prepared) | Meijboom et al. 2021 | Clinical biosimilars | 882 | 37 | 845 | 4.2% | 1,642 ch | Published paper | Yes |
| **Tier 2 total** | 3 reviews | Mixed | **1,411** | **92** | **1,319** | **6.5%** | 1,758 ch | All verified | Yes |

† Tier 1 is deliberately balanced (5 include, 5 exclude) for smoke testing. It is not representative of real screening ratios.

\* Of 258 Donners studies, 250 had title and abstract; 8 had title only. All 258 were evaluated at Level 1 (title/abstract screening). The 8 title-only studies did not affect headline DA metrics — see Section 5.3 footnote.

### Table B2: Dataset Provenance

| Review | Published Paper DOI | PICO Verification | Data Source | License |
|--------|-------------------|--------------------|-------------|---------|
| Donners et al. 2021 | [10.1007/s40262-021-01042-w](https://doi.org/10.1007/s40262-021-01042-w) | Extracted from Methods section ([PMC8585815](https://pmc.ncbi.nlm.nih.gov/articles/PMC8585815/)) | SYNERGY dataset | CC0 |
| Sep et al. 2021 | [10.1371/journal.pone.0249102](https://doi.org/10.1371/journal.pone.0249102) | Extracted from Methods section ([PMC8284613](https://pmc.ncbi.nlm.nih.gov/articles/PMC8284613/)) | SYNERGY dataset | CC0 |
| Meijboom et al. 2021 | [10.1007/s40259-021-00508-4](https://doi.org/10.1007/s40259-021-00508-4) | Extracted from Methods section ([PMC8847209](https://pmc.ncbi.nlm.nih.gov/articles/PMC8847209/)) | SYNERGY dataset | CC0 |

### B.1 Screening Level and Scope

All evaluations in this paper are **Level 1 (title and abstract) screening** — the standard first-pass screening stage in systematic review methodology and the primary bottleneck in review production. This is what the SYNERGY dataset supports: it provides titles and abstracts but not full texts.

**The sensitivity-first norm at L1.** The systematic review literature prioritises sensitivity at Level 1 because missing a relevant study at the abstract stage is irrecoverable — the study is lost from the review entirely. This norm is well-established. The consequence is that existing tools chronically sacrifice specificity to maximise sensitivity: a model that over-includes is considered safer than one that over-excludes, because false positives can be caught at Level 2 but false negatives cannot.

**DA evaluation dissolves rather than manages this trade-off.** The high-sensitivity/low-specificity failure mode is a symptom of forced-binary evaluation, not a fundamental property of the screening task. When the AI can express uncertainty (UNSURE), it exits the sensitivity/specificity trade-off on uncertain cases entirely — deferring them to a human rather than being forced to sacrifice one metric for the other. Claude achieves 100% DA sensitivity *and* 98.8% DA specificity at L1. This is not despite the L1 norm but as a direct consequence of the DA framework applied at L1.

**Level 2 (full-text) screening was not evaluated.** In Cochrane methodology, studies that pass Level 1 screening proceed to Level 2 where the full paper is read to confirm PICO eligibility. The SYNERGY ground truth labels reflect the final inclusion decision after full-text review, applied retrospectively to title/abstract data — meaning L1 evaluation against these labels is conservative (some studies that are ambiguous at abstract level would become clear at full text). Full-text evaluation is feasible (DOIs are available for 99% of studies in the dataset) and is planned for future work using the Chan et al. Cochrane dataset's three-level labels.

**Studies without abstracts.** 8 of 258 studies (3.1%) in the Donners et al. 2021 dataset had no abstract indexed in the SYNERGY source data. These were screened on title only — less information than the standard Level 1 case. Of these 8, one was an included study, which Claude correctly deferred rather than guessing. Excluding these 8 studies does not materially change any reported metric (DA sensitivity remains 100%, confident errors remain 3).

### B.2 Notes on Dataset Selection

**Why one review for current results.** The results presented in this paper use only the Donners et al. 2021 dataset (258 studies, 15 included, 243 excluded). We prioritised having one review with PICO criteria verified directly from the published paper over evaluating on more reviews with approximated or generic criteria. Our initial evaluation attempt using AI-approximated PICO criteria produced significantly incorrect criteria for two of three reviews (e.g., a rodent behavioural study was mislabelled as a PTSD treatment trial), which would have invalidated the evaluation entirely. We therefore adopted a policy of only evaluating on reviews where the PICO criteria have been manually verified against the source publication.

**Why SYNERGY and not Cohen et al. or Chan et al.** The SYNERGY dataset provides complete screening sets (all studies that were screened, not just included ones) with OpenAlex identifiers linking to abstracts, and is released under a CC0 licence. The Cohen et al. drug review dataset provides 9-category exclusion reasons but lacks abstracts. The Chan et al. Cochrane dataset (544K studies, 8,608 reviews) provides three-level labels and review protocols but requires additional processing to extract structured PICO criteria. Both are planned for future evaluation.

**Inclusion rate context.** The 5.8% inclusion rate for Donners et al. 2021 is typical of systematic review screening. At these prevalence levels, a model that excludes every study would achieve approximately 94% accuracy. This is why we report sensitivity/recall, specificity, and precision rather than accuracy — accuracy is uninformative when classes are severely imbalanced.
