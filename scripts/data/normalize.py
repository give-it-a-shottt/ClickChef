"""식약처 원본 → 규칙 기반 1차 정리 (LLM 없이).

  python scripts/data/normalize.py

- 재료 문자열(RCP_PARTS_DTLS)을 '이름 + 양'으로 나누고 동의어를 맞춰요 (backend의 normalize와 같은 기준)
- 조리 단계의 끝에 붙은 a·b·c 같은 찌꺼기와 번호를 지워요
- 단계 글에서 'n분'을 찾아 타이머 초로, 단계·재료 수로 시간·난이도를 어림해요
이 값은 LLM 보강이 실패했을 때의 기본값이에요.
"""

import json
import re

from common import PARSED, RAW

from app.services.normalize import SEASONINGS, normalize_name

UNITS = "개|큰술|작은술|컵|줌|모|쪽|스푼|숟가락|꼬집|장|대|뿌리|봉|공기|토막|마리"
# 숫자로 시작하거나, "한 개·두 큰술"처럼 수 낱말 뒤에 단위가 올 때만 양으로 봐요 (연두부의 '두'는 양이 아니에요)
AMOUNT_START = re.compile(rf"\s*(\d|약간|조금|적당|(?:한|두|세|네|반)\s?(?:{UNITS})|½|¼)")
HEADER = re.compile(r"^\s*[\[●•■◆▶<(]?\s*(주재료|부재료|재료|양념|소스|고명|양념장|드레싱|반죽|기타|육수|토핑)[^,]*?[\]:)>]?\s*:?\s*$")
STEP_NUM = re.compile(r"^\s*\d+\s*[.)]\s*")
STEP_TAIL = re.compile(r"[a-zA-Z]\s*$")
MINUTES = re.compile(r"(\d+)\s*~?\s*\d*\s*분")
SECONDS = re.compile(r"(\d+)\s*초")


def split_ingredients(text: str, dish: str) -> list[dict]:
    items: list[dict] = []
    for line in re.split(r"[\n\r]+", text or ""):
        line = line.strip()
        if not line or HEADER.match(line) or line.replace(" ", "") == dish.replace(" ", ""):
            continue
        line = re.sub(r"^[^:：]{1,15}[:：]", "", line).strip()  # '양념 : 간장 ...' → '간장 ...'
        parts = [p for p in re.split(r"[,，]", line) if p.strip()]
        # 양 없이 한 단어만 있는 줄은 하위 요리 제목이에요 (예: '북엇국')
        if len(parts) == 1 and not AMOUNT_START.search(parts[0]):
            continue
        for part in parts:
            part = part.strip(" ·-•")
            if not part:
                continue
            m = AMOUNT_START.search(part)
            name, amount = (part[: m.start()], part[m.start() :].strip()) if m and m.start() > 0 else (part, "")
            name = normalize_name(name)
            if not name or len(name) > 15 or not re.search(r"[가-힣]", name):
                continue
            kind = "seasoning" if name in SEASONINGS else "main"
            if not any(i["name"] == name for i in items):
                items.append({"name": name, "amount": amount, "kind": kind})
    return items


def timer_of(text: str) -> int | None:
    if m := MINUTES.search(text):
        return min(int(m.group(1)), 120) * 60
    if m := SECONDS.search(text):
        return min(int(m.group(1)), 600)
    return None


def steps_of(row: dict) -> list[dict]:
    steps = []
    for i in range(1, 21):
        text = (row.get(f"MANUAL{i:02d}") or "").strip()
        if not text:
            continue
        text = STEP_TAIL.sub("", STEP_NUM.sub("", text)).strip()
        img = (row.get(f"MANUAL_IMG{i:02d}") or "").strip().replace("http://", "https://")
        steps.append({"order": len(steps) + 1, "text": text, "ingredients": [], "timerSec": timer_of(text), "imageUrl": img or None})
    return steps


def guess(steps: list[dict], ingredients: list[dict]) -> tuple[int, str]:
    timers = sum((s["timerSec"] or 0) for s in steps) // 60
    minutes = max(10, min(90, timers + 4 * len(steps)))
    minutes = int(round(minutes / 5) * 5)
    n = len(ingredients)
    difficulty = "쉬움" if len(steps) <= 4 and n <= 8 else "어려움" if len(steps) >= 7 or n >= 14 else "보통"
    return minutes, difficulty


def to_int(v: str) -> int | None:
    try:
        return int(float(v))
    except (TypeError, ValueError):
        return None


def parse_row(row: dict) -> dict:
    name = (row.get("RCP_NM") or "").strip()
    ingredients = split_ingredients(row.get("RCP_PARTS_DTLS", ""), name)
    steps = steps_of(row)
    for s in steps:  # 단계 글에 이름이 나오는 재료를 그 단계 재료로
        s["ingredients"] = [i["name"] for i in ingredients if i["name"] in s["text"]]
    minutes, difficulty = guess(steps, ingredients)
    image = (row.get("ATT_FILE_NO_MAIN") or row.get("ATT_FILE_NO_MK") or "").strip().replace("http://", "https://")
    return {
        "id": int(row["RCP_SEQ"]),
        "name": name,
        "summary": "",
        "category": (row.get("RCP_PAT2") or "기타").strip(),
        "method": (row.get("RCP_WAY2") or "").strip(),
        "timeMin": minutes,
        "servings": 1,
        "difficulty": difficulty,
        "kcal": to_int(row.get("INFO_ENG")),
        "imageUrl": image or None,
        "ingredients": ingredients,
        "steps": steps,
        "tip": (row.get("RCP_NA_TIP") or "").strip() or None,
        "rawIngredients": row.get("RCP_PARTS_DTLS", ""),
    }


def main() -> None:
    rows = json.loads(RAW.read_text(encoding="utf-8"))
    parsed = [parse_row(r) for r in rows if r.get("RCP_SEQ") and r.get("RCP_NM")]
    parsed = [p for p in parsed if p["steps"] and p["ingredients"]]
    PARSED.write_text(json.dumps(parsed, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(rows)}건 중 {len(parsed)}건 정리 → data/raw/parsed.json")


if __name__ == "__main__":
    main()
