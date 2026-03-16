"""Prepare evaluation datasets from SYNERGY.

Downloads and converts SYNERGY reviews into CSV files ready for evaluation.
Creates tier-specific samples.
"""

import os
import sys
import pandas as pd
from pathlib import Path

# Add backend to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)

# Reviews selected for each tier based on:
# - Medical domain relevance
# - Reasonable inclusion rates (not too sparse)
# - Diversity of topics

TIER_2_REVIEWS = [
    "Donners_2021",       # 258 studies, 5.8% included — pharmacology
    "Menon_2022",         # 975 studies, 7.6% included — clinical
    "Sep_2021",           # 271 studies, 14.8% included — psychology
    "Meijboom_2021",      # 882 studies, 4.2% included — health
    "Nelson_2002",        # 366 studies, 21.9% included — clinical
]

TIER_1_REVIEW = "Donners_2021"  # Smallest, good include rate for hand-checking


def load_synergy_review(name: str) -> pd.DataFrame:
    """Load a single SYNERGY review as a DataFrame."""
    from synergy_dataset import Dataset

    ds = Dataset(name)
    df = ds.to_frame()
    df = df.reset_index()
    df = df.rename(columns={"openalex_id": "id"})

    # Map labels: 1=INCLUDE, 0=EXCLUDE
    df["ground_truth"] = df["label_included"].map({1: "INCLUDE", 0: "EXCLUDE"})
    df["review"] = name

    return df[["id", "title", "abstract", "ground_truth", "review"]]


def prepare_tier1():
    """Build Tier 1 smoke test: 10 hand-picked studies (5 include, 5 exclude)."""
    print(f"Preparing Tier 1 from {TIER_1_REVIEW}...")
    df = load_synergy_review(TIER_1_REVIEW)

    # Get all included studies
    includes = df[df["ground_truth"] == "INCLUDE"]
    excludes = df[df["ground_truth"] == "EXCLUDE"]

    # Sample 5 includes (or all if fewer) and 5 excludes
    n_inc = min(5, len(includes))
    n_exc = 5
    sample = pd.concat([
        includes.sample(n=n_inc, random_state=42),
        excludes.sample(n=n_exc, random_state=42),
    ])

    out = DATA_DIR / "tier1_smoke_test.csv"
    sample.to_csv(out, index=False)
    print(f"  Saved {len(sample)} studies to {out}")
    print(f"  ({n_inc} INCLUDE, {n_exc} EXCLUDE)")
    return sample


def prepare_tier2():
    """Build Tier 2 core eval: ~500 studies from 5 diverse reviews."""
    print("Preparing Tier 2 from 5 reviews...")
    frames = []

    for name in TIER_2_REVIEWS:
        print(f"  Loading {name}...")
        df = load_synergy_review(name)

        # Include ALL positive studies (they're rare and precious)
        includes = df[df["ground_truth"] == "INCLUDE"]
        excludes = df[df["ground_truth"] == "EXCLUDE"]

        # Sample excludes to get ~100 studies per review
        # Keep all includes, sample enough excludes to reach ~100 total
        target_total = 100
        n_exc_sample = max(target_total - len(includes), 20)
        n_exc_sample = min(n_exc_sample, len(excludes))

        sample = pd.concat([
            includes,
            excludes.sample(n=n_exc_sample, random_state=42),
        ])
        frames.append(sample)

    combined = pd.concat(frames, ignore_index=True)
    out = DATA_DIR / "tier2_core_eval.csv"
    combined.to_csv(out, index=False)

    inc = len(combined[combined["ground_truth"] == "INCLUDE"])
    exc = len(combined[combined["ground_truth"] == "EXCLUDE"])
    print(f"  Saved {len(combined)} studies to {out}")
    print(f"  ({inc} INCLUDE, {exc} EXCLUDE across {len(TIER_2_REVIEWS)} reviews)")
    return combined


