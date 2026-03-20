"""Prepare evaluation datasets from SYNERGY.

Uses only reviews with:
1. VERIFIED PICO criteria (extracted from the published papers, not approximated)
2. COMPLETE screening sets (all papers that were screened, not sampled)
3. High abstract/DOI availability

Currently verified reviews:
- Donners_2021: Emicizumab pharmacokinetics in hemophilia A (258 studies)
- Sep_2021: Rodent object-in-context memory task (271 studies)
- Meijboom_2021: TNF-alpha biosimilar retransitioning (882 studies)
"""

import json
import os
import sys
import pandas as pd
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)

# Only reviews with verified PICO from published papers and complete screening sets
VERIFIED_REVIEWS = [
    "Donners_2021",    # 258 studies, 15 included — human pharma (PMC8585815)
    "Sep_2021",        # 271 studies, 40 included — preclinical/rodent (PMC8284613)
    "Meijboom_2021",   # 882 studies, 37 included — clinical biosimilars (PMC8847209)
]

TIER_1_REVIEW = "Donners_2021"  # Smallest, good for quick smoke tests


def load_synergy_review(name: str) -> pd.DataFrame:
    """Load a single SYNERGY review as a complete DataFrame."""
    from synergy_dataset import Dataset

    ds = Dataset(name)
    df = ds.to_frame()
    df = df.reset_index()
    df = df.rename(columns={"openalex_id": "id"})

    # Map labels: 1=INCLUDE, 0=EXCLUDE
    df["ground_truth"] = df["label_included"].map({1: "INCLUDE", 0: "EXCLUDE"})
    df["review"] = name

    # Add DOI column for paper access
    return df[["id", "doi", "title", "abstract", "ground_truth", "review"]]


def prepare_tier1():
    """Build Tier 1 smoke test: 10 studies (5 include, 5 exclude) from Donners_2021."""
    print(f"Preparing Tier 1 from {TIER_1_REVIEW}...")
    df = load_synergy_review(TIER_1_REVIEW)

    includes = df[df["ground_truth"] == "INCLUDE"]
    excludes = df[df["ground_truth"] == "EXCLUDE"]

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
    """Build Tier 2 core eval: ALL studies from all 3 verified reviews (complete sets).

    This is the primary evaluation dataset. Every study that was screened
    in each review is included — no sampling. This gives us a realistic
    representation of the inclusion/exclusion ratio that real screening faces.
    """
    print(f"Preparing Tier 2 from {len(VERIFIED_REVIEWS)} verified reviews (COMPLETE SETS)...")
    frames = []

    for name in VERIFIED_REVIEWS:
        print(f"  Loading {name}...")
        df = load_synergy_review(name)

        # Filter out studies missing abstracts (can't screen without text)
        before = len(df)
        df = df[df["abstract"].notna() & (df["abstract"].str.strip() != "")]
        dropped = before - len(df)

        inc = len(df[df["ground_truth"] == "INCLUDE"])
        exc = len(df[df["ground_truth"] == "EXCLUDE"])
        print(f"    {len(df)} studies ({inc} include, {exc} exclude)")
        if dropped:
            print(f"    Dropped {dropped} studies with no abstract")

        frames.append(df)

    combined = pd.concat(frames, ignore_index=True)
    out = DATA_DIR / "tier2_core_eval.csv"
    combined.to_csv(out, index=False)

    inc = len(combined[combined["ground_truth"] == "INCLUDE"])
    exc = len(combined[combined["ground_truth"] == "EXCLUDE"])
    print(f"  Saved {len(combined)} studies to {out}")
    print(f"  ({inc} INCLUDE, {exc} EXCLUDE across {len(VERIFIED_REVIEWS)} reviews)")
    print(f"  NOTE: These are COMPLETE screening sets — no sampling applied")
    return combined


def prepare_tier3():
    """Build Tier 3 full benchmark: all studies from all 26 SYNERGY reviews.

    WARNING: Only the 3 verified reviews have confirmed PICO criteria.
    The remaining 23 reviews use the dataset but without verified protocols.
    Tier 3 is useful for aggregate statistics but not for PICO-level evaluation.
    """
    from synergy_dataset import iter_datasets

    print("Preparing Tier 3 (all 26 SYNERGY reviews)...")
    print("  WARNING: Only 3 reviews have verified PICO criteria.")
    frames = []
    for ds in iter_datasets():
        print(f"  Loading {ds.name}...")
        df = load_synergy_review(ds.name)
        frames.append(df)

    combined = pd.concat(frames, ignore_index=True)

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


if __name__ == "__main__":
    print("=" * 60)
    print("AI Evidence Synthesis — Evaluation Data Preparation")
    print("=" * 60)
    print()

    # Protocols are now maintained manually in review_protocols.json
    # with verified criteria from published papers
    print("Using verified protocols from eval/data/review_protocols.json")
    protocols = json.load(open(DATA_DIR / "review_protocols.json"))
    for name, proto in protocols.items():
        print(f"  {name}: {proto.get('_review_title', 'Unknown')}")
        print(f"    DOI: {proto.get('_review_doi', 'N/A')}")
        print(f"    Source: {proto.get('_source', 'N/A')}")
    print()

    prepare_tier1()
    print()
    prepare_tier2()
    print()

    if "--full" in sys.argv:
        prepare_tier3()
    else:
        print("Skipping Tier 3 (pass --full to include).")

    print()
    print("Done! Eval data is in eval/data/")
