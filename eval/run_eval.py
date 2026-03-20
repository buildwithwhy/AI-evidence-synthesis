"""Run evaluation of the AI Evidence Synthesis screening engine.

Computes TWO evaluation frameworks side by side:

1. STANDARD METRICS: Traditional accuracy where UNCLEAR counts as wrong
2. DEFERENCE-AWARE METRICS: UNCLEAR (AI defers to human) counts as correct

The deference-aware framework recognises that in human-in-the-loop systems,
an AI that correctly identifies its own uncertainty and defers to a human
expert has behaved correctly. Penalising appropriate uncertainty creates
incentives for overconfident AI — exactly what you don't want in high-stakes
evidence synthesis.

Usage:
    python eval/run_eval.py --tier 1          # Smoke test (10 studies)
    python eval/run_eval.py --tier 2          # Core eval (~1345 studies)
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
    """Call the AI screening engine (dual-run consensus)."""
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


# ============================================================
# STANDARD METRICS (traditional evaluation)
# ============================================================

def compute_standard_metrics(df: pd.DataFrame) -> dict:
    """Standard metrics where UNCLEAR counts as a non-INCLUDE (penalised).

    In this framework, UNCLEAR is treated as EXCLUDE for metric computation.
    This is how most screening tool evaluations work.
    """
    total = len(df)

    # INCLUDE is the positive class
    tp = len(df[(df["ai_decision"] == "INCLUDE") & (df["ground_truth"] == "INCLUDE")])
    fn = len(df[(df["ai_decision"] != "INCLUDE") & (df["ground_truth"] == "INCLUDE")])
    fp = len(df[(df["ai_decision"] == "INCLUDE") & (df["ground_truth"] == "EXCLUDE")])
    tn = len(df[(df["ai_decision"] != "INCLUDE") & (df["ground_truth"] == "EXCLUDE")])

    accuracy = (tp + tn) / total if total > 0 else 0
    sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    f1 = 2 * precision * sensitivity / (precision + sensitivity) if (precision + sensitivity) > 0 else 0
    work_saved = (tn + fn) / total if total > 0 else 0

    n_unclear = len(df[df["ai_decision"] == "UNCLEAR"])

    return {
        "framework": "standard",
        "total": total,
        "tp": tp, "fn": fn, "fp": fp, "tn": tn,
        "accuracy": round(accuracy, 4),
        "sensitivity": round(sensitivity, 4),
        "specificity": round(specificity, 4),
        "precision": round(precision, 4),
        "f1_score": round(f1, 4),
        "work_saved_pct": round(work_saved * 100, 1),
        "n_unclear": n_unclear,
        "unclear_pct": round(n_unclear / total * 100, 1) if total > 0 else 0,
    }


# ============================================================
# DEFERENCE-AWARE METRICS (novel HITL evaluation)
# ============================================================

def compute_deference_metrics(df: pd.DataFrame) -> dict:
    """Deference-aware metrics where UNCLEAR counts as CORRECT.

    In a human-in-the-loop system, when the AI says "I'm not sure,
    a human should look at this", it has behaved correctly regardless
    of the ground truth. The AI's job is to:
      1. Correctly classify studies it IS confident about
      2. Correctly identify when it SHOULD defer

    Penalising UNCLEAR creates incentives for overconfident AI —
    exactly what you don't want in systematic reviews.

    Metrics computed on the "decided" subset (INCLUDE/EXCLUDE only):
      - Decided sensitivity: of included studies the AI made a call on, how many did it get right?
      - Decided specificity: of excluded studies the AI made a call on, how many did it get right?
      - Deference rate: what % of studies did the AI defer on?
      - Appropriate deference: of deferred studies, what % were genuinely ambiguous
        (approximated by confidence score)?
      - Effective coverage: what % of the screening can the AI handle autonomously?

    Combined score: the AI is correct if it either (a) made the right call or (b) deferred.
    """
    total = len(df)
    deferred = df[df["ai_decision"] == "UNCLEAR"]
    decided = df[df["ai_decision"].isin(["INCLUDE", "EXCLUDE"])]

    n_deferred = len(deferred)
    n_decided = len(decided)
    deference_rate = n_deferred / total if total > 0 else 0

    # Metrics on the DECIDED subset only
    if n_decided > 0:
        d_tp = len(decided[(decided["ai_decision"] == "INCLUDE") & (decided["ground_truth"] == "INCLUDE")])
        d_fn = len(decided[(decided["ai_decision"] == "EXCLUDE") & (decided["ground_truth"] == "INCLUDE")])
        d_fp = len(decided[(decided["ai_decision"] == "INCLUDE") & (decided["ground_truth"] == "EXCLUDE")])
        d_tn = len(decided[(decided["ai_decision"] == "EXCLUDE") & (decided["ground_truth"] == "EXCLUDE")])

        decided_accuracy = (d_tp + d_tn) / n_decided
        decided_sensitivity = d_tp / (d_tp + d_fn) if (d_tp + d_fn) > 0 else 0
        decided_specificity = d_tn / (d_tn + d_fp) if (d_tn + d_fp) > 0 else 0
        decided_precision = d_tp / (d_tp + d_fp) if (d_tp + d_fp) > 0 else 0
        decided_f1 = (2 * decided_precision * decided_sensitivity /
                      (decided_precision + decided_sensitivity)
                      if (decided_precision + decided_sensitivity) > 0 else 0)
    else:
        d_tp = d_fn = d_fp = d_tn = 0
        decided_accuracy = decided_sensitivity = decided_specificity = 0
        decided_precision = decided_f1 = 0

    # Deference-aware accuracy: correct = right call OR deferred
    correct_decisions = d_tp + d_tn
    deference_aware_accuracy = (correct_decisions + n_deferred) / total if total > 0 else 0

    # Of deferred studies, how were they split in ground truth?
    # This tells us if the AI is deferring on genuinely mixed cases
    deferred_would_be_include = len(deferred[deferred["ground_truth"] == "INCLUDE"]) if n_deferred > 0 else 0
    deferred_would_be_exclude = len(deferred[deferred["ground_truth"] == "EXCLUDE"]) if n_deferred > 0 else 0

    # Critical safety metric: of studies that SHOULD be included,
    # how many did the AI either correctly include OR defer?
    # (Only a hard EXCLUDE on a truly included study is a real failure)
    total_should_include = len(df[df["ground_truth"] == "INCLUDE"])
    hard_misses = d_fn  # AI said EXCLUDE on a study that should be INCLUDE
    safe_sensitivity = 1 - (hard_misses / total_should_include) if total_should_include > 0 else 0

    return {
        "framework": "deference_aware",
        "total": total,
        "n_decided": n_decided,
        "n_deferred": n_deferred,
        "deference_rate_pct": round(deference_rate * 100, 1),
        # On decided subset
        "decided_tp": d_tp, "decided_fn": d_fn, "decided_fp": d_fp, "decided_tn": d_tn,
        "decided_accuracy": round(decided_accuracy, 4),
        "decided_sensitivity": round(decided_sensitivity, 4),
        "decided_specificity": round(decided_specificity, 4),
        "decided_precision": round(decided_precision, 4),
        "decided_f1": round(decided_f1, 4),
        # Combined
        "deference_aware_accuracy": round(deference_aware_accuracy, 4),
        "safe_sensitivity": round(safe_sensitivity, 4),
        "hard_misses": hard_misses,
        # Deferred breakdown
        "deferred_would_include": deferred_would_be_include,
        "deferred_would_exclude": deferred_would_be_exclude,
        # Effective automation
        "effective_coverage_pct": round((n_decided / total) * 100, 1) if total > 0 else 0,
    }


# ============================================================
# DISPLAY
# ============================================================

def print_dual_metrics(standard: dict, deference: dict, label: str = "Overall"):
    """Print both frameworks side by side."""
    print(f"\n{'=' * 80}")
    print(f"  EVALUATION: {label}")
    print(f"  {standard['total']} studies | {deference['n_decided']} decided | {deference['n_deferred']} deferred to human")
    print(f"{'=' * 80}")

    print(f"\n  {'METRIC':<35} {'STANDARD':>12} {'DEFERENCE-AWARE':>16}")
    print(f"  {'-'*35} {'-'*12} {'-'*16}")

    print(f"  {'Accuracy':<35} {standard['accuracy']:>11.1%} {deference['deference_aware_accuracy']:>15.1%}")
    print(f"  {'Sensitivity (Recall)':<35} {standard['sensitivity']:>11.1%} {deference['safe_sensitivity']:>15.1%}")
    print(f"  {'  -> on decided subset':<35} {'':>12} {deference['decided_sensitivity']:>15.1%}")
    print(f"  {'Specificity':<35} {standard['specificity']:>11.1%} {deference['decided_specificity']:>15.1%}")
    print(f"  {'Precision':<35} {standard['precision']:>11.1%} {deference['decided_precision']:>15.1%}")
    print(f"  {'F1 Score':<35} {standard['f1_score']:>11.1%} {deference['decided_f1']:>15.1%}")
    print(f"  {'Work Saved':<35} {standard['work_saved_pct']:>10.1f}% {'N/A':>16}")

    print(f"\n  {'DEFERENCE ANALYSIS':<35}")
    print(f"  {'-'*55}")
    print(f"  {'Deference rate':<35} {deference['deference_rate_pct']:>10.1f}%")
    print(f"  {'Effective coverage (AI handles)':<35} {deference['effective_coverage_pct']:>10.1f}%")
    print(f"  {'Hard misses (EXCLUDE on included)':<35} {deference['hard_misses']:>10}")
    print(f"  {'Deferred -> would be INCLUDE':<35} {deference['deferred_would_include']:>10}")
    print(f"  {'Deferred -> would be EXCLUDE':<35} {deference['deferred_would_exclude']:>10}")

    # Interpretation
    print(f"\n  INTERPRETATION:")
    safe_sens = deference['safe_sensitivity']
    std_sens = standard['sensitivity']
    if safe_sens > std_sens:
        delta = safe_sens - std_sens
        print(f"  Standard metrics UNDERSTATE safety by {delta:.1%}.")
        print(f"  The AI correctly deferred on uncertain included studies rather than")
        print(f"  confidently excluding them — this is safer behavior that standard")
        print(f"  metrics penalise.")
    if deference['hard_misses'] == 0:
        print(f"  ZERO hard misses: every included study was either correctly included")
        print(f"  or flagged for human review. No relevant studies were lost.")
    elif deference['hard_misses'] > 0:
        print(f"  {deference['hard_misses']} hard miss(es): the AI confidently excluded studies")
        print(f"  that should have been included. These are the only true failures.")
    print(f"{'=' * 80}")


def print_missed_studies(df: pd.DataFrame):
    """Print studies the AI hard-missed (said EXCLUDE when ground truth is INCLUDE)."""
    hard_missed = df[(df["ai_decision"] == "EXCLUDE") & (df["ground_truth"] == "INCLUDE")]
    deferred_included = df[(df["ai_decision"] == "UNCLEAR") & (df["ground_truth"] == "INCLUDE")]

    if not hard_missed.empty:
        print(f"\n  HARD MISSES — AI said EXCLUDE on included studies ({len(hard_missed)}):")
        print(f"  {'-' * 56}")
        for _, row in hard_missed.iterrows():
            title = row["title"][:70] if pd.notna(row["title"]) else "No title"
            conf = row.get("ai_confidence", "?")
            print(f"  - [EXCLUDE conf:{conf}%] {title}...")
        print()

    if not deferred_included.empty:
        print(f"  CORRECTLY DEFERRED — AI flagged included studies for human review ({len(deferred_included)}):")
        print(f"  {'-' * 56}")
        for _, row in deferred_included.head(10).iterrows():
            title = row["title"][:70] if pd.notna(row["title"]) else "No title"
            conf = row.get("ai_confidence", "?")
            print(f"  - [UNCLEAR conf:{conf}%] {title}...")
        if len(deferred_included) > 10:
            print(f"  ... and {len(deferred_included) - 10} more")
        print()


# ============================================================
# EVALUATION RUNNER
# ============================================================

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

        if (i + 1) % 10 == 0 or i == 0:
            print(f"  [{i+1}/{len(df)}] {ai_results[-1]['decision']} "
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
    parser.add_argument("--stage", default="level_1", help="Screening stage")
    args = parser.parse_args()

    protocols = load_protocols()

    # Determine CSV
    if args.review:
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

    # Run
    start = time.time()
    df = run_eval(csv_path, protocols, stage=args.stage, dry_run=args.dry, max_studies=args.max)

    if args.dry:
        return

    elapsed = time.time() - start

    # Filter out errors
    valid = df[df["ai_decision"] != "ERROR"]
    n_errors = len(df) - len(valid)
    if n_errors > 0:
        print(f"\n  {n_errors} studies had errors and are excluded from metrics.")

    # Compute BOTH metric frameworks
    standard = compute_standard_metrics(valid)
    deference = compute_deference_metrics(valid)

    # Display
    print_dual_metrics(standard, deference)
    print_missed_studies(valid)

    # Per-review breakdown
    if valid["review"].nunique() > 1:
        print("\nPER-REVIEW BREAKDOWN:")
        print(f"  {'Review':<20} {'Std Sens':>9} {'Safe Sens':>10} {'Deferred':>9} {'Hard Miss':>10}")
        print(f"  {'-'*20} {'-'*9} {'-'*10} {'-'*9} {'-'*10}")
        for review in valid["review"].unique():
            rdf = valid[valid["review"] == review]
            s = compute_standard_metrics(rdf)
            d = compute_deference_metrics(rdf)
            print(f"  {review:<20} {s['sensitivity']:>8.1%} {d['safe_sensitivity']:>9.1%} "
                  f"{d['deference_rate_pct']:>7.1f}% {d['hard_misses']:>10}")

    # Save results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    tier_label = f"tier{args.tier}" if args.tier else args.review

    results_path = RESULTS_DIR / f"eval_{tier_label}_{timestamp}.csv"
    df.to_csv(results_path, index=False)

    metrics_path = RESULTS_DIR / f"metrics_{tier_label}_{timestamp}.json"
    combined_metrics = {
        "standard": standard,
        "deference_aware": deference,
        "elapsed_seconds": round(elapsed, 1),
        "timestamp": timestamp,
        "stage": args.stage,
        "tier": args.tier,
        "n_errors": n_errors,
    }
    with open(metrics_path, "w") as f:
        json.dump(combined_metrics, f, indent=2)

    print(f"\nResults saved to: {results_path}")
    print(f"Metrics saved to: {metrics_path}")
    print(f"Time elapsed: {elapsed:.0f}s ({elapsed/len(df):.1f}s per study)")


if __name__ == "__main__":
    main()
