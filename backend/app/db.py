"""PostgreSQL(Neon) 연결.

서버리스 함수는 요청이 없으면 내려가요. 그래서 연결 풀은 작게(최대 4) 두고,
따뜻한 인스턴스에서는 연결을 재사용해 Neon 왕복을 줄여요.
Neon은 pooled 주소(-pooler)를 쓰면 PgBouncer가 연결 수를 관리해 줘요.
"""

from collections.abc import Iterator
from contextlib import contextmanager

from psycopg import Connection
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from .config import get_settings

_pool: ConnectionPool | None = None


def get_pool() -> ConnectionPool:
    global _pool
    if _pool is None:
        url = get_settings().database_url
        if not url:
            raise RuntimeError("DATABASE_URL이 설정되지 않았어요")
        _pool = ConnectionPool(
            url,
            min_size=0,
            max_size=4,
            max_idle=60,
            open=True,
            # PgBouncer(transaction 모드)와 함께 쓰려면 서버 쪽 prepared statement를 끄는 게 안전해요
            kwargs={"row_factory": dict_row, "prepare_threshold": None, "autocommit": True},
            check=ConnectionPool.check_connection,
        )
    return _pool


@contextmanager
def connection() -> Iterator[Connection]:
    with get_pool().connection() as conn:
        yield conn
