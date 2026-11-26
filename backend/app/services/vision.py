"""사진 → 재료 목록. 실제 인식은 llm/gemini.py가 하고, 여기서는 이름 맞추기와 나누기를 해요."""

from dataclasses import dataclass

from ..config import get_settings
from .normalize import normalize_name

# 이 값보다 확신이 낮으면 "이것도 있나요?"로 보여요
UNCERTAIN_BELOW = 0.6


@dataclass(frozen=True)
class Image:
    data: bytes
    mime_type: str


# Gemini 키가 없을 때 쓰는 모의 결과 (디자인 03 재료 확인 화면과 같은 재료)
MOCK_RESULT: list[tuple[str, float]] = [
    ("김치", 0.95),
    ("달걀", 0.93),
    ("양파", 0.9),
    ("대파", 0.88),
    ("스팸", 0.86),
    ("밥", 0.8),
    ("두부", 0.5),
    ("애호박", 0.45),
]


def detect(images: list[Image], vocabulary: list[str]) -> tuple[list[tuple[str, float]], list[tuple[str, float]]]:
    settings = get_settings()
    if settings.vision_mock:
        raw = MOCK_RESULT
    else:
        from ..llm.gemini import detect_ingredients  # 무거운 SDK는 필요할 때만 불러와요

        raw = detect_ingredients(images, vocabulary)

    best: dict[str, float] = {}
    for name, conf in raw:
        key = normalize_name(name)
        if key:
            best[key] = max(best.get(key, 0.0), conf)
    items = sorted(best.items(), key=lambda kv: -kv[1])
    found = [(n, c) for n, c in items if c >= UNCERTAIN_BELOW]
    uncertain = [(n, c) for n, c in items if c < UNCERTAIN_BELOW]
    return found, uncertain
