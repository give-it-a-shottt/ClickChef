"""일치도 계산 규칙 테스트 (DB 없이 돌아가요)."""

from app.services.matcher import Candidate, rank, score_one
from app.services.normalize import normalize_list, normalize_name

KIMCHI_RICE = Candidate(1, "밥", 15, ["김치", "밥", "스팸", "대파", "달걀"], ["식용유", "간장", "참기름"])
OMELETTE = Candidate(2, "반찬", 10, ["달걀", "대파", "양파"], ["소금", "식용유"])
STEW = Candidate(3, "국&찌개", 25, ["김치", "돼지고기", "두부", "대파", "양파"], ["고춧가루", "마늘", "간장"])
PANTRY = ["소금", "간장", "설탕", "식용유", "고춧가루", "참기름"]


def test_score_counts_owned_main_ingredients():
    s = score_one(KIMCHI_RICE, {"김치", "밥", "스팸", "달걀"}, set(PANTRY), set())
    assert (s.have, s.need, s.missing) == (4, 5, ["대파"])
    assert s.score == 0.8


def test_missing_seasoning_lowers_score_but_is_not_listed():
    s = score_one(STEW, {"김치", "돼지고기", "두부", "대파", "양파"}, set(PANTRY), set())
    assert s.missing == []  # 마늘은 양념이라 '부족'에 안 나와요
    assert s.score == 1 - 0.02  # 마늘 하나만큼 깎여요


def test_pantry_counts_as_owned():
    # 기본 양념에 '대파'를 넣어 두면 가진 재료로 쳐요
    s = score_one(OMELETTE, {"달걀", "양파"}, {"대파", "소금", "식용유"}, set())
    assert s.missing == [] and s.score == 1.0


def test_full_mode_keeps_only_complete_recipes():
    have = ["달걀", "대파", "양파", "김치"]
    ids = [s.id for s in rank([KIMCHI_RICE, OMELETTE, STEW], have, PANTRY, mode="full")]
    assert ids == [2]


def test_most_mode_requires_half():
    have = ["김치", "대파"]  # 김치볶음밥 2/5, 김치찌개 2/5, 달걀말이 1/3
    assert rank([KIMCHI_RICE, OMELETTE, STEW], have, PANTRY, mode="most") == []
    assert len(rank([KIMCHI_RICE, OMELETTE, STEW], have, PANTRY, mode="all")) == 3


def test_sort_by_match_then_missing_then_time():
    have = ["김치", "밥", "스팸", "대파", "달걀", "양파"]
    ids = [s.id for s in rank([STEW, OMELETTE, KIMCHI_RICE], have, PANTRY)]
    # 달걀말이(3/3, 10분)와 김치볶음밥(5/5, 15분)은 점수가 같아서 시간 순, 김치찌개(3/5)는 마지막
    assert ids == [2, 1, 3]


def test_sort_by_time():
    have = ["김치", "밥", "스팸", "대파", "달걀", "양파"]
    ids = [s.id for s in rank([STEW, OMELETTE, KIMCHI_RICE], have, PANTRY, sort="time")]
    assert ids == [2, 1, 3]


def test_liked_category_gets_small_bonus():
    a = Candidate(10, "반찬", 10, ["달걀", "양파"], [])
    b = Candidate(11, "일품", 10, ["달걀", "양파"], [])
    ids = [s.id for s in rank([a, b], ["달걀", "양파"], [], liked_categories={"일품"})]
    assert ids == [11, 10]


def test_normalize_synonyms_and_spaces():
    assert normalize_name("계란") == "달걀"
    assert normalize_name("다진 마늘(1큰술)") == "마늘"
    assert normalize_list(["파", "대파", "계란", "달걀"]) == ["대파", "달걀"]
