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
from run_eval import compute_metrics, print_metrics, load_protocols


# ============================================================
# Model Configurations
# ============================================================

MODEL_CONFIGS = {
    # OpenAI models
    "gpt-4o": {
        "provider": "openai",
        "model": "gpt-4o-2024-08-06",
        "env_key": "OPENAI_API_KEY",
        "cost_per_1k_input": 0.0025,
        "cost_per_1k_output": 0.01,
    },
    "gpt-4o-mini": {
        "provider": "openai",
        "model": "gpt-4o-mini",
        "env_key": "OPENAI_API_KEY",
        "cost_per_1k_input": 0.00015,
        "cost_per_1k_output": 0.0006,
    },
    # Anthropic models
    "claude-sonnet": {
        "provider": "anthropic",
        "model": "claude-sonnet-4-20250514",
        "env_key": "ANTHROPIC_API_KEY",
        "cost_per_1k_input": 0.003,
        "cost_per_1k_output": 0.015,
    },
    "claude-haiku": {
        "provider": "anthropic",
        "model": "claude-haiku-4-5-20251001",
        "env_key": "ANTHROPIC_API_KEY",
        "cost_per_1k_input": 0.0008,
        "cost_per_1k_output": 0.004,
    },
    # Open source via OpenRouter (or any OpenAI-compatible endpoint)
    "llama-3.1-70b": {
        "provider": "openrouter",
        "model": "meta-llama/llama-3.1-70b-instruct",
        "env_key": "OPENROUTER_API_KEY",
        "base_url": "https://openrouter.ai/api/v1",
        "cost_per_1k_input": 0.00059,
        "cost_per_1k_output": 0.00079,
    },
    "llama-3.1-8b": {
        "provider": "openrouter",
        "model": "meta-llama/llama-3.1-8b-instruct",
        "env_key": "OPENROUTER_API_KEY",
        "base_url": "https://openrouter.ai/api/v1",
        "cost_per_1k_input": 0.00006,
        "cost_per_1k_output": 0.00006,
    },
    "mistral-large": {
        "provider": "openrouter",
        "model": "mistralai/mistral-large-latest",
        "env_key": "OPENROUTER_API_KEY",
        "base_url": "https://openrouter.ai/api/v1",
        "cost_per_1k_input": 0.002,
        "cost_per_1k_output": 0.006,
    },
    "deepseek-v3": {
        "provider": "openrouter",
        "model": "deepseek/deepseek-chat",
        "env_key": "OPENROUTER_API_KEY",
        "base_url": "https://openrouter.ai/api/v1",
        "cost_per_1k_input": 0.00014,
        "cost_per_1k_output": 0.00028,
    },
    # Local models via Ollama
    "ollama-llama3": {
        "provider": "ollama",
        "model": "llama3",
        "env_key": None,
        "base_url": "http://localhost:11434/v1",
        "cost_per_1k_input": 0,
        "cost_per_1k_output": 0,
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

    if provider in ("openai", "openrouter", "ollama"):
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
        metrics = compute_metrics(valid) if len(valid) > 0 else {}

        metrics["model"] = model_name
        metrics["provider"] = config["provider"]
        metrics["model_id"] = config["model"]
        metrics["elapsed_seconds"] = round(elapsed, 1)
        metrics["seconds_per_study"] = round(elapsed / len(df), 2) if len(df) > 0 else 0
        metrics["errors"] = errors
        metrics["cost_estimate"] = round(
            config.get("cost_per_1k_input", 0) * len(df) * 0.5 +  # ~500 tokens input avg
            config.get("cost_per_1k_output", 0) * len(df) * 0.3,   # ~300 tokens output avg
            4
        )

        all_results[model_name] = {
            "metrics": metrics,
            "details": result_df,
        }

        print(f"    Done in {elapsed:.0f}s | Sensitivity: {metrics.get('sensitivity_recall', 'N/A')} | "
              f"Specificity: {metrics.get('specificity', 'N/A')} | Errors: {errors}")

    return all_results


def print_comparison(all_results: dict):
    """Print a comparison table across all models."""
    if not all_results:
        print("No results to compare.")
        return

    print(f"\n{'='*100}")
    print(f"  MODEL COMPARISON")
    print(f"{'='*100}")

    header = f"{'Model':<20} {'Sensitivity':>11} {'Specificity':>11} {'Precision':>9} {'F1':>6} {'Accuracy':>8} {'Work Saved':>10} {'Speed':>8} {'Cost':>8} {'Errors':>6}"
    print(header)
    print("-" * 100)

    rows = []
    for name, data in all_results.items():
        m = data["metrics"]
        row = {
            "model": name,
            "sensitivity": m.get("sensitivity_recall", 0),
            "specificity": m.get("specificity", 0),
            "precision": m.get("precision", 0),
            "f1": m.get("f1_score", 0),
            "accuracy": m.get("accuracy", 0),
            "work_saved": m.get("work_saved_pct", 0),
            "speed": m.get("seconds_per_study", 0),
            "cost": m.get("cost_estimate", 0),
            "errors": m.get("errors", 0),
        }
        rows.append(row)
        print(f"{name:<20} {row['sensitivity']:>10.1%} {row['specificity']:>10.1%} "
              f"{row['precision']:>8.1%} {row['f1']:>5.1%} {row['accuracy']:>7.1%} "
              f"{row['work_saved']:>9.1f}% {row['speed']:>6.1f}s ${row['cost']:>6.4f} {row['errors']:>6}")

    print("-" * 100)

    # Highlight best model
    if rows:
        best = max(rows, key=lambda r: (r["sensitivity"], r["f1"]))
        print(f"\n  Best overall: {best['model']} "
              f"(sensitivity={best['sensitivity']:.1%}, F1={best['f1']:.1%})")

        cheapest = min(rows, key=lambda r: r["cost"] if r["cost"] > 0 else float("inf"))
        if cheapest["cost"] > 0:
            print(f"  Most cost-effective: {cheapest['model']} "
                  f"(${cheapest['cost']:.4f}/run, sensitivity={cheapest['sensitivity']:.1%})")

    print()


def save_comparison(all_results: dict, tier_label: str):
    """Save comparison results for website publishing."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # Summary JSON
    summary = []
    for name, data in all_results.items():
        m = data["metrics"]
        summary.append({
            "model": name,
            "model_id": m.get("model_id", ""),
            "provider": m.get("provider", ""),
            "sensitivity": m.get("sensitivity_recall", 0),
            "specificity": m.get("specificity", 0),
            "precision": m.get("precision", 0),
            "f1_score": m.get("f1_score", 0),
            "accuracy": m.get("accuracy", 0),
            "work_saved_pct": m.get("work_saved_pct", 0),
            "seconds_per_study": m.get("seconds_per_study", 0),
            "cost_estimate": m.get("cost_estimate", 0),
            "total_studies": m.get("total", 0),
            "errors": m.get("errors", 0),
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
        for name, config in MODEL_CONFIGS.items():
            env = config.get("env_key", "None")
            available = "available" if not env or os.getenv(env) else f"needs {env}"
            print(f"  {name:<20} {config['provider']:<12} {config['model']:<40} [{available}]")
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
