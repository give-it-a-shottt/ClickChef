"""찰칵셰프 API (FastAPI). 모든 경로는 /api 아래에 있어요."""

import os

from fastapi import APIRouter, FastAPI
from fastapi.middleware.gzip import GZipMiddleware

from .config import get_settings
from .repositories import recipes as repo
from .routers import ingredients, recipes

app = FastAPI(
    title="ClickChef API",
    version="0.1.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    redoc_url=None,
)
app.add_middleware(GZipMiddleware, minimum_size=1024)

api = APIRouter(prefix=os.getenv("API_PREFIX", "/api"))
api.include_router(recipes.router)
api.include_router(ingredients.router)


@api.get("/health", tags=["system"])
def health() -> dict[str, object]:
    """배포 확인용. DB 연결까지 확인해요."""
    try:
        db_ok = repo.ping()
    except Exception:
        db_ok = False
    return {"ok": db_ok, "db": db_ok, "visionMock": get_settings().vision_mock}


app.include_router(api)
