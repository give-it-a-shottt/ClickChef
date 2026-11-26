"""Gemini 호출은 이 파일 하나에만 있어요. 다른 모델로 바꿀 때 이 파일만 고치면 돼요."""

from ..services.vision import Image


def detect_ingredients(images: list[Image], vocabulary: list[str]) -> list[tuple[str, float]]:
    raise NotImplementedError("M8에서 연결해요. 지금은 VISION_MOCK=1로 실행하세요.")
