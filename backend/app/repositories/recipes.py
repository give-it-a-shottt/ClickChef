"""레시피 SQL. ORM 없이 직접 써서 어떤 쿼리가 나가는지 그대로 보이게 했어요."""

import json
from typing import Any

from ..db import connection

SUMMARY_COLS = "id, name, summary, category, method, time_min, servings, difficulty, kcal, image_url"


def find_candidates(
    ingredients: list[str],
    excluded: list[str],
    max_time: int | None,
    categories: list[str],
    servings: int | None,
    pantry: list[str] | None = None,
    limit: int = 400,
) -> list[dict[str, Any]]:
    """내 재료와 하나라도 겹치는 레시피만 GIN 인덱스(&&)로 먼저 추려요.

    후보가 limit보다 많을 때 좋은 레시피가 잘리지 않도록, 가진 재료(내 재료+기본 양념) 비율이
    높은 순으로 가져와요. 최종 점수·정렬은 matcher.py가 해요.
    """
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
        ORDER BY
          (SELECT count(*) FROM unnest(main_ingredients) AS x WHERE x = ANY(%(owned)s::text[]))::float
            / greatest(cardinality(main_ingredients), 1) DESC,
          time_min
        LIMIT %(limit)s
    """
    with connection() as conn:
        return conn.execute(
            sql,
            {
                "ings": ingredients,
                "owned": list({*ingredients, *(pantry or [])}),
                "excl": excluded,
                "max_time": max_time,
                "cats": categories,
                "servings": servings,
                "limit": limit,
            },
        ).fetchall()


def get_summaries(ids: list[int], with_ingredients: bool = False) -> list[dict[str, Any]]:
    if not ids:
        return []
    cols = SUMMARY_COLS + (", main_ingredients, seasonings" if with_ingredients else "")
    with connection() as conn:
        rows = conn.execute(f"SELECT {cols} FROM recipes WHERE id = ANY(%s)", (ids,)).fetchall()
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


def featured(limit: int = 8) -> list[dict[str, Any]]:
    """쉬운 요리 중 날마다 다른 순서로 골라요 (첫 방문 홈 화면용)."""
    with connection() as conn:
        return conn.execute(
            f"""
            SELECT {SUMMARY_COLS} FROM recipes
            WHERE difficulty = '쉬움' AND time_min <= 30
            ORDER BY md5(id::text || CURRENT_DATE::text)
            LIMIT %s
            """,
            (limit,),
        ).fetchall()


# 홈 화면 섹션 — 식약처 요리 종류(RCP_PAT2)를 묶어요 (frontend/src/lib/category.ts와 같은 키)
COLLECTIONS: dict[str, list[str]] = {
    "bowl": ["밥", "일품"],
    "soup": ["국&찌개"],
    "side": ["반찬"],
    "snack": ["후식"],
}


def collections(limit: int = 12) -> dict[str, list[dict[str, Any]]]:
    """섹션마다 레시피를 날마다 다른 순서로 limit개씩, 쿼리 한 번에 가져와요 (사진 있는 레시피 먼저)."""
    groups = {cat: key for key, cats in COLLECTIONS.items() for cat in cats}
    with connection() as conn:
        rows = conn.execute(
            f"""
            SELECT * FROM (
              SELECT {SUMMARY_COLS}, grp,
                     row_number() OVER (
                       PARTITION BY grp ORDER BY (image_url IS NULL), md5(id::text || CURRENT_DATE::text)
                     ) AS rn
              FROM (
                SELECT *, (%(groups)s::jsonb ->> category) AS grp FROM recipes
              ) t
              WHERE grp IS NOT NULL
            ) s
            WHERE rn <= %(limit)s
            ORDER BY grp, rn
            """,
            {"groups": json.dumps(groups, ensure_ascii=False), "limit": limit},
        ).fetchall()
    out: dict[str, list[dict[str, Any]]] = {key: [] for key in COLLECTIONS}
    for r in rows:
        out[r["grp"]].append(r)
    return out


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
