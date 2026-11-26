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


class EnsureApiPrefix:
    """Vercel Services가 /api를 떼고 넘겨줘도 같은 라우트로 찾도록 경로 앞에 /api를 붙여요."""

    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http" and not scope["path"].startswith("/api"):
            scope = {**scope, "path": "/api" + scope["path"], "raw_path": b"/api" + scope.get("raw_path", b"")}
        await self.inner(scope, receive, send)


app.add_middleware(EnsureApiPrefix)
