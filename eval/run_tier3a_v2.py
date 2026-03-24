"""Tier 3a v2: Same-model dual-run consensus using existing Tier 2 as run 1.

Instead of running each model twice from scratch, we:
1. Use Tier 2 detail CSVs as Run 1 (temp=0, already done)
2. Run each model once more as Run 2 (temp=0.3, probing stability)
3. Apply consensus logic: agree + high confidence = decide, else defer

This halves the API cost compared to running both passes fresh.
"""

import os
import sys
import json
import time
import glob
from pathlib import Path
from datetime import datetime

import pandas as pd

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / "backend" / ".env")

DATA_DIR = Path(__file__).parent / "data"
RESULTS_DIR = Path(__file__).parent / "results"

from benchmark_models import screen_with_model, MODEL_CONFIGS, SYSTEM_PROMPT_TEMPLATE
from run_eval import (
    compute_forced_binary_metrics,
    compute_standard_metrics,
    compute_deference_metrics,
    print_triple_metrics,
    print_missed_studies,
    load_protocols,
)

CONFIDENCE_THRESHOLD = 85

MODELS_TO_RUN = {
    "or-claude-sonnet": MODEL_CONFIGS["or-claude-sonnet"],
    "or-deepseek-v3": MODEL_CONFIGS["or-deepseek-v3"],
    "or-mistral-24b": MODEL_CONFIGS["or-mistral-24b"],
    "or-kimi-k2": MODEL_CONFIGS["or-kimi-k2"],
}


def run_second_pass(model_name: str, config: dict, run1_df: pd.DataFrame, protocols: dict) -> pd.DataFrame:
    """Run a second pass (temp=0.3) and compute consensus with run 1."""
    from openai import OpenAI

    api_key = os.getenv(config.get("env_key", "")) or "dummy"
    base_url = config.get("base_url")
    client = OpenAI(api_key=api_key, base_url=base_url, timeout=120.0)
    model_id = config["model"]

    run2_results = []

    for i, (_, row) in enumerate(run1_df.iterrows()):
        review = row["review"]
        pico = protocols.get(review, {"P": "", "I": "", "C": "", "O": "", "S": "", "E": ""})

        text = f"Title: {row['title']}\nAbstract: {row['abstract']}" if pd.notna(row["abstract"]) else f"Title: {row['title']}"

        # Run 2: temperature=0.3 (probing stability)
        system_prompt = SYSTEM_PROMPT_TEMPLATE.format(**pico)

        try:
            response = client.chat.completions.create(
                model=model_id,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"STUDY:\n{text[:15000]}"},
                ],
                temperature=0.3,
                max_tokens=1000,
            )
            raw = response.choices[0].message.content.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
                raw = raw.strip()
            result = json.loads(raw)

            r2_raw_decision = result.get("ScreeningDecision", "UNCLEAR")
            r2_confidence = int(result.get("Confidence_Score", 0))

            run2_results.append({
                "r2_raw_decision": r2_raw_decision,
                "r2_confidence": r2_confidence,
            })
        except Exception as e:
            run2_results.append({
                "r2_raw_decision": "ERROR",
                "r2_confidence": 0,
            })

        if (i + 1) % 10 == 0 or i == 0:
            print(f"    [{i+1}/{len(run1_df)}] Run 2: {run2_results[-1]['r2_raw_decision']} "
                  f"(conf: {run2_results[-1]['r2_confidence']}%)")

    return pd.DataFrame(run2_results)


