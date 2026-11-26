"""LLM으로 레시피 보강 — 식약처 데이터에 없는 값을 한 번만 만들어 캐시에 저장해요.

  python scripts/data/enrich.py                       # EXAONE으로 전체 (캐시 있는 건 건너뜀)
  python scripts/data/enrich.py --provider gemini     # Gemini로
  python scripts/data/enrich.py --limit 20            # 앞에서 20개만 (시험용)
  python scripts/data/enrich.py --ids 28,29
  python scripts/data/enrich.py --batch 5 --workers 3   # 5개씩 묶어서 3개를 동시에 (기본값)

만드는 값: 한 줄 소개, 조리 시간, 인분, 난이도, 재료(주재료/양념·양), 단계별 재료·타이머, 팁.
조리 단계 글은 바꾸지 않아요(원문 그대로). 서비스 실행 중에는 LLM을 부르지 않아요.
"""

import argparse
import json
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from typing import Literal

from common import CACHE, PARSED
from llm_clients import call
from pydantic import BaseModel, Field, ValidationError, field_validator

from app.services.normalize import normalize_list, normalize_name


class EIngredient(BaseModel):
    name: str
    amount: str = ""
    kind: Literal["main", "seasoning"]


def _clamp(lo: int, hi: int):
    """범위를 벗어난 숫자는 버리지 않고 끝값으로 맞춰요"""
    def f(v):
        try:
            return min(max(int(float(v)), lo), hi)
        except (TypeError, ValueError):
            return v
    return f


def _cut(n: int):
    """너무 긴 글은 버리지 않고 n자에서 잘라요"""
    def f(v):
        return v.strip()[:n].rstrip() if isinstance(v, str) else v
    return f


class EStep(BaseModel):
    order: int
    ingredients: list[str] = []
    timerSec: int | None = Field(default=None, ge=0, le=7200)

    _t = field_validator("timerSec", mode="before")(lambda v: None if v in (None, "", 0) else _clamp(0, 7200)(v))


class Enrichment(BaseModel):
    summary: str = Field(max_length=60)
    timeMin: int = Field(ge=5, le=240)
    servings: int = Field(ge=1, le=8)
    difficulty: Literal["쉬움", "보통", "어려움"]
    ingredients: list[EIngredient]
    steps: list[EStep]
    tip: str | None = Field(default=None, max_length=120)

    _s = field_validator("summary", mode="before")(_cut(60))
    _tip = field_validator("tip", mode="before")(_cut(120))
    _time = field_validator("timeMin", mode="before")(_clamp(5, 240))
    _serv = field_validator("servings", mode="before")(_clamp(1, 8))


class EnrichmentWithId(Enrichment):
    id: int


class Batch(BaseModel):
    recipes: list[EnrichmentWithId]


SYSTEM = """당신은 한식 레시피 데이터를 정리하는 도우미예요. 주어진 레시피를 읽고 아래 JSON 하나만 출력해요. 설명이나 다른 글은 쓰지 않아요.

{
  "summary": "한 줄 소개 (25자 안팎, 명사로 끝나게. 예: 남은 김치와 찬밥으로 15분 만에 만드는 한 그릇)",
  "timeMin": 총 조리 시간(분, 손질 포함, 5의 배수),
  "servings": 인분(정수),
  "difficulty": "쉬움" | "보통" | "어려움",
  "ingredients": [{"name": "재료 이름(일반 명칭, 괄호·수식어 없이)", "amount": "양 (원문 표기)", "kind": "main" | "seasoning"}],
  "steps": [{"order": 단계 번호, "ingredients": ["이 단계에서 넣거나 다루는 재료 이름"], "timerSec": 이 단계에서 기다리는 시간(초) 또는 null}],
  "tip": "요리 팁 한 문장 (해요체) 또는 null"
}

규칙
- 소금·간장·설탕·식초·기름·참기름·고춧가루·마늘·후추·물 같은 양념은 kind="seasoning", 나머지는 "main"
- 재료 이름은 '다진 마늘' → '마늘', '계란' → '달걀', '파' → '대파'처럼 대표 이름으로
- steps는 입력의 단계 수·번호와 똑같이 맞추고, 단계 글은 다시 쓰지 않아요
- timerSec은 '3분 볶는다', '10분 찐다'처럼 시간이 적힌 단계만, 없으면 null
- 원문 팁(나트륨 줄이는 팁)이 있으면 자연스러운 해요체 한 문장으로 다듬어 쓰고, 없으면 맛을 살리는 팁을 써요

레시피가 여러 개 오면 {"recipes": [ ... ]} 하나로 감싸서, 각 항목에 입력의 "id"를 꼭 넣어요.
레시피 순서와 개수는 입력과 같아야 해요."""


