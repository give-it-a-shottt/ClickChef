"""식약처 식품안전나라 '조리식품의 레시피 DB'(COOKRCP01) 전체를 받아요.

  python scripts/data/fetch_mfds.py

.env의 MFDS_API_KEY를 써요 (없으면 sample 키 → 5건만 받아져요).
한 번에 최대 1000건씩 끊어 받고, 결과는 data/raw/cookrcp01.json에 저장해요 (커밋하지 않아요).
"""

import json
import time
import urllib.request

from common import RAW, env

BASE = "https://openapi.foodsafetykorea.go.kr/api/{key}/COOKRCP01/json/{start}/{end}"
PAGE = 1000


def get(key: str, start: int, end: int) -> dict:
    url = BASE.format(key=key, start=start, end=end)
    for attempt in range(3):
        try:
            with urllib.request.urlopen(url, timeout=60) as r:
                return json.loads(r.read().decode("utf-8"))["COOKRCP01"]
        except Exception as e:  # 공공 API는 가끔 느려요 — 잠깐 쉬고 다시
            if attempt == 2:
                raise
            print(f"  다시 시도 ({e})")
            time.sleep(3 * (attempt + 1))
    raise RuntimeError("unreachable")


def main() -> None:
    key = env("MFDS_API_KEY", "sample")
    first = get(key, 1, 5 if key == "sample" else PAGE)
    total = int(first["total_count"])
    rows = list(first.get("row", []))
    print(f"전체 {total}건 (키: {'sample' if key == 'sample' else '발급 키'})")
    if key != "sample":
        for start in range(PAGE + 1, total + 1, PAGE):
            end = min(start + PAGE - 1, total)
            print(f"  {start}~{end} 받는 중")
            rows += get(key, start, end).get("row", [])
            time.sleep(0.5)
    RAW.parent.mkdir(parents=True, exist_ok=True)
    RAW.write_text(json.dumps(rows, ensure_ascii=False), encoding="utf-8")
    print(f"{len(rows)}건 저장 → {RAW.relative_to(RAW.parents[2])}")


if __name__ == "__main__":
    main()
