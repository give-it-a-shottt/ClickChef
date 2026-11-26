"""레시피 SQL. ORM 없이 직접 써서 어떤 쿼리가 나가는지 그대로 보이게 했어요."""

from typing import Any

from ..db import connection

SUMMARY_COLS = "id, name, summary, category, method, time_min, servings, difficulty, kcal, image_url"


def find_candidates(
    ingredients: list[str],
    excluded: list[str],
    max_time: int | None,
    categories: list[str],
    servings: int | None,
    limit: int = 400,
) -> list[dict[str, Any]]:
    """내 재료와 하나라도 겹치는 레시피만 GIN 인덱스(&&)로 먼저 추려요. 점수 계산은 matcher.py가 해요."""
    sql = f"""
        SELECT {SUMMARY_COLS}, main_ingredients, seasonings
        FROM recipes
        WHERE main_ingredients && %(ings)s::text[]
          AND NOT (main_ingredients && %(excl)s::text[])
          AND NOT (seasonings && %(excl)s::text[])
          AND (%(max_time)s::int IS NULL OR time_min <= %(max_time)s::int)
          AND (cardinality(%(cats)s::text[]) = 0 OR category = ANY(%(cats)s::text[]))
          AND (%(servings)s::int IS NULL
               OR (%(servings)s::int >= 3 AND servings >= 3)
               OR servings = %(servings)s::int)
        LIMIT %(limit)s
    """
    with connection() as conn:
        return conn.execute(
            sql,
            {
                "ings": ingredients,
                "excl": excluded,
                "max_time": max_time,
                "cats": categories,
                "servings": servings,
                "limit": limit,
            },
        ).fetchall()


def get_summaries(ids: list[int]) -> list[dict[str, Any]]:
    if not ids:
        return []
    with connection() as conn:
        rows = conn.execute(f"SELECT {SUMMARY_COLS} FROM recipes WHERE id = ANY(%s)", (ids,)).fetchall()
    order = {rid: i for i, rid in enumerate(ids)}
    return sorted(rows, key=lambda r: order.get(r["id"], 0))


def get_detail(recipe_id: int) -> dict[str, Any] | None:
    with connection() as conn:
        return conn.execute(
            f"SELECT {SUMMARY_COLS}, ingredients, steps, tip FROM recipes WHERE id = %s",
            (recipe_id,),
        ).fetchone()


def search(q: str, limit: int = 40) -> list[dict[str, Any]]:
    """요리 이름은 trigram 유사도로, 재료는 정확히 일치하는 것으로 찾아요."""
    with connection() as conn:
        return conn.execute(
            f"""
            SELECT {SUMMARY_COLS}
            FROM recipes
            WHERE name ILIKE '%%' || %(q)s || '%%'
               OR %(q)s = ANY(main_ingredients)
               OR similarity(name, %(q)s) > 0.25
            ORDER BY (name ILIKE %(q)s || '%%') DESC, similarity(name, %(q)s) DESC, time_min
            LIMIT %(limit)s
            """,
            {"q": q, "limit": limit},
        ).fetchall()


def categories_of(ids: list[int]) -> set[str]:
    if not ids:
        return set()
    with connection() as conn:
        rows = conn.execute("SELECT DISTINCT category FROM recipes WHERE id = ANY(%s)", (ids,)).fetchall()
    return {r["category"] for r in rows}


def ingredient_vocabulary(limit: int = 400) -> list[str]:
    """레시피에 자주 나오는 주재료 이름 — 사진 인식 프롬프트에 넣어 DB와 같은 이름으로 받아요."""
    with connection() as conn:
        rows = conn.execute(
            """
            SELECT name FROM (
              SELECT unnest(main_ingredients) AS name FROM recipes
            ) t
            GROUP BY name ORDER BY count(*) DESC LIMIT %s
            """,
            (limit,),
        ).fetchall()
    return [r["name"] for r in rows]


def ping() -> bool:
    with connection() as conn:
        return conn.execute("SELECT 1 AS ok").fetchone() is not None