def user_prompt(r: dict) -> str:
    steps = "\n".join(f"{s['order']}. {s['text']}" for s in r["steps"])
    return (
        f"요리 이름: {r['name']}\n요리 종류: {r['category']}\n조리 방법: {r['method']}\n"
        f"재료 원문:\n{r['rawIngredients']}\n\n조리 단계:\n{steps}\n\n원문 팁: {r['tip'] or '없음'}"
    )


def batch_prompt(rs: list[dict]) -> str:
    return "\n\n".join(f"### 레시피 id={r['id']}\n{user_prompt(r)}" for r in rs)


def clean(e: Enrichment, r: dict) -> dict:
    ingredients, seen = [], set()
    for i in e.ingredients:
        name = normalize_name(i.name)
        if name and name not in seen and len(name) <= 15:
            seen.add(name)
            ingredients.append({"name": name, "amount": i.amount.strip(), "kind": i.kind})
    if not any(i["kind"] == "main" for i in ingredients):
        raise ValueError("주재료가 없어요")
    by_order = {s.order: s for s in e.steps}
    steps = []
    for s in r["steps"]:  # 단계 글·사진은 원문, 재료·타이머만 LLM 값으로
        es = by_order.get(s["order"])
        steps.append({**s, "ingredients": normalize_list(es.ingredients) if es else s["ingredients"], "timerSec": es.timerSec if es else s["timerSec"]})
    return {
        "summary": e.summary.strip(),
        "timeMin": int(round(e.timeMin / 5) * 5) or 5,
        "servings": e.servings,
        "difficulty": e.difficulty,
        "ingredients": ingredients,
        "steps": steps,
        "tip": (e.tip or "").strip() or None,
    }


class Throttle:
    """여러 요청을 동시에 보내도 시작 간격은 min_gap초 이상으로 (EXAONE: 초당 1회)."""

    def __init__(self, min_gap: float):
        self.min_gap, self.lock, self.last = min_gap, threading.Lock(), 0.0

    def wait(self) -> None:
        with self.lock:
            gap = self.last + self.min_gap - time.monotonic()
            if gap > 0:
                time.sleep(gap)
            self.last = time.monotonic()


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--provider", choices=["exaone", "gemini"], default="exaone")
    p.add_argument("--limit", type=int, default=0)
    p.add_argument("--ids", default="")
    p.add_argument("--batch", type=int, default=5, help="한 번에 보낼 레시피 수")
    p.add_argument("--workers", type=int, default=3, help="동시에 보낼 요청 수")
    args = p.parse_args()

    recipes = json.loads(PARSED.read_text(encoding="utf-8"))
    if args.ids:
        wanted = {int(x) for x in args.ids.split(",")}
        recipes = [r for r in recipes if r["id"] in wanted]
    if args.limit:
        recipes = recipes[: args.limit]

    cache_dir = CACHE / args.provider
    cache_dir.mkdir(parents=True, exist_ok=True)
    todo = [r for r in recipes if not (cache_dir / f"{r['id']}.json").exists()]
    batches = [todo[i : i + args.batch] for i in range(0, len(todo), args.batch)]
    print(f"대상 {len(recipes)}개 · 캐시 {len(recipes) - len(todo)}개 · 새로 {len(todo)}개 ({len(batches)}번 요청)")

    throttle = Throttle(1.1 if args.provider == "exaone" else 0.5)
    lock = threading.Lock()
    stats = {"done": 0, "fail": 0, "batches": 0}
    t0 = time.monotonic()

    def run(batch: list[dict]) -> None:
        throttle.wait()
        ok = 0
        try:
            raw = call(args.provider, SYSTEM, batch_prompt(batch), Batch)
            items = raw.get("recipes", [raw] if len(batch) == 1 else [])
            by_id = {r["id"]: r for r in batch}
            for item in items:
                try:
                    e = EnrichmentWithId.model_validate({**item, "id": item.get("id", batch[0]["id"] if len(batch) == 1 else -1)})
                    r = by_id.get(e.id)
                    if not r:
                        continue
                    (cache_dir / f"{r['id']}.json").write_text(json.dumps(clean(e, r), ensure_ascii=False), encoding="utf-8")
                    ok += 1
                except (ValidationError, ValueError, KeyError):
                    pass
        except Exception as e:  # 묶음 전체가 실패하면 다음 실행 때 다시 시도돼요
            with lock:
                print(f"    묶음 실패 ({type(e).__name__}: {str(e)[:100]})")
        with lock:
            stats["done"] += ok
            stats["fail"] += len(batch) - ok
            stats["batches"] += 1
            el = time.monotonic() - t0
            left = el / stats["batches"] * (len(batches) - stats["batches"])
            print(f"[{stats['batches']}/{len(batches)}] 성공 {stats['done']} · 실패 {stats['fail']} · {el / 60:.1f}분 지남 · 약 {left / 60:.0f}분 남음")

    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        list(pool.map(run, batches))
    print(f"끝: 새로 {stats['done']}개 · 실패 {stats['fail']}개 (실패한 건 다시 실행하면 이어서 해요)")


if __name__ == "__main__":
    main()
