"""레시피 대표 사진을 한 번만 내려받아 카드 크기 WebP로 줄여 저장해요.

  python scripts/data/images.py            # 없는 것만 받아요 (다시 실행하면 이어서)

왜 필요한가요?
- 식약처 원본 사진 중에는 한 장에 14~31MB짜리가 있어서 그대로 쓰면 홈 화면만 100MB가 넘어요.
- 식약처 서버가 해외 이미지 프록시(wsrv.nl 등)의 요청은 시간 초과로 막아서, 국내에서 미리 줄여 둬요.
결과: frontend/public/r/{id}.webp (4:3, 최대 640×480, 평균 20~30KB) → Vercel CDN에서 바로 서빙.
build.py가 이 파일이 있으면 imageUrl을 /r/{id}.webp로 바꿔요.
"""

import io
import json
import threading
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor

from common import PARSED, ROOT

from PIL import Image

OUT_DIR = ROOT / "frontend" / "public" / "r"
SIZE = (640, 480)


def to_card(data: bytes) -> bytes:
    im = Image.open(io.BytesIO(data))
    im.draft("RGB", (SIZE[0] * 2, SIZE[1] * 2))  # 큰 JPEG는 디코딩 단계에서 미리 줄여 빨라져요
    im = im.convert("RGB")
    # 가운데를 4:3으로 자르기
    w, h = im.size
    target = SIZE[0] / SIZE[1]
    if w / h > target:
        nw = int(h * target)
        im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else:
        nh = int(w / target)
        im = im.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
    im.thumbnail(SIZE, Image.Resampling.LANCZOS)  # 작은 원본은 키우지 않아요
    out = io.BytesIO()
    im.save(out, "WEBP", quality=72, method=5)
    return out.getvalue()


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    recipes = json.loads(PARSED.read_text(encoding="utf-8"))
    todo = [(r["id"], r["imageUrl"]) for r in recipes if r.get("imageUrl") and not (OUT_DIR / f"{r['id']}.webp").exists()]
    print(f"전체 {len(recipes)}개 · 새로 받을 사진 {len(todo)}개")
    lock = threading.Lock()
    stats = {"ok": 0, "fail": 0, "in": 0, "out": 0}
    t0 = time.monotonic()

    def run(item: tuple[int, str]) -> None:
        rid, url = item
        for attempt in range(3):
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (ClickChef image prep)"})
                data = urllib.request.urlopen(req, timeout=90).read()
                webp = to_card(data)
                (OUT_DIR / f"{rid}.webp").write_bytes(webp)
                with lock:
                    stats["ok"] += 1
                    stats["in"] += len(data)
                    stats["out"] += len(webp)
                    n = stats["ok"] + stats["fail"]
                    if n % 50 == 0:
                        print(f"  {n}/{len(todo)} · 원본 {stats['in'] / 1e6:.0f}MB → {stats['out'] / 1e6:.1f}MB · {time.monotonic() - t0:.0f}초")
                return
            except Exception as e:  # 공공 서버가 가끔 느려요
                if attempt == 2:
                    with lock:
                        stats["fail"] += 1
                        print(f"  실패 {rid}: {type(e).__name__}")
                time.sleep(2 * (attempt + 1))

    with ThreadPoolExecutor(max_workers=8) as pool:
        list(pool.map(run, todo))
    print(f"끝: 성공 {stats['ok']} · 실패 {stats['fail']} · 원본 {stats['in'] / 1e6:.0f}MB → {stats['out'] / 1e6:.1f}MB")


if __name__ == "__main__":
    main()
