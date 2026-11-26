"""레시피 JSON → PostgreSQL(로컬 Docker 또는 Neon).

사용법
  python scripts/data/seed_db.py                      # data/recipes.json (없으면 샘플 12개)
  python scripts/data/seed_db.py data/fixtures/recipes.sample.json
  python scripts/data/seed_db.py --replace            # 기존 레시피를 지우고 새로 넣기

DATABASE_URL은 루트 .env 또는 환경변수에서 읽어요.
"""

import argparse
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))

from app.services.normalize import normalize_list, normalize_name  # noqa: E402

try:
    from dotenv import load_dotenv

    load_dotenv(ROOT / ".env")
except ImportError:
    pass

import psycopg  # noqa: E402
from psycopg.types.json import Jsonb  # noqa: E402


def to_row(r: dict) -> dict:
    ingredients = [
        {"name": normalize_name(i["name"]), "amount": i.get("amount", ""), "kind": i.get("kind", "main")}
        for i in r.get("ingredients", [])
    ]
    steps = [
        {
            "order": s["order"],
            "text": s["text"],
            "ingredients": normalize_list(s.get("ingredients", [])),
            "timerSec": s.get("timerSec"),
            "imageUrl": s.get("imageUrl"),
        }
        for s in r.get("steps", [])
    ]
    return {
        "id": r["id"],
        "name": r["name"],
        "summary": r.get("summary", ""),
        "category": r.get("category", ""),
        "method": r.get("method", ""),
        "time_min": r.get("timeMin", 30),
        "servings": r.get("servings", 2),
        "difficulty": r.get("difficulty", "보통"),
        "kcal": r.get("kcal"),
        "image_url": r.get("imageUrl"),
        "main_ingredients": normalize_list([i["name"] for i in ingredients if i["kind"] == "main"]),
        "seasonings": normalize_list([i["name"] for i in ingredients if i["kind"] == "seasoning"]),
        "ingredients": Jsonb(ingredients),
        "steps": Jsonb(steps),
        "tip": r.get("tip"),
        "source": r.get("source", "mfds"),
    }


UPSERT = """
INSERT INTO recipes (id, name, summary, category, method, time_min, servings, difficulty, kcal, image_url,
                     main_ingredients, seasonings, ingredients, steps, tip, source, updated_at)
VALUES (%(id)s, %(name)s, %(summary)s, %(category)s, %(method)s, %(time_min)s, %(servings)s, %(difficulty)s,
        %(kcal)s, %(image_url)s, %(main_ingredients)s, %(seasonings)s, %(ingredients)s, %(steps)s, %(tip)s,
        %(source)s, now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, summary = EXCLUDED.summary, category = EXCLUDED.category, method = EXCLUDED.method,
  time_min = EXCLUDED.time_min, servings = EXCLUDED.servings, difficulty = EXCLUDED.difficulty,
  kcal = EXCLUDED.kcal, image_url = EXCLUDED.image_url, main_ingredients = EXCLUDED.main_ingredients,
  seasonings = EXCLUDED.seasonings, ingredients = EXCLUDED.ingredients, steps = EXCLUDED.steps,
  tip = EXCLUDED.tip, source = EXCLUDED.source, updated_at = now()
"""


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("path", nargs="?", help="레시피 JSON 경로")
    p.add_argument("--replace", action="store_true", help="기존 레시피를 지우고 넣기")
    args = p.parse_args()

    default = ROOT / "data" / "recipes.json"
    path = Path(args.path) if args.path else (default if default.exists() else ROOT / "data/fixtures/recipes.sample.json")
    url = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL")
    if not url:
        sys.exit("DATABASE_URL이 없어요. 루트 .env에 넣거나 환경변수로 주세요.")

    recipes = json.loads(path.read_text(encoding="utf-8"))
    rows = [to_row(r) for r in recipes]
    with psycopg.connect(url) as conn:
        conn.execute((ROOT / "db" / "schema.sql").read_text(encoding="utf-8"))
        if args.replace:
            conn.execute("TRUNCATE recipes")
        with conn.cursor() as cur:
            cur.executemany(UPSERT, rows)
        total = conn.execute("SELECT count(*) FROM recipes").fetchone()[0]
    print(f"{path.name}: {len(rows)}개 넣음 · DB 전체 {total}개")


if __name__ == "__main__":
    main()