def prepare_tier3():
    """Build Tier 3 full benchmark: all studies from all 26 reviews."""
    from synergy_dataset import iter_datasets

    print("Preparing Tier 3 (all SYNERGY reviews)...")
    frames = []
    for ds in iter_datasets():
        print(f"  Loading {ds.name}...")
        df = load_synergy_review(ds.name)
        frames.append(df)

    combined = pd.concat(frames, ignore_index=True)

    # Filter out studies with no abstract (can't screen without text)
    before = len(combined)
    combined = combined[combined["abstract"].notna() & (combined["abstract"].str.strip() != "")]
    after = len(combined)
    print(f"  Filtered {before - after} studies with no abstract")

    out = DATA_DIR / "tier3_full_benchmark.csv"
    combined.to_csv(out, index=False)

    inc = len(combined[combined["ground_truth"] == "INCLUDE"])
    exc = len(combined[combined["ground_truth"] == "EXCLUDE"])
    print(f"  Saved {len(combined)} studies to {out}")
    print(f"  ({inc} INCLUDE, {exc} EXCLUDE across 26 reviews)")
    return combined


def prepare_review_protocols():
    """Save known PICO criteria for SYNERGY reviews.

    SYNERGY doesn't ship structured PICO, so we define them manually
    for the reviews we use in Tier 1 and 2. These are derived from the
    published review protocols.
    """
    protocols = {
        "Donners_2021": {
            "P": "Patients receiving immunosuppressive therapy (e.g., transplant recipients, autoimmune disease patients)",
            "I": "Therapeutic drug monitoring or pharmacokinetic analysis of immunosuppressive drugs",
            "C": "Standard dosing without therapeutic drug monitoring",
            "O": "Drug efficacy, toxicity, graft survival, clinical outcomes",
            "S": "Clinical trials, observational studies, pharmacokinetic studies",
            "E": "Animal studies, in-vitro studies, reviews, editorials, case reports with n<5",
        },
        "Menon_2022": {
            "P": "Adults or children with clinical conditions requiring intervention",
            "I": "Any clinical intervention studied in a systematic review or meta-analysis context",
            "C": "Placebo, standard care, or alternative interventions",
            "O": "Clinical effectiveness outcomes, adverse events, quality of life",
            "S": "Systematic reviews, meta-analyses, randomized controlled trials",
            "E": "Non-systematic reviews, narrative reviews, protocols without results",
        },
        "Sep_2021": {
            "P": "Adults with mental health conditions (depression, anxiety, PTSD)",
            "I": "Psychological interventions, psychotherapy, cognitive behavioral therapy",
            "C": "Waitlist, treatment as usual, placebo, other active treatments",
            "O": "Mental health symptom improvement, remission, quality of life, functioning",
            "S": "Randomized controlled trials, controlled clinical trials",
            "E": "Uncontrolled studies, case studies, qualitative-only studies, animal studies",
        },
        "Meijboom_2021": {
            "P": "Patients with specific health conditions in primary or secondary care",
            "I": "Health interventions, diagnostics, or treatments under review",
            "C": "Standard care, alternative treatments, no treatment",
            "O": "Health outcomes, diagnostic accuracy, treatment effectiveness",
            "S": "Original research studies with empirical data",
            "E": "Editorials, commentaries, letters, conference abstracts without full data",
        },
        "Nelson_2002": {
            "P": "Patients with clinical conditions requiring screening or preventive intervention",
            "I": "Screening tests, preventive treatments, clinical interventions",
            "C": "No screening, standard care, alternative screening methods",
            "O": "Disease detection rates, morbidity, mortality, harms of screening",
            "S": "Randomized controlled trials, cohort studies, diagnostic accuracy studies",
            "E": "Non-English studies, animal studies, modeling studies without clinical data",
        },
    }

    out = DATA_DIR / "review_protocols.json"
    import json
    with open(out, "w") as f:
        json.dump(protocols, f, indent=2)
    print(f"Saved {len(protocols)} review protocols to {out}")
    return protocols


if __name__ == "__main__":
    print("=" * 60)
    print("AI Evidence Synthesis — Evaluation Data Preparation")
    print("=" * 60)
    print()

    prepare_review_protocols()
    print()
    prepare_tier1()
    print()
    prepare_tier2()
    print()

    # Tier 3 is large — only prepare if explicitly requested
    if "--full" in sys.argv:
        prepare_tier3()
    else:
        print("Skipping Tier 3 (pass --full to include). It downloads ~169K studies.")

    print()
    print("Done! Eval data is in eval/data/")
