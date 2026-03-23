"""Multi-LLM Benchmarking for AI Evidence Synthesis.

Tests multiple LLMs against the same evaluation dataset and produces
a comparison report suitable for publishing on the website.

Supported providers:
  - OpenAI: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo
  - Anthropic: claude-sonnet-4-20250514, claude-haiku-4-5-20251001
  - Open source via OpenRouter: llama-3.1-70b, mistral-large, etc.
  - Local models via Ollama: any model with structured output support

Usage:
    # Test all configured models on Tier 1:
    python eval/benchmark_models.py --tier 1

    # Test specific models:
    python eval/benchmark_models.py --tier 1 --models gpt-4o-mini,claude-sonnet-4-20250514

    # Test with a specific review:
    python eval/benchmark_models.py --review Donners_2021 --max 50

    # Generate website-ready comparison:
    python eval/benchmark_models.py --tier 2 --publish
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from abc import ABC, abstractmethod

import pandas as pd

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / "backend" / ".env")

DATA_DIR = Path(__file__).parent / "data"
RESULTS_DIR = Path(__file__).parent / "results"
RESULTS_DIR.mkdir(exist_ok=True)

# Import shared eval logic
from run_eval import compute_standard_metrics, compute_deference_metrics, load_protocols


# ============================================================
# Model Configurations
# ============================================================

VENICE_BASE_URL = "https://api.venice.ai/api/v1"

# Venice model IDs verified against /v1/models endpoint on 2026-03-23
MODEL_CONFIGS = {
    # --- Open source models (via Venice AI) ---
    "llama-3.3-70b": {
        "provider": "venice",
        "model": "llama-3.3-70b",
        "developer": "Meta",
        "open_source": True,
        "env_key": "AI_API_KEY",
        "base_url": VENICE_BASE_URL,
        "cost_per_1k_input": 0.0007,
        "cost_per_1k_output": 0.0028,
    },
    "mistral-31-24b": {
        "provider": "venice",
        "model": "mistral-31-24b",
        "developer": "Mistral AI",
        "open_source": True,
        "env_key": "AI_API_KEY",
        "base_url": VENICE_BASE_URL,
        "cost_per_1k_input": 0.0003,
        "cost_per_1k_output": 0.0012,
    },
    "deepseek-v3": {
        "provider": "venice",
        "model": "deepseek-v3.2",
        "developer": "DeepSeek",
        "open_source": True,
        "env_key": "AI_API_KEY",
        "base_url": VENICE_BASE_URL,
        "cost_per_1k_input": 0.00014,
        "cost_per_1k_output": 0.00028,
    },
    "qwen-3-235b": {
        "provider": "venice",
        "model": "qwen3-235b-a22b-instruct-2507",
        "developer": "Alibaba Cloud",
        "open_source": True,
        "env_key": "AI_API_KEY",
        "base_url": VENICE_BASE_URL,
        "cost_per_1k_input": 0.0005,
        "cost_per_1k_output": 0.002,
    },
    "gemma-3-27b": {
        "provider": "venice",
        "model": "google-gemma-3-27b-it",
        "developer": "Google",
        "open_source": True,
        "env_key": "AI_API_KEY",
        "base_url": VENICE_BASE_URL,
        "cost_per_1k_input": 0.0003,
        "cost_per_1k_output": 0.0012,
    },
    "kimi-k2": {
        "provider": "venice",
        "model": "kimi-k2-5",
        "developer": "Moonshot AI",
        "open_source": True,
        "env_key": "AI_API_KEY",
        "base_url": VENICE_BASE_URL,
        "cost_per_1k_input": 0.0006,
        "cost_per_1k_output": 0.0024,
    },
    # --- Proprietary models (via Venice AI) ---
    "gpt-4o": {
        "provider": "venice",
        "model": "openai-gpt-4o-2024-11-20",
        "developer": "OpenAI",
        "open_source": False,
        "env_key": "AI_API_KEY",
        "base_url": VENICE_BASE_URL,
        "cost_per_1k_input": 0.00313,
        "cost_per_1k_output": 0.0125,
    },
    "claude-sonnet-4.6": {
        "provider": "venice",
        "model": "claude-sonnet-4-6",
        "developer": "Anthropic",
        "open_source": False,
        "env_key": "AI_API_KEY",
        "base_url": VENICE_BASE_URL,
        "cost_per_1k_input": 0.0036,
        "cost_per_1k_output": 0.018,
    },
    "gemini-3-pro": {
        "provider": "venice",
        "model": "gemini-3-pro-preview",
        "developer": "Google",
        "open_source": False,
        "env_key": "AI_API_KEY",
        "base_url": VENICE_BASE_URL,
        "cost_per_1k_input": 0.00125,
        "cost_per_1k_output": 0.005,
    },
    "grok-4.1": {
        "provider": "venice",
        "model": "grok-41-fast",
        "developer": "xAI",
        "open_source": False,
        "env_key": "AI_API_KEY",
        "base_url": VENICE_BASE_URL,
        "cost_per_1k_input": 0.003,
        "cost_per_1k_output": 0.015,
    },
}


# ============================================================
# Screening function for any model
# ============================================================

SYSTEM_PROMPT_TEMPLATE = """You are a Cochrane Screener conducting systematic review screening.

