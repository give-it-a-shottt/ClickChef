"""LLM으로 레시피 보강 — 식약처 데이터에 없는 값을 한 번만 만들어 캐시에 저장해요.

  python scripts/data/enrich.py                       # EXAONE으로 전체 (캐시 있는 건 건너뜀)
  python scripts/data/enrich.py --provider gemini     # Gemini로
  python scripts/data/enrich.py --limit 20            # 앞에서 20개만 (시험용)
  python scripts/data/enrich.py --ids 28,29

만드는 값: 한 줄 소개, 조리 시간, 인분, 난이도, 재료(주재료/양념·양), 단계별 재료·타이머, 팁.
조리 단계 글은 바꾸지 않아요(원문 그대로). 서비스 실행 중에는 LLM을 부르지 않아요.
"""

import argparse
import json
from typing import Literal

from common import CACHE, PARSED
from llm_clients import call
from pydantic import BaseModel, Field, ValidationError

from app.services.normalize import normalize_list, normalize_name


class EIngredient(BaseModel):
    name: str
    amount: str = ""
    kind: Literal["main", "seasoning"]


class EStep(BaseModel):
    order: int
    ingredients: list[str] = []
    timerSec: int | None = Field(default=None, ge=0, le=7200)


class Enrichment(BaseModel):
    summary: str = Field(max_length=60)
    timeMin: int = Field(ge=5, le=240)
    servings: int = Field(ge=1, le=8)
    difficulty: Literal["쉬움", "보통", "어려움"]
    ingredients: list[EIngredient]
    steps: list[EStep]
    tip: str | None = Field(default=None, max_length=120)


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
- 원문 팁(나트륨 줄이는 팁)이 있으면 자연스러운 해요체 한 문장으로 다듬어 쓰고, 없으면 맛을 살리는 팁을 써요"""


def user_prompt(r: dict) -> str:
    steps = "\n".join(f"{s['order']}. {s['text']}" for s in r["steps"])
    return (
        f"요리 이름: {r['name']}\n요리 종류: {r['category']}\n조리 방법: {r['method']}\n"
        f"재료 원문:\n{r['rawIngredients']}\n\n조리 단계:\n{steps}\n\n원문 팁: {r['tip'] or '없음'}"
    )


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


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--provider", choices=["exaone", "gemini"], default="exaone")
    p.add_argument("--limit", type=int, default=0)
    p.add_argument("--ids", default="")
    args = p.parse_args()

    recipes = json.loads(PARSED.read_text(encoding="utf-8"))
    if args.ids:
        wanted = {int(x) for x in args.ids.split(",")}
        recipes = [r for r in recipes if r["id"] in wanted]
    if args.limit:
        recipes = recipes[: args.limit]

    cache_dir = CACHE / args.provider
    cache_dir.mkdir(parents=True, exist_ok=True)
    done = fail = skip = 0
    for n, r in enumerate(recipes, 1):
        path = cache_dir / f"{r['id']}.json"
        if path.exists():
            skip += 1
            continue
        print(f"[{n}/{len(recipes)}] {r['id']} {r['name']}")
        try:
            raw = call(args.provider, SYSTEM, user_prompt(r), Enrichment)
            path.write_text(json.dumps(clean(Enrichment.model_validate(raw), r), ensure_ascii=False), encoding="utf-8")
            done += 1
        except (ValidationError, ValueError, KeyError) as e:
            print(f"    건너뜀 (형식 오류: {str(e)[:120]}) — 규칙 기반 값으로 채워요")
            fail += 1
    print(f"새로 {done}개 · 실패 {fail}개 · 캐시 {skip}개")


if __name__ == "__main__":
    main()
