"""API 테스트는 개발 DB와 섞이지 않게 같은 서버에 'clickchef_test' DB를 따로 만들어 샘플 레시피 12개로 돌려요.

DB 서버에 연결할 수 없으면 아무것도 하지 않고, test_api.py는 건너뛰어요.
"""

import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

try:
    from dotenv import load_dotenv

    load_dotenv(ROOT / ".env")
except ImportError:
    pass


def _prepare_test_db() -> None:
    base = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL")
    if not base or "neon.tech" in base:  # 운영 DB(Neon)에는 절대 만들지 않아요
        return
    try:
        import psycopg
        from psycopg.conninfo import conninfo_to_dict, make_conninfo

        params = conninfo_to_dict(base)
        test_url = make_conninfo(base, dbname="clickchef_test")
        with psycopg.connect(make_conninfo(base, dbname=params.get("dbname", "postgres")), autocommit=True, connect_timeout=3) as conn:
            if not conn.execute("SELECT 1 FROM pg_database WHERE datname = 'clickchef_test'").fetchone():
                conn.execute("CREATE DATABASE clickchef_test")
    except Exception:
        return
    subprocess.run(
        [sys.executable, str(ROOT / "scripts/data/seed_db.py"), str(ROOT / "data/fixtures/recipes.sample.json"), "--replace"],
        env={**os.environ, "DATABASE_URL": test_url, "PYTHONIOENCODING": "utf-8"},
        check=True,
        capture_output=True,
    )
    os.environ["DATABASE_URL"] = test_url  # app을 import하기 전에 바꿔야 해요


_prepare_test_db()
