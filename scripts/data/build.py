"""규칙 기반 정리(parsed.json) + LLM 보강(cache) → data/recipes.json

  python scripts/data/build.py [--provider exaone|gemini]

보강 캐시가 있는 레시피는 그 값을, 없으면 규칙 기반 값을 써요.
images.py로 줄여 둔 사진이 있으면 imageUrl을 /r/{id}.webp로 바꿔요.
만든 파일은 scripts/data/seed_db.py로 DB(로컬·Neon)에 넣어요.
"""

import argparse
import json
from collections import Counter

from common import CACHE, OUT, PARSED, ROOT

IMG_DIR = ROOT / "frontend" / "public" / "r"  # images.py가 만든 카드 크기 사진


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--provider", choices=["exaone", "gemini"], default="exaone")
    args = p.parse_args()

    parsed = json.loads(PARSED.read_text(encoding="utf-8"))
    cache_dir = CACHE / args.provider
    out, enriched, local_img = [], 0, 0
    for r in parsed:
        r = {k: v for k, v in r.items() if k != "rawIngredients"}
        cached = cache_dir / f"{r['id']}.json"
        if cached.exists():
            r.update(json.loads(cached.read_text(encoding="utf-8")))
            enriched += 1
        if (IMG_DIR / f"{r['id']}.webp").exists():  # 줄여 둔 사진이 있으면 그걸 써요 (Vercel CDN)
            r["imageUrl"] = f"/r/{r['id']}.webp"
            local_img += 1
        if not r["summary"]:
            r["summary"] = f"{r['method'] or '집에서'} 만드는 {r['name']}".replace("기타 ", "")
        out.append(r)

    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    cats = Counter(r["category"] for r in out)
    print(f"{len(out)}개 저장 (LLM 보강 {enriched}개 · 줄인 사진 {local_img}개) → data/recipes.json")
    print("요리 종류:", ", ".join(f"{k} {v}" for k, v in cats.most_common()))


if __name__ == "__main__":
    main()