def apply_consensus(run1_df: pd.DataFrame, run2_df: pd.DataFrame) -> pd.DataFrame:
    """Apply dual-run consensus logic between run 1 and run 2."""
    result = run1_df.copy()

    r1_decisions = run1_df["ai_raw_decision"].fillna(run1_df["ai_decision"])
    r1_confs = run1_df["ai_confidence"]
    r2_decisions = run2_df["r2_raw_decision"]
    r2_confs = run2_df["r2_confidence"]

    consensus_decisions = []
    consensus_raw = []

    for i in range(len(run1_df)):
        r1d = r1_decisions.iloc[i]
        r2d = r2_decisions.iloc[i]
        r1c = r1_confs.iloc[i]
        r2c = r2_confs.iloc[i]

        # Skip errors
        if r1d == "ERROR" or r2d == "ERROR":
            consensus_decisions.append("ERROR")
            consensus_raw.append("ERROR")
            continue

        both_agree = r1d == r2d
        both_high_conf = r1c >= CONFIDENCE_THRESHOLD and r2c >= CONFIDENCE_THRESHOLD

        # Raw consensus (for forced binary): what they agreed on, or UNCLEAR
        if both_agree and r1d in ("INCLUDE", "EXCLUDE"):
            consensus_raw.append(r1d)
        else:
            consensus_raw.append("UNCLEAR")

        # Thresholded consensus
        if both_agree and both_high_conf and r1d in ("INCLUDE", "EXCLUDE"):
            consensus_decisions.append(r1d)
        elif both_agree and r1d in ("INCLUDE", "EXCLUDE"):
            # Same decision but low confidence
            consensus_decisions.append("UNCLEAR")
        else:
            # Disagreement
            consensus_decisions.append("UNCLEAR")

    result["ai_decision"] = consensus_decisions
    result["ai_raw_decision"] = consensus_raw
    result["ai_confidence"] = [(r1_confs.iloc[i] + r2_confs.iloc[i]) // 2 for i in range(len(run1_df))]

    return result


def main():
    protocols = load_protocols()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # Find Tier 2 detail CSVs (run 1)
    tier2_files = sorted(glob.glob(str(RESULTS_DIR / "detail_or-*_Donners_2021_20260323_223929.csv")))
    tier2_data = {}
    for f in tier2_files:
        name = f.split("detail_")[1].split("_Donners")[0]
        tier2_data[name] = pd.read_csv(f)

    print(f"Tier 2 data loaded: {list(tier2_data.keys())}")

    all_results = {}

    for model_name, config in MODELS_TO_RUN.items():
        if model_name not in tier2_data:
            print(f"  SKIP: {model_name} — no Tier 2 data")
            continue

        run1_df = tier2_data[model_name]
        # Filter out Tier 2 errors
        valid_mask = run1_df["ai_decision"] != "ERROR"
        run1_valid = run1_df[valid_mask].reset_index(drop=True)

        print(f"\n  Running second pass for {model_name} ({len(run1_valid)} studies)...")
        start = time.time()
        run2_df = run_second_pass(model_name, config, run1_valid, protocols)
        elapsed = time.time() - start

        # Apply consensus
        consensus_df = apply_consensus(run1_valid, run2_df)

        # Filter errors
        valid = consensus_df[consensus_df["ai_decision"] != "ERROR"]
        n_errors = len(consensus_df) - len(valid)

        if len(valid) > 0:
            fb = compute_forced_binary_metrics(valid)
            s = compute_standard_metrics(valid)
            d = compute_deference_metrics(valid)
            print_triple_metrics(fb, s, d, f"{model_name} (dual-run consensus)")
            print_missed_studies(valid)
        else:
            print(f"  All studies errored for {model_name}")
            continue

        # Save
        detail_path = RESULTS_DIR / f"tier3a_{model_name}_{timestamp}.csv"
        consensus_df.to_csv(detail_path, index=False)

        all_results[model_name] = {
            "forced_binary": fb,
            "standard": s,
            "deference": d,
            "elapsed": round(elapsed, 1),
            "errors": n_errors,
        }

        print(f"  Time: {elapsed:.0f}s ({elapsed/len(run1_valid):.1f}s/study, second pass only)")

    # Summary
    summary_path = RESULTS_DIR / f"tier3a_summary_{timestamp}.json"
    with open(summary_path, "w") as f:
        json.dump(all_results, f, indent=2, default=str)
    print(f"\nSummary saved to: {summary_path}")


if __name__ == "__main__":
    main()
