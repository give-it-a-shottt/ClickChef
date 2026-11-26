"""데이터 파이프라인 공통 경로·설정."""

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "data" / "raw" / "cookrcp01.json"
PARSED = ROOT / "data" / "raw" / "parsed.json"
CACHE = ROOT / "data" / "cache"
OUT = ROOT / "data" / "recipes.json"

sys.path.insert(0, str(ROOT / "backend"))

try:
    from dotenv import load_dotenv

    load_dotenv(ROOT / ".env")
except ImportError:
    pass


def env(name: str, default: str = "") -> str:
    return os.getenv(name, default).strip()
