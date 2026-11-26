"""환경변수 설정. 로컬은 루트 .env, 운영은 Vercel 환경변수에서 읽어요."""

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

try:  # 로컬 개발에서만 .env를 읽어요 (Vercel에는 python-dotenv가 없어요)
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parents[2] / ".env")
except ImportError:
    pass


def _bool(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(default)).strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    database_url: str
    gemini_api_key: str
    gemini_model: str
    vision_mock: bool
    detect_daily_limit: int
    max_images: int = 3
    max_image_bytes: int = 4 * 1024 * 1024  # Vercel 요청 본문 한도 4.5MB 안쪽


@lru_cache
def get_settings() -> Settings:
    key = os.getenv("GEMINI_API_KEY", "")
    return Settings(
        # Vercel·Neon 연동은 DATABASE_URL을, 일부 템플릿은 POSTGRES_URL을 넣어 줘요
        database_url=os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL") or "",
        gemini_api_key=key,
        gemini_model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
        # 키가 없으면 자동으로 모의 모드
        vision_mock=_bool("VISION_MOCK") or not key,
        detect_daily_limit=int(os.getenv("DETECT_DAILY_LIMIT", "30")),
    )
