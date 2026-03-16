from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import screening, pico, mining

settings = get_settings()

app = FastAPI(
    title="AI Evidence Synthesis API",
    description="Backend API for AI-powered systematic review screening",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(screening.router)
app.include_router(pico.router)
app.include_router(mining.router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
