"""API 테스트 — 로컬 Docker PostgreSQL에 샘플 레시피가 들어 있어야 해요.

  docker compose up -d && python scripts/data/seed_db.py data/fixtures/recipes.sample.json
DB에 연결할 수 없으면 이 파일의 테스트는 건너뛰어요.
"""

import os

import pytest

os.environ.setdefault("VISION_MOCK", "1")

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.repositories import recipes as repo  # noqa: E402

try:
    DB_OK = repo.ping()
except Exception:
    DB_OK = False

pytestmark = pytest.mark.skipif(not DB_OK, reason="로컬 DB가 없어요")
client = TestClient(app)

MY = ["김치", "달걀", "양파", "대파", "스팸", "밥"]
PANTRY = ["소금", "간장", "설탕", "식용유", "고춧가루", "참기름"]


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200 and r.json()["db"] is True


def test_recommend_returns_camel_case_and_match():
    r = client.post("/api/recipes/recommend", json={"ingredients": MY, "seasonings": PANTRY})
    assert r.status_code == 200
    body = r.json()
    assert body["total"] >= 5
    first = body["items"][0]
    assert {"timeMin", "imageUrl", "match"} <= first.keys()
    assert first["match"]["missing"] == []  # 가장 앞은 재료가 다 있는 요리


def test_recommend_normalizes_synonyms():
    a = client.post("/api/recipes/recommend", json={"ingredients": ["계란", "파"]}).json()
    b = client.post("/api/recipes/recommend", json={"ingredients": ["달걀", "대파"]}).json()
    assert [i["id"] for i in a["items"]] == [i["id"] for i in b["items"]]


def test_recommend_excludes_disliked():
    r = client.post("/api/recipes/recommend", json={"ingredients": MY, "excluded": ["스팸"]}).json()
    names = [i["name"] for i in r["items"]]
    assert "김치볶음밥" not in names and "스팸마요덮밥" not in names


def test_recommend_filters_full_and_time():
    r = client.post(
        "/api/recipes/recommend",
        json={"ingredients": MY, "seasonings": PANTRY, "filters": {"match": "full", "maxTime": 10}},
    ).json()
    assert r["items"] and all(i["timeMin"] <= 10 and not i["match"]["missing"] for i in r["items"])


def test_recommend_requires_ingredients():
    assert client.post("/api/recipes/recommend", json={"ingredients": []}).status_code == 422


def test_detail_and_404():
    r = client.get("/api/recipes/1").json()
    assert r["name"] == "김치볶음밥" and r["steps"][1]["timerSec"] == 180
    assert client.get("/api/recipes/999999").status_code == 404


def test_list_by_ids_keeps_order():
    r = client.get("/api/recipes?ids=3,1").json()
    assert [x["id"] for x in r] == [3, 1]


def test_search_by_name_and_ingredient():
    assert any(x["name"] == "김치찌개" for x in client.get("/api/recipes/search", params={"q": "찌개"}).json())
    assert any(x["name"] == "두부조림" for x in client.get("/api/recipes/search", params={"q": "두부"}).json())


def test_detect_mock_splits_uncertain():
    files = [("images", ("a.jpg", b"\xff\xd8\xff fake", "image/jpeg"))]
    r = client.post("/api/ingredients/detect", files=files, headers={"x-forwarded-for": "test-ip"})
    assert r.status_code == 200
    body = r.json()
    assert "김치" in [i["name"] for i in body["found"]]
    assert all(i["confidence"] < 0.6 for i in body["uncertain"])


def test_detect_rejects_non_image():
    files = [("images", ("a.txt", b"hello", "text/plain"))]
    r = client.post("/api/ingredients/detect", files=files, headers={"x-forwarded-for": "test-ip-2"})
    assert r.status_code == 415