INCLUSION CRITERIA:
- Population (P): {P}
- Intervention (I): {I}
- Comparator (C): {C}
- Outcome (O): {O}
- Study Design (S): {S}
- Exclusion Criteria (E): {E}

TASK: Evaluate whether the following study meets the inclusion criteria.

You MUST respond with ONLY a valid JSON object (no markdown, no extra text) with this exact structure:
{{
  "ScreeningDecision": "INCLUDE" or "EXCLUDE" or "UNCLEAR",
  "Confidence_Score": <integer 0-100>,
  "Reasoning_Summary": "<brief explanation>",
  "Population_Check": true/false,
  "Intervention_Check": true/false,
  "Comparator_Check": true/false,
  "Outcome_Check": true/false,
  "StudyDesign_Check": true/false,
  "Exclusion_Check": true/false
}}
"""


def screen_with_model(text: str, pico: dict, config: dict) -> dict:
    """Screen a study using any supported model."""
    provider = config["provider"]
    model = config["model"]

    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(**pico)
    user_content = f"STUDY:\n{text[:15000]}"

    if provider in ("openai", "openrouter", "ollama", "venice"):
        from openai import OpenAI

        api_key = os.getenv(config.get("env_key", "")) or "dummy"
        base_url = config.get("base_url")
        client = OpenAI(api_key=api_key, base_url=base_url, timeout=120.0)

        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content},
                ],
                temperature=0.0,
                max_tokens=1000,
            )
            raw = response.choices[0].message.content.strip()
            # Parse JSON from response (handle markdown code blocks)
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            result = json.loads(raw)
        except Exception as e:
            return _error_result(str(e))

    elif provider == "anthropic":
        import anthropic

        api_key = os.getenv(config.get("env_key", ""))
        if not api_key:
            return _error_result("ANTHROPIC_API_KEY not set")

        client = anthropic.Anthropic(api_key=api_key)
        try:
            response = client.messages.create(
                model=model,
                max_tokens=1000,
                system=system_prompt,
                messages=[{"role": "user", "content": user_content}],
                temperature=0.0,
            )
            raw = response.content[0].text.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            result = json.loads(raw)
        except Exception as e:
            return _error_result(str(e))
    else:
        return _error_result(f"Unknown provider: {provider}")

    # Normalize the result
    decision = result.get("ScreeningDecision", "UNCLEAR")
    confidence = int(result.get("Confidence_Score", 0))

    if confidence < 85 and decision != "UNCLEAR":
        decision = "UNCLEAR"

    return {
        "decision": decision,
        "confidence": confidence,
        "reason": result.get("Reasoning_Summary", ""),
        "p_check": bool(result.get("Population_Check", False)),
        "i_check": bool(result.get("Intervention_Check", False)),
        "c_check": bool(result.get("Comparator_Check", False)),
        "o_check": bool(result.get("Outcome_Check", False)),
        "s_check": bool(result.get("StudyDesign_Check", False)),
        "e_check": bool(result.get("Exclusion_Check", False)),
    }


def _error_result(error: str) -> dict:
    return {
        "decision": "ERROR",
        "confidence": 0,
        "reason": f"Error: {error}",
        "p_check": False, "i_check": False, "c_check": False,
        "o_check": False, "s_check": False, "e_check": False,
    }


# ============================================================
# Benchmark runner
# ============================================================

def run_benchmark(csv_path: Path, model_names: list[str], protocols: dict,
                  max_studies: int = 0) -> dict:
    """Run benchmark across multiple models."""
    df = pd.read_csv(csv_path)
    if max_studies > 0:
        df = df.head(max_studies)

    print(f"\nBenchmarking {len(model_names)} models on {len(df)} studies")
    print(f"Ground truth: {len(df[df['ground_truth'] == 'INCLUDE'])} INCLUDE, "
          f"{len(df[df['ground_truth'] == 'EXCLUDE'])} EXCLUDE\n")

    all_results = {}

    for model_name in model_names:
        config = MODEL_CONFIGS.get(model_name)
        if not config:
            print(f"  SKIP: Unknown model '{model_name}'")
            continue

        # Check if API key is available
        env_key = config.get("env_key")
        if env_key and not os.getenv(env_key):
            print(f"  SKIP: {model_name} (missing {env_key})")
            continue

        print(f"  Running: {model_name} ({config['model']})...")
        start = time.time()
        model_decisions = []
        errors = 0

        for i, (_, row) in enumerate(df.iterrows()):
            review = row["review"]
            pico = protocols.get(review, {"P": "", "I": "", "C": "", "O": "", "S": "", "E": ""})
            text = f"Title: {row['title']}\nAbstract: {row['abstract']}" if pd.notna(row["abstract"]) else f"Title: {row['title']}"

            result = screen_with_model(text, pico, config)
            model_decisions.append(result)

            if result["decision"] == "ERROR":
                errors += 1

            if (i + 1) % 10 == 0:
                print(f"    [{i+1}/{len(df)}] errors so far: {errors}")

        elapsed = time.time() - start

        # Build results DataFrame
        result_df = df.copy()
        result_df["ai_decision"] = [r["decision"] for r in model_decisions]
        result_df["ai_confidence"] = [r["confidence"] for r in model_decisions]
        result_df["ai_reason"] = [r["reason"] for r in model_decisions]

        # Filter out errors for metrics
        valid = result_df[result_df["ai_decision"] != "ERROR"]
        standard = compute_standard_metrics(valid) if len(valid) > 0 else {}
        deference = compute_deference_metrics(valid) if len(valid) > 0 else {}

        meta = {
            "model": model_name,
            "provider": config["provider"],
            "model_id": config["model"],
            "elapsed_seconds": round(elapsed, 1),
            "seconds_per_study": round(elapsed / len(df), 2) if len(df) > 0 else 0,
            "errors": errors,
            "cost_estimate": round(
                config.get("cost_per_1k_input", 0) * len(df) * 0.5 +
                config.get("cost_per_1k_output", 0) * len(df) * 0.3,
                4
            ),
        }

        all_results[model_name] = {
            "standard": {**standard, **meta},
            "deference": {**deference, **meta},
            "details": result_df,
        }

        print(f"    Done in {elapsed:.0f}s | Std Sens: {standard.get('sensitivity', 'N/A')} | "
              f"DA Sens: {deference.get('da_sensitivity', 'N/A')} | "
              f"Deferred: {deference.get('deference_rate_pct', 0)}% | "
              f"Confident errors: {deference.get('total_confident_errors', '?')}")

    return all_results


def print_comparison(all_results: dict):
    """Print dual-framework comparison table across all models."""
    if not all_results:
        print("No results to compare.")
        return

    # Standard metrics table
    print(f"\n{'='*110}")
    print(f"  STANDARD METRICS (UNCLEAR = wrong)")
    print(f"{'='*110}")
    header = f"{'Model':<20} {'Sensitivity':>11} {'Specificity':>11} {'Precision':>9} {'F1':>6} {'Accuracy':>8} {'Work Saved':>10} {'Speed':>8} {'Cost':>8}"
    print(header)
    print("-" * 110)

    for name, data in all_results.items():
        s = data["standard"]
        print(f"{name:<20} {s.get('sensitivity',0):>10.1%} {s.get('specificity',0):>10.1%} "
              f"{s.get('precision',0):>8.1%} {s.get('f1_score',0):>5.1%} {s.get('accuracy',0):>7.1%} "
              f"{s.get('work_saved_pct',0):>9.1f}% {s.get('seconds_per_study',0):>6.1f}s "
              f"${s.get('cost_estimate',0):>6.4f}")

    # Deference-aware metrics table
    print(f"\n{'='*110}")
    print(f"  DEFERENCE-AWARE METRICS (UNCLEAR = correct deference)")
    print(f"{'='*110}")
    header = f"{'Model':<20} {'DA Sens':>8} {'DA Spec':>8} {'DA Acc':>7} {'Dec F1':>7} {'Deferred':>9} {'Errors':>7} {'Coverage':>9}"
    print(header)
    print("-" * 110)

    for name, data in all_results.items():
        d = data["deference"]
        print(f"{name:<20} {d.get('da_sensitivity',0):>7.1%} {d.get('da_specificity',0):>7.1%} "
              f"{d.get('da_accuracy',0):>6.1%} {d.get('decided_f1',0):>6.1%} "
              f"{d.get('deference_rate_pct',0):>7.1f}% "
              f"{d.get('total_confident_errors',0):>7} {d.get('effective_coverage_pct',0):>7.1f}%")

    print("-" * 110)

    # Best model analysis — only consider models with actual results
    models_with_data = [n for n in all_results if all_results[n]["deference"].get("total", 0) > 0]
    if models_with_data:
        safest = min(models_with_data, key=lambda n: all_results[n]["deference"].get("total_confident_errors", 999))
        sd = all_results[safest]["deference"]
        print(f"\n  Safest: {safest} (DA sensitivity={sd.get('da_sensitivity', 0):.1%}, "
              f"{sd.get('total_confident_errors', '?')} confident errors)")

        deciders = [n for n in models_with_data if all_results[n]["deference"].get("effective_coverage_pct", 0) > 50]
        if deciders:
            best_decider = max(deciders, key=lambda n: all_results[n]["deference"].get("decided_f1", 0))
            bd = all_results[best_decider]["deference"]
            print(f"  Best decider: {best_decider} (decided F1={bd.get('decided_f1', 0):.1%}, "
                  f"covers {bd.get('effective_coverage_pct', 0):.0f}% autonomously)")

    print()


def save_comparison(all_results: dict, tier_label: str):
    """Save comparison results for website publishing."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # Summary JSON
    summary = []
    for name, data in all_results.items():
        s = data["standard"]
        d = data["deference"]
        summary.append({
            "model": name,
            "model_id": s.get("model_id", ""),
            "provider": s.get("provider", ""),
            # Standard metrics
            "std_sensitivity": s.get("sensitivity", 0),
            "std_specificity": s.get("specificity", 0),
            "std_precision": s.get("precision", 0),
            "std_f1": s.get("f1_score", 0),
            "std_accuracy": s.get("accuracy", 0),
            "work_saved_pct": s.get("work_saved_pct", 0),
            # Deference-aware metrics
            "da_sensitivity": d.get("da_sensitivity", 0),
            "da_specificity": d.get("da_specificity", 0),
            "da_accuracy": d.get("da_accuracy", 0),
            "decided_sensitivity": d.get("decided_sensitivity", 0),
            "decided_specificity": d.get("decided_specificity", 0),
            "decided_f1": d.get("decided_f1", 0),
            "deference_rate_pct": d.get("deference_rate_pct", 0),
            "hard_misses": d.get("hard_misses", 0),
            "false_includes": d.get("false_includes", 0),
            "total_confident_errors": d.get("total_confident_errors", 0),
            "effective_coverage_pct": d.get("effective_coverage_pct", 0),
            # Meta
            "seconds_per_study": s.get("seconds_per_study", 0),
            "cost_estimate": s.get("cost_estimate", 0),
            "total_studies": s.get("total", 0),
            "errors": s.get("errors", 0),
        })

    out_path = RESULTS_DIR / f"benchmark_{tier_label}_{timestamp}.json"
    with open(out_path, "w") as f:
        json.dump({
            "benchmark_date": timestamp,
            "dataset": tier_label,
            "models": summary,
        }, f, indent=2)
    print(f"Benchmark saved to: {out_path}")

    # Per-model detail CSVs
    for name, data in all_results.items():
        detail_path = RESULTS_DIR / f"detail_{name}_{tier_label}_{timestamp}.csv"
        data["details"].to_csv(detail_path, index=False)

    return out_path


