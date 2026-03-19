from pydantic_settings import BaseSettings
from pydantic import model_validator
from functools import lru_cache


class Settings(BaseSettings):
    SUPABASE_URL: str = ""
    SUPABASE_SECRET_KEY: str = ""  # sb_secret_... (replaces legacy service_role key)
    SUPABASE_JWT_SECRET: str = ""  # From Dashboard > Settings > Signing Keys
    OPENAI_API_KEY: str = ""
    AI_PROVIDER: str = "openai"
    AI_MODEL_LEVEL1: str = "gpt-4o-mini"
    AI_MODEL_LEVEL2: str = "gpt-4o-2024-08-06"
    AI_MODEL_EXTRACTION: str = "gpt-4o-2024-08-06"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    model_config = {"env_file": ".env", "extra": "ignore"}

    @model_validator(mode="after")
    def validate_required(self):
        missing = []
        if not self.SUPABASE_JWT_SECRET:
            missing.append("SUPABASE_JWT_SECRET")
        if not self.OPENAI_API_KEY:
            missing.append("OPENAI_API_KEY")
        if missing:
            raise ValueError(f"Missing required environment variables: {', '.join(missing)}")
        return self


@lru_cache()
def get_settings() -> Settings:
    return Settings()
