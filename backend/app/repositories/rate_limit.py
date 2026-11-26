"""IP별 하루 사진 인식 횟수. 서버리스는 인스턴스가 여러 개라 메모리 대신 DB에 세요."""

from ..db import connection


def hit(ip: str) -> int:
    """오늘 횟수를 1 올리고 올린 뒤의 값을 돌려줘요."""
    with connection() as conn:
        row = conn.execute(
            """
            INSERT INTO rate_limits (ip, day, count) VALUES (%s, CURRENT_DATE, 1)
            ON CONFLICT (ip, day) DO UPDATE SET count = rate_limits.count + 1
            RETURNING count
            """,
            (ip,),
        ).fetchone()
    return int(row["count"]) if row else 1
