from pydantic_settings import BaseSettings
from pydantic import model_validator
from functools import lru_cache


class Settings(BaseSettings):
    SUPABASE_URL: str = ""
    SUPABASE_SECRET_KEY: str = ""

    # AI Configuration — OpenRouter is the primary provider
    OPENROUTER_API_KEY: str = ""
    AI_API_KEY: str = ""          # Fallback if OPENROUTER_API_KEY not set
    OPENAI_API_KEY: str = ""      # Legacy fallback

    # Provider config (auto-set for OpenRouter)
    AI_PROVIDER: str = "openrouter"
    AI_BASE_URL: str = ""

    # Models for PICO extraction and meta-miner (OpenRouter model IDs)
    PICO_MODEL: str = "meta-llama/llama-3.3-70b-instruct"
    MINING_MODEL: str = "meta-llama/llama-3.3-70b-instruct"

    # Legacy aliases (mapped to new names in validator)
    AI_MODEL_LEVEL1: str = ""
    AI_MODEL_LEVEL2: str = ""
    AI_MODEL_EXTRACTION: str = ""

    # Screening strategy (uses model registry, not these model IDs)
    SCREENING_STRATEGY: str = "mixed_model"
    SCREENING_MODEL_A: str = "llama-3.3-70b"
    SCREENING_MODEL_B: str = "deepseek-v3"

    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    model_config = {"env_file": ".env", "extra": "ignore"}

    @model_validator(mode="after")
    def validate_required(self):
        # Cascade API keys: OPENROUTER > AI_API_KEY > OPENAI_API_KEY
        if not self.OPENROUTER_API_KEY and self.AI_API_KEY:
            self.OPENROUTER_API_KEY = self.AI_API_KEY
        if not self.AI_API_KEY and self.OPENAI_API_KEY:
            self.AI_API_KEY = self.OPENAI_API_KEY
        if not self.AI_API_KEY and self.OPENROUTER_API_KEY:
            self.AI_API_KEY = self.OPENROUTER_API_KEY

        # Legacy model name overrides
        if self.AI_MODEL_EXTRACTION:
            self.PICO_MODEL = self.AI_MODEL_EXTRACTION
        if self.AI_MODEL_LEVEL1:
            self.MINING_MODEL = self.AI_MODEL_LEVEL1

        missing = []
        if not self.SUPABASE_URL:
            missing.append("SUPABASE_URL")
        if not self.OPENROUTER_API_KEY and not self.AI_API_KEY:
            missing.append("OPENROUTER_API_KEY (or AI_API_KEY)")
        if missing:
            raise ValueError(f"Missing required environment variables: {', '.join(missing)}")

        # Set default base URL for OpenRouter
        if not self.AI_BASE_URL:
            provider_urls = {
                "venice": "https://api.venice.ai/api/v1",
                "openrouter": "https://openrouter.ai/api/v1",
            }
            self.AI_BASE_URL = provider_urls.get(self.AI_PROVIDER, "")

        return self


@lru_cache()
def get_settings() -> Settings:
    return Settings()
