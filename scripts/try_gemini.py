"""Gemini 키가 잘 동작하는지 사진 한 장으로 확인해요.

  python scripts/try_gemini.py 냉장고.jpg

루트 .env에 GEMINI_API_KEY가 있어야 해요. 결과: 찾은 재료 / 확인 필요 재료.
"""

import mimetypes
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
os.environ["VISION_MOCK"] = "0"

from app.services import vision  # noqa: E402


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit("사용법: python scripts/try_gemini.py <사진 경로>")
    path = Path(sys.argv[1])
    mime = mimetypes.guess_type(path.name)[0] or "image/jpeg"
    found, uncertain = vision.detect([vision.Image(path.read_bytes(), mime)], [])
    print("찾은 재료:", ", ".join(f"{n}({c:.2f})" for n, c in found) or "없음")
    print("확인 필요:", ", ".join(f"{n}({c:.2f})" for n, c in uncertain) or "없음")


if __name__ == "__main__":
    main()
