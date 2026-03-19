from pydantic_settings import BaseSettings
from pydantic import model_validator
from functools import lru_cache


class Settings(BaseSettings):
    SUPABASE_URL: str = ""
    SUPABASE_SECRET_KEY: str = ""

    # AI Provider: "openai", "venice", "openrouter", or any OpenAI-compatible endpoint
    AI_PROVIDER: str = "openai"
    AI_API_KEY: str = ""          # Works for any provider
    AI_BASE_URL: str = ""         # Leave empty for OpenAI default, or set custom endpoint
    AI_MODEL_LEVEL1: str = "gpt-4o-mini"
    AI_MODEL_LEVEL2: str = "gpt-4o-2024-08-06"
    AI_MODEL_EXTRACTION: str = "gpt-4o-2024-08-06"

    # Legacy: still accepted so existing .env files don't break
    OPENAI_API_KEY: str = ""

    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    model_config = {"env_file": ".env", "extra": "ignore"}

    @model_validator(mode="after")
    def validate_required(self):
        # AI_API_KEY takes priority, fall back to OPENAI_API_KEY for backwards compat
        if not self.AI_API_KEY and self.OPENAI_API_KEY:
            self.AI_API_KEY = self.OPENAI_API_KEY

        missing = []
        if not self.SUPABASE_URL:
            missing.append("SUPABASE_URL")
        if not self.AI_API_KEY:
            missing.append("AI_API_KEY (or OPENAI_API_KEY)")
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
