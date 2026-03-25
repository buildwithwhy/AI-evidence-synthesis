"""Model registry: configurable model definitions for screening.

Models can be registered at startup from config, added at runtime,
or overridden per-project. Each model is an OpenAI-compatible endpoint
with a model ID, base URL, and API key.
"""

import os
import logging
from dataclasses import dataclass, field
from typing import Dict, Optional

logger = logging.getLogger(__name__)

PROVIDER_URLS = {
    "openai": None,  # Uses OpenAI default
    "openrouter": "https://openrouter.ai/api/v1",
    "venice": "https://api.venice.ai/api/v1",
    "ollama": "http://localhost:11434/v1",
}


@dataclass
class ModelConfig:
    """Configuration for a single LLM model."""
    name: str                    # Display name (e.g., "llama-3.3-70b")
    model_id: str                # API model ID (e.g., "meta-llama/llama-3.3-70b-instruct")
    provider: str = "openrouter" # Provider name (for base URL lookup)
    base_url: Optional[str] = None  # Override base URL (auto-set from provider if None)
    api_key_env: str = "AI_API_KEY"  # Env var name for API key
    developer: str = ""          # Model developer (e.g., "Meta")
    open_source: bool = True
    tier: str = "free"           # "free" or "institutional"

    def get_api_key(self) -> str:
        return os.getenv(self.api_key_env, "")

    def get_base_url(self) -> Optional[str]:
        if self.base_url:
            return self.base_url
        return PROVIDER_URLS.get(self.provider)


# ============================================================
# Default model registry
# ============================================================

_registry: Dict[str, ModelConfig] = {}


def register_model(config: ModelConfig):
    """Register a model configuration."""
    _registry[config.name] = config
    logger.info(f"Registered model: {config.name} ({config.model_id} via {config.provider})")


def get_model(name: str) -> ModelConfig:
    """Get a registered model by name."""
    if name not in _registry:
        raise ValueError(f"Model '{name}' not registered. Available: {list(_registry.keys())}")
    return _registry[name]


def list_models(tier: Optional[str] = None) -> list:
    """List all registered models, optionally filtered by tier."""
    models = list(_registry.values())
    if tier:
        models = [m for m in models if m.tier == tier]
    return models


def register_defaults():
    """Register the default model set from eval results."""

    # --- Free tier: open source models via OpenRouter ---
    register_model(ModelConfig(
        name="llama-3.3-70b",
        model_id="meta-llama/llama-3.3-70b-instruct",
        provider="openrouter",
        api_key_env="OPENROUTER_API_KEY",
        developer="Meta",
        open_source=True,
        tier="free",
    ))
    register_model(ModelConfig(
        name="deepseek-v3",
        model_id="deepseek/deepseek-v3.2",
        provider="openrouter",
        api_key_env="OPENROUTER_API_KEY",
        developer="DeepSeek",
        open_source=True,
        tier="free",
    ))
    register_model(ModelConfig(
        name="kimi-k2",
        model_id="moonshotai/kimi-k2",
        provider="openrouter",
        api_key_env="OPENROUTER_API_KEY",
        developer="Moonshot AI",
        open_source=True,
        tier="free",
    ))
    register_model(ModelConfig(
        name="mistral-3.1-24b",
        model_id="mistralai/mistral-small-3.1-24b-instruct",
        provider="openrouter",
        api_key_env="OPENROUTER_API_KEY",
        developer="Mistral AI",
        open_source=True,
        tier="free",
    ))
    register_model(ModelConfig(
        name="gemma-3-27b",
        model_id="google/gemma-3-27b-it",
        provider="openrouter",
        api_key_env="OPENROUTER_API_KEY",
        developer="Google",
        open_source=True,
        tier="free",
    ))

    # --- Institutional tier: proprietary models ---
    register_model(ModelConfig(
        name="claude-sonnet-4.6",
        model_id="anthropic/claude-sonnet-4.6",
        provider="openrouter",
        api_key_env="OPENROUTER_API_KEY",
        developer="Anthropic",
        open_source=False,
        tier="institutional",
    ))
    register_model(ModelConfig(
        name="gpt-4o",
        model_id="openai/gpt-4o",
        provider="openrouter",
        api_key_env="OPENROUTER_API_KEY",
        developer="OpenAI",
        open_source=False,
        tier="institutional",
    ))

    # Also register Venice variants if AI_API_KEY is set (legacy support)
    if os.getenv("AI_API_KEY"):
        register_model(ModelConfig(
            name="venice-llama",
            model_id="llama-3.3-70b",
            provider="venice",
            api_key_env="AI_API_KEY",
            developer="Meta",
            open_source=True,
            tier="free",
        ))


# Auto-register defaults on import
register_defaults()
