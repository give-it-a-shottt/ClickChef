import logging

from fastapi import APIRouter, File, HTTPException, Request, UploadFile

from ..config import get_settings
from ..repositories import rate_limit
from ..repositories import recipes as repo
from ..schemas import DetectedItem, DetectResponse
from ..services import vision

router = APIRouter(prefix="/ingredients", tags=["ingredients"])
log = logging.getLogger(__name__)

ALLOWED = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"}


def client_ip(request: Request) -> str:
    # Vercel은 실제 접속 IP를 x-forwarded-for 첫 번째 값으로 넘겨줘요
    fwd = request.headers.get("x-forwarded-for", "")
    return fwd.split(",")[0].strip() or (request.client.host if request.client else "unknown")


@router.post("/detect", response_model=DetectResponse, response_model_by_alias=True)
async def detect(request: Request, images: list[UploadFile] = File(...)) -> DetectResponse:
    s = get_settings()
    if not images:
        raise HTTPException(400, "사진을 한 장 이상 올려 주세요")
    if len(images) > s.max_images:
        raise HTTPException(400, f"사진은 {s.max_images}장까지 올릴 수 있어요")

    if rate_limit.hit(client_ip(request)) > s.detect_daily_limit:
        raise HTTPException(429, "오늘은 사진 인식을 많이 했어요. 내일 다시 시도하거나 재료를 직접 입력해 주세요")

    payload: list[vision.Image] = []
    for f in images:
        mime = (f.content_type or "").lower()
        if mime not in ALLOWED:
            raise HTTPException(415, "JPG·PNG·HEIC 사진만 올릴 수 있어요")
        data = await f.read()
        if len(data) > s.max_image_bytes:
            raise HTTPException(413, "사진이 너무 커요. 한 장에 4MB 이하로 올려 주세요")
        payload.append(vision.Image(data=data, mime_type=mime))

    try:
        found, uncertain = vision.detect(payload, repo.ingredient_vocabulary())
    except Exception:
        log.exception("재료 인식 실패")
        raise HTTPException(502, "사진을 분석하지 못했어요. 잠시 후 다시 시도해 주세요") from None

    return DetectResponse(
        found=[DetectedItem(name=n, confidence=c) for n, c in found],
        uncertain=[DetectedItem(name=n, confidence=c) for n, c in uncertain],
    )
