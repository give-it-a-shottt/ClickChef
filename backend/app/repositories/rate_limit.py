"""IP별 하루 사진 인식 횟수. 서버리스는 인스턴스가 여러 개라 메모리 대신 DB에 세요.

개인정보를 줄이려고 IP 원문 대신 해시(SHA-256 앞 32자)만 저장해요.
"""

import hashlib
import os

from ..db import connection

_SALT = os.getenv("RATE_LIMIT_SALT", "clickchef")


def _key(ip: str) -> str:
    return hashlib.sha256(f"{_SALT}:{ip}".encode()).hexdigest()[:32]


def hit(ip: str) -> int:
    """오늘 횟수를 1 올리고 올린 뒤의 값을 돌려줘요."""
    with connection() as conn:
        row = conn.execute(
            """
            INSERT INTO rate_limits (ip, day, count) VALUES (%s, CURRENT_DATE, 1)
            ON CONFLICT (ip, day) DO UPDATE SET count = rate_limits.count + 1
            RETURNING count
            """,
            (_key(ip),),
        ).fetchone()
    return int(row["count"]) if row else 1
