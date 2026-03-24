"""Tier 3a: Same-model dual-run consensus evaluation.

Runs each model through the production dual-run consensus engine
(two passes per study, same model) and evaluates with all three frameworks.

This uses the production ai_provider which does dual-run consensus
internally, so each study costs 2 API calls.
"""

import os
import sys
import json
import time
from pathlib import Path
from datetime import datetime

import pandas as pd

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / "backend" / ".env")

DATA_DIR = Path(__file__).parent / "data"
RESULTS_DIR = Path(__file__).parent / "results"
RESULTS_DIR.mkdir(exist_ok=True)

from run_eval import (
    compute_forced_binary_metrics,
    compute_standard_metrics,
    compute_deference_metrics,
    print_triple_metrics,
    print_missed_studies,
    load_protocols,
)

# Models to test with dual-run consensus
MODELS = {
    "claude-sonnet-4.6": {
        "model_id": "anthropic/claude-sonnet-4.6",
        "developer": "Anthropic",
    },
    "deepseek-v3": {
        "model_id": "deepseek/deepseek-v3.2",
        "developer": "DeepSeek",
    },
    "mistral-3.1-24b": {
        "model_id": "mistralai/mistral-small-3.1-24b-instruct",
        "developer": "Mistral AI",
    },
    "kimi-k2": {
        "model_id": "moonshotai/kimi-k2",
        "developer": "Moonshot AI",
    },
}


def run_dual_consensus_eval(model_name: str, model_id: str, csv_path: Path, protocols: dict):
    """Run dual-consensus eval for a single model by temporarily overriding config."""
    # Override the AI config for this model
    os.environ["AI_PROVIDER"] = "openrouter"
    os.environ["AI_API_KEY"] = os.getenv("OPENROUTER_API_KEY", "")
    os.environ["AI_BASE_URL"] = "https://openrouter.ai/api/v1"
    os.environ["AI_MODEL_LEVEL1"] = model_id
    os.environ["AI_MODEL_LEVEL2"] = model_id
    os.environ["AI_MODEL_EXTRACTION"] = model_id

    # Clear cached settings and provider
    from app.config import get_settings
    get_settings.cache_clear()

    import app.services.ai_provider as aip
    aip._provider_instance = None

    # Load data
    df = pd.read_csv(csv_path)
    print(f"\n{'='*70}")
    print(f"  TIER 3a: {model_name} (dual-run consensus)")
    print(f"  {len(df)} studies from {csv_path.name}")
    print(f"{'='*70}")

    # Screen each study through dual-run consensus
    from app.services.ai_provider import get_ai_provider

    provider = get_ai_provider()
    results = []

    for i, (_, row) in enumerate(df.iterrows()):
        review = row["review"]
        pico = protocols.get(review, {"P": "", "I": "", "C": "", "O": "", "S": "", "E": ""})
        text = f"Title: {row['title']}\nAbstract: {row['abstract']}" if pd.notna(row["abstract"]) else f"Title: {row['title']}"

        try:
            result = provider.analyze_study(text, pico, "level_1")
            results.append({
                "decision": result.ScreeningDecision,
                "confidence": result.Confidence_Score,
                "reason": result.Reasoning_Summary,
            })
        except Exception as e:
            results.append({
                "decision": "ERROR",
                "confidence": 0,
                "reason": str(e),
            })

        if (i + 1) % 10 == 0 or i == 0:
            print(f"  [{i+1}/{len(df)}] {results[-1]['decision']} (conf: {results[-1]['confidence']}%)")

    # Merge
    res_df = pd.DataFrame(results)
    df["ai_decision"] = res_df["decision"].values
    df["ai_confidence"] = res_df["confidence"].values
    df["ai_reason"] = res_df["reason"].values

    # For forced binary, the dual-run consensus already resolved to
    # INCLUDE/EXCLUDE/UNCLEAR. The "raw" decision IS the consensus output.
    # UNCLEAR here means the two runs disagreed or had low confidence.
    df["ai_raw_decision"] = df["ai_decision"]

    return df


def main():
    protocols = load_protocols()
    csv_path = DATA_DIR / "tier1_smoke_test.csv"

    # Check for --tier2 flag
    if "--tier2" in sys.argv:
        # Use Donners_2021 review
        from synergy_dataset import Dataset
        ds = Dataset("Donners_2021")
        ddf = ds.to_frame().reset_index().rename(columns={"openalex_id": "id"})
        ddf["ground_truth"] = ddf["label_included"].map({1: "INCLUDE", 0: "EXCLUDE"})
        ddf["review"] = "Donners_2021"
        ddf = ddf[["id", "title", "abstract", "ground_truth", "review"]]
        ddf = ddf[ddf["abstract"].notna() & (ddf["abstract"].str.strip() != "")]
        csv_path = DATA_DIR / "review_Donners_2021_tier3a.csv"
        ddf.to_csv(csv_path, index=False)
        print(f"Using Donners_2021: {len(ddf)} studies")

    # Select models
    model_filter = None
    for arg in sys.argv[1:]:
        if arg.startswith("--models="):
            model_filter = arg.split("=")[1].split(",")

    models_to_run = MODELS if not model_filter else {k: v for k, v in MODELS.items() if k in model_filter}

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    all_results = {}

    for model_name, config in models_to_run.items():
        start = time.time()
        df = run_dual_consensus_eval(model_name, config["model_id"], csv_path, protocols)
        elapsed = time.time() - start

        # Filter errors
        valid = df[df["ai_decision"] != "ERROR"]
        n_errors = len(df) - len(valid)

        if len(valid) > 0:
            fb = compute_forced_binary_metrics(valid)
            s = compute_standard_metrics(valid)
            d = compute_deference_metrics(valid)
            print_triple_metrics(fb, s, d, f"{model_name} (dual-run)")
            print_missed_studies(valid)
        else:
            print(f"  All studies errored for {model_name}")
            continue

        # Save detail CSV
        detail_path = RESULTS_DIR / f"tier3a_{model_name}_{timestamp}.csv"
        df.to_csv(detail_path, index=False)

        all_results[model_name] = {
            "forced_binary": fb,
            "standard": s,
            "deference": d,
            "elapsed": round(elapsed, 1),
            "errors": n_errors,
        }

        print(f"\n  Time: {elapsed:.0f}s ({elapsed/len(df):.1f}s/study, dual-run)")

    # Save summary
    summary_path = RESULTS_DIR / f"tier3a_summary_{timestamp}.json"
    with open(summary_path, "w") as f:
        json.dump(all_results, f, indent=2, default=str)
    print(f"\nSummary saved to: {summary_path}")


if __name__ == "__main__":
    main()
