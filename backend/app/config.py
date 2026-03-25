from pydantic_settings import BaseSettings
from pydantic import model_validator
from functools import lru_cache


class Settings(BaseSettings):
    SUPABASE_URL: str = ""
    SUPABASE_SECRET_KEY: str = ""

    # AI Configuration
    AI_API_KEY: str = ""          # Default API key (used if model-specific key not set)
    OPENROUTER_API_KEY: str = ""  # OpenRouter API key (primary for production)

    # Legacy: used by ai_provider.py for PICO extraction and mining only
    OPENAI_API_KEY: str = ""
    AI_PROVIDER: str = "openrouter"
    AI_BASE_URL: str = ""
    AI_MODEL_LEVEL1: str = "llama-3.3-70b"    # Legacy: PICO/mining model
    AI_MODEL_LEVEL2: str = "llama-3.3-70b"    # Legacy: PICO/mining model
    AI_MODEL_EXTRACTION: str = "llama-3.3-70b" # Legacy: PICO extraction model

    # Screening strategy defaults
    SCREENING_STRATEGY: str = "mixed_model"  # single, same_model_dual, mixed_model
    SCREENING_MODEL_A: str = "llama-3.3-70b"  # High sensitivity model
    SCREENING_MODEL_B: str = "deepseek-v3"    # High specificity model

    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    model_config = {"env_file": ".env", "extra": "ignore"}

    @model_validator(mode="after")
    def validate_required(self):
        # Cascade API keys: OPENROUTER > AI_API_KEY > OPENAI_API_KEY
        if not self.OPENROUTER_API_KEY and self.AI_API_KEY:
            self.OPENROUTER_API_KEY = self.AI_API_KEY
        if not self.AI_API_KEY and self.OPENAI_API_KEY:
            self.AI_API_KEY = self.OPENAI_API_KEY

        missing = []
        if not self.SUPABASE_URL:
            missing.append("SUPABASE_URL")
        if not self.OPENROUTER_API_KEY and not self.AI_API_KEY:
            missing.append("OPENROUTER_API_KEY (or AI_API_KEY)")
        if missing:
            raise ValueError(f"Missing required environment variables: {', '.join(missing)}")

        # Set default base URLs for known providers
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
