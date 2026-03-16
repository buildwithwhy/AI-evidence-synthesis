# AI Evidence Synthesis — Evaluation Framework

## Tier 1: Smoke Test (5-10 studies)
Hand-curated studies from a single review with known correct decisions.
Run during development to catch regressions.

## Tier 2: Core Eval (~200-500 studies)
Sampled from 3-5 diverse SYNERGY reviews.
Measures precision, recall, F1, sensitivity, and specificity.

## Tier 3: Full Benchmark (thousands)
All 26 SYNERGY reviews or Chan et al. dataset.
For publishable metrics and marketing claims.

## Running

```bash
# From the repo root, activate the backend venv:
source backend/venv/bin/activate

# Prepare eval datasets (downloads SYNERGY, builds CSVs):
python eval/prepare_data.py

# Run Tier 1 smoke test (no API calls, uses cached results):
python eval/run_eval.py --tier 1

# Run Tier 2 core eval (requires OPENAI_API_KEY in .env):
python eval/run_eval.py --tier 2

# Run Tier 3 full benchmark:
python eval/run_eval.py --tier 3

# Run against a specific review:
python eval/run_eval.py --review Donners_2021
```

## Datasets

- **SYNERGY** (CC0): 26 reviews, 169K records. `pip install synergy-dataset`
- **Chan et al.** (CC BY 4.0): 8,608 reviews, 544K records. Download from Mendeley Data DOI:10.17632/7sgmg89zb6.1