def main():
    parser = argparse.ArgumentParser(description="Multi-LLM Benchmark")
    parser.add_argument("--tier", type=int, choices=[1, 2, 3])
    parser.add_argument("--review", type=str)
    parser.add_argument("--models", type=str, help="Comma-separated model names")
    parser.add_argument("--max", type=int, default=0)
    parser.add_argument("--publish", action="store_true", help="Save website-ready comparison")
    parser.add_argument("--list", action="store_true", help="List available models")
    args = parser.parse_args()

    if args.list:
        print("\nAvailable models:")
        print(f"  {'Name':<20} {'Developer':<15} {'Model ID':<35} {'Type':<12} {'Status'}")
        print(f"  {'-'*20} {'-'*15} {'-'*35} {'-'*12} {'-'*10}")
        for name, config in MODEL_CONFIGS.items():
            env = config.get("env_key", "None")
            available = "ready" if not env or os.getenv(env) else f"needs {env}"
            oss = "open source" if config.get("open_source") else "proprietary"
            dev = config.get("developer", "?")
            print(f"  {name:<20} {dev:<15} {config['model']:<35} {oss:<12} [{available}]")
        return

    protocols = load_protocols()

    # Determine models to test
    if args.models:
        model_names = [m.strip() for m in args.models.split(",")]
    else:
        # Default: test all models that have API keys configured
        model_names = []
        for name, config in MODEL_CONFIGS.items():
            env_key = config.get("env_key")
            if not env_key or os.getenv(env_key):
                model_names.append(name)
        if not model_names:
            print("No models available. Set API keys in backend/.env")
            print("Run with --list to see available models and required keys.")
            return

    # Determine dataset
    if args.review:
        from synergy_dataset import Dataset
        ds = Dataset(args.review)
        df = ds.to_frame().reset_index().rename(columns={"openalex_id": "id"})
        df["ground_truth"] = df["label_included"].map({1: "INCLUDE", 0: "EXCLUDE"})
        df["review"] = args.review
        df = df[["id", "title", "abstract", "ground_truth", "review"]]
        csv_path = DATA_DIR / f"review_{args.review}.csv"
        df.to_csv(csv_path, index=False)
        tier_label = args.review
    elif args.tier:
        csv_path = DATA_DIR / f"tier{args.tier}_{'smoke_test' if args.tier == 1 else 'core_eval' if args.tier == 2 else 'full_benchmark'}.csv"
        tier_label = f"tier{args.tier}"
    else:
        print("Specify --tier or --review")
        return

    if not csv_path.exists():
        print(f"ERROR: {csv_path} not found. Run prepare_data.py first.")
        return

    # Run benchmark
    results = run_benchmark(csv_path, model_names, protocols, max_studies=args.max)

    # Display comparison
    print_comparison(results)

    # Save results
    if args.publish or True:  # Always save
        save_comparison(results, tier_label)


if __name__ == "__main__":
    main()
