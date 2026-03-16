"""Run evaluation of the AI Evidence Synthesis screening engine.

Compares AI screening decisions against ground truth labels and
computes standard evaluation metrics.

Usage:
    python eval/run_eval.py --tier 1          # Smoke test (10 studies, fast)
    python eval/run_eval.py --tier 2          # Core eval (~500 studies)
    python eval/run_eval.py --tier 3          # Full benchmark (169K studies)
    python eval/run_eval.py --review NAME     # Single review
    python eval/run_eval.py --tier 1 --dry    # Show data without calling AI
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path

import pandas as pd

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / "backend" / ".env")

DATA_DIR = Path(__file__).parent / "data"
RESULTS_DIR = Path(__file__).parent / "results"
RESULTS_DIR.mkdir(exist_ok=True)


def load_protocols() -> dict:
    proto_path = DATA_DIR / "review_protocols.json"
    if not proto_path.exists():
        print("ERROR: Run prepare_data.py first.")
        sys.exit(1)
    with open(proto_path) as f:
        return json.load(f)


def screen_study(text: str, pico: dict, stage: str = "level_1"):
    """Call the AI screening engine."""
    from app.services.ai_provider import get_ai_provider

    provider = get_ai_provider()
    result = provider.analyze_study(text, pico, stage)
    return {
        "decision": result.ScreeningDecision,
        "confidence": result.Confidence_Score,
        "reason": result.Reasoning_Summary,
        "p_check": result.ReasoningLog.Population_Check,
        "i_check": result.ReasoningLog.Intervention_Check,
        "c_check": result.ReasoningLog.Comparator_Check,
        "o_check": result.ReasoningLog.Outcome_Check,
        "s_check": result.ReasoningLog.StudyDesign_Check,
        "e_check": result.ReasoningLog.Exclusion_Check,
    }


def compute_metrics(df: pd.DataFrame) -> dict:
    """Compute evaluation metrics from a DataFrame with ground_truth and ai_decision columns."""
    # For screening, INCLUDE is the positive class (we don't want to miss relevant studies)
    # True Positive = AI says INCLUDE and ground truth is INCLUDE
    # False Negative = AI says EXCLUDE but ground truth is INCLUDE (worst error — missed study)
    # False Positive = AI says INCLUDE but ground truth is EXCLUDE (extra work, but not dangerous)

    tp = len(df[(df["ai_decision"] == "INCLUDE") & (df["ground_truth"] == "INCLUDE")])
    fn = len(df[(df["ai_decision"] != "INCLUDE") & (df["ground_truth"] == "INCLUDE")])
    fp = len(df[(df["ai_decision"] == "INCLUDE") & (df["ground_truth"] == "EXCLUDE")])
    tn = len(df[(df["ai_decision"] != "INCLUDE") & (df["ground_truth"] == "EXCLUDE")])

    total = len(df)
    accuracy = (tp + tn) / total if total > 0 else 0

    # Sensitivity (recall) — what % of truly included studies did we catch?
    # This is THE critical metric. Missing a relevant study is the worst outcome.
    sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0

    # Specificity — what % of truly excluded studies did we correctly reject?
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0

    # Precision — of studies we said INCLUDE, what % were actually included?
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0

    # F1
    f1 = 2 * precision * sensitivity / (precision + sensitivity) if (precision + sensitivity) > 0 else 0

    # Work saved — what % of studies could reviewers skip because AI excluded them?
    # (Only meaningful if sensitivity is high enough)
    work_saved = (tn + fn) / total if total > 0 else 0

    # UNCLEAR handling
    n_unclear = len(df[df["ai_decision"] == "UNCLEAR"])

    return {
        "total": total,
        "true_positives": tp,
        "false_negatives": fn,
        "false_positives": fp,
        "true_negatives": tn,
        "accuracy": round(accuracy, 4),
        "sensitivity_recall": round(sensitivity, 4),
        "specificity": round(specificity, 4),
        "precision": round(precision, 4),
        "f1_score": round(f1, 4),
        "work_saved_pct": round(work_saved * 100, 1),
        "n_unclear": n_unclear,
        "n_unclear_pct": round(n_unclear / total * 100, 1) if total > 0 else 0,
    }


def print_metrics(metrics: dict, review_name: str = "Overall"):
    """Pretty-print evaluation metrics."""
    print(f"\n{'=' * 60}")
    print(f"  RESULTS: {review_name}")
    print(f"{'=' * 60}")
    print(f"  Total studies evaluated:    {metrics['total']}")
    print(f"  True Positives (correct):   {metrics['true_positives']}")
    print(f"  False Negatives (MISSED):   {metrics['false_negatives']}  <-- Critical errors")
    print(f"  False Positives (over-inc): {metrics['false_positives']}")
    print(f"  True Negatives (correct):   {metrics['true_negatives']}")
    print()
    print(f"  Sensitivity (Recall):  {metrics['sensitivity_recall']:.1%}  {'OK' if metrics['sensitivity_recall'] >= 0.95 else 'NEEDS IMPROVEMENT'}")
    print(f"  Specificity:           {metrics['specificity']:.1%}")
    print(f"  Precision:             {metrics['precision']:.1%}")
    print(f"  F1 Score:              {metrics['f1_score']:.1%}")
    print(f"  Accuracy:              {metrics['accuracy']:.1%}")
    print(f"  Work Saved:            {metrics['work_saved_pct']:.1f}%")
    print(f"  Flagged as UNCLEAR:    {metrics['n_unclear']} ({metrics['n_unclear_pct']}%)")
    print(f"{'=' * 60}")

    if metrics['false_negatives'] > 0:
        print("\n  WARNING: AI missed relevant studies. Review false negatives carefully.")
        print("  In systematic reviews, sensitivity > 95% is the minimum standard.")


def print_missed_studies(df: pd.DataFrame):
    """Print studies the AI missed (false negatives)."""
    missed = df[(df["ai_decision"] != "INCLUDE") & (df["ground_truth"] == "INCLUDE")]
    if missed.empty:
        return
    print(f"\n  MISSED STUDIES ({len(missed)}):")
    print(f"  {'-' * 56}")
    for _, row in missed.iterrows():
        title = row["title"][:70] if pd.notna(row["title"]) else "No title"
        print(f"  - [{row['ai_decision']}] {title}...")
        if pd.notna(row.get("ai_reason")):
            reason = row["ai_reason"][:100]
            print(f"    Reason: {reason}")
    print()


def run_eval(csv_path: Path, protocols: dict, stage: str = "level_1",
             dry_run: bool = False, max_studies: int = 0) -> pd.DataFrame:
    """Run evaluation on a CSV file of labeled studies."""
    df = pd.read_csv(csv_path)

    if max_studies > 0:
        df = df.head(max_studies)

    print(f"\nEvaluating {len(df)} studies from {csv_path.name}")
    print(f"Ground truth: {len(df[df['ground_truth'] == 'INCLUDE'])} INCLUDE, "
          f"{len(df[df['ground_truth'] == 'EXCLUDE'])} EXCLUDE")

    if dry_run:
        print("\n[DRY RUN] Showing data sample, no AI calls made:")
        print(df[["title", "ground_truth"]].head(10).to_string())
        return df

    # Get unique reviews and their protocols
    reviews_in_data = df["review"].unique()
    ai_results = []

    for i, (_, row) in enumerate(df.iterrows()):
        review = row["review"]
        pico = protocols.get(review)
        if not pico:
            print(f"  WARNING: No protocol for {review}, using empty PICO")
            pico = {"P": "", "I": "", "C": "", "O": "", "S": "", "E": ""}

        text = f"Title: {row['title']}\nAbstract: {row['abstract']}" if pd.notna(row["abstract"]) else f"Title: {row['title']}"

        try:
            result = screen_study(text, pico, stage)
            ai_results.append(result)
        except Exception as e:
            print(f"  ERROR on study {i}: {e}")
            ai_results.append({
                "decision": "ERROR",
                "confidence": 0,
                "reason": str(e),
                "p_check": False, "i_check": False, "c_check": False,
                "o_check": False, "s_check": False, "e_check": False,
            })

        # Progress
        if (i + 1) % 10 == 0 or i == 0:
            elapsed = "..."
            print(f"  [{i+1}/{len(df)}] Last decision: {ai_results[-1]['decision']} "
                  f"(conf: {ai_results[-1]['confidence']}%)")

    # Merge results
    results_df = pd.DataFrame(ai_results)
    df["ai_decision"] = results_df["decision"].values
    df["ai_confidence"] = results_df["confidence"].values
    df["ai_reason"] = results_df["reason"].values
    df["ai_p"] = results_df["p_check"].values
    df["ai_i"] = results_df["i_check"].values
    df["ai_c"] = results_df["c_check"].values
    df["ai_o"] = results_df["o_check"].values
    df["ai_s"] = results_df["s_check"].values
    df["ai_e"] = results_df["e_check"].values

    return df


def main():
    parser = argparse.ArgumentParser(description="AI Evidence Synthesis Evaluation")
    parser.add_argument("--tier", type=int, choices=[1, 2, 3], help="Evaluation tier")
    parser.add_argument("--review", type=str, help="Specific review name")
    parser.add_argument("--dry", action="store_true", help="Dry run (no AI calls)")
    parser.add_argument("--max", type=int, default=0, help="Max studies to evaluate")
    parser.add_argument("--stage", default="level_1", help="Screening stage (level_1 or level_2)")
    args = parser.parse_args()

    protocols = load_protocols()

    # Determine which CSV to use
    if args.review:
        # Build a single-review CSV on the fly
        from synergy_dataset import Dataset
        ds = Dataset(args.review)
        df = ds.to_frame().reset_index().rename(columns={"openalex_id": "id"})
        df["ground_truth"] = df["label_included"].map({1: "INCLUDE", 0: "EXCLUDE"})
        df["review"] = args.review
        df = df[["id", "title", "abstract", "ground_truth", "review"]]
        csv_path = DATA_DIR / f"review_{args.review}.csv"
        df.to_csv(csv_path, index=False)
    elif args.tier == 1:
        csv_path = DATA_DIR / "tier1_smoke_test.csv"
    elif args.tier == 2:
        csv_path = DATA_DIR / "tier2_core_eval.csv"
    elif args.tier == 3:
        csv_path = DATA_DIR / "tier3_full_benchmark.csv"
    else:
        print("Specify --tier (1, 2, or 3) or --review NAME")
        sys.exit(1)

    if not csv_path.exists():
        print(f"ERROR: {csv_path} not found. Run prepare_data.py first.")
        sys.exit(1)

    # Run evaluation
    start = time.time()
    df = run_eval(csv_path, protocols, stage=args.stage, dry_run=args.dry, max_studies=args.max)

    if args.dry:
        return

    elapsed = time.time() - start

    # Compute and display metrics
    overall_metrics = compute_metrics(df)
    print_metrics(overall_metrics)
    print_missed_studies(df)

    # Per-review breakdown
    if df["review"].nunique() > 1:
        print("\nPER-REVIEW BREAKDOWN:")
        for review in df["review"].unique():
            rdf = df[df["review"] == review]
            m = compute_metrics(rdf)
            inc = len(rdf[rdf["ground_truth"] == "INCLUDE"])
            print(f"  {review}: sensitivity={m['sensitivity_recall']:.0%}, "
                  f"specificity={m['specificity']:.0%}, "
                  f"F1={m['f1_score']:.0%} "
                  f"({inc} included / {len(rdf)} total)")

    # Save results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    tier_label = f"tier{args.tier}" if args.tier else args.review
    results_path = RESULTS_DIR / f"eval_{tier_label}_{timestamp}.csv"
    df.to_csv(results_path, index=False)

    metrics_path = RESULTS_DIR / f"metrics_{tier_label}_{timestamp}.json"
    overall_metrics["elapsed_seconds"] = round(elapsed, 1)
    overall_metrics["timestamp"] = timestamp
    overall_metrics["stage"] = args.stage
    overall_metrics["tier"] = args.tier
    with open(metrics_path, "w") as f:
        json.dump(overall_metrics, f, indent=2)

    print(f"\nResults saved to: {results_path}")
    print(f"Metrics saved to: {metrics_path}")
    print(f"Time elapsed: {elapsed:.0f}s ({elapsed/len(df):.1f}s per study)")


if __name__ == "__main__":
    main()
