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
    assert s.score == round(4 / 5.5, 4)  # 0.5를 더해 나눠요 (재료 적은 요리 쏠림 방지)


def test_missing_seasoning_lowers_score_but_is_not_listed():
    s = score_one(STEW, {"김치", "돼지고기", "두부", "대파", "양파"}, set(PANTRY), set())
    assert s.missing == []  # 마늘은 양념이라 '부족'에 안 나와요
    assert s.score == round(5 / 5.5 - 0.02, 4)  # 마늘 하나만큼 깎여요


def test_pantry_counts_as_owned():
    # 기본 양념에 '대파'를 넣어 두면 가진 재료로 쳐요
    s = score_one(OMELETTE, {"달걀", "양파"}, {"대파", "소금", "식용유"}, set())
    assert s.missing == [] and s.score == round(3 / 3.5, 4)


def test_full_mode_keeps_only_complete_recipes():
    have = ["달걀", "대파", "양파", "김치"]
    ids = [s.id for s in rank([KIMCHI_RICE, OMELETTE, STEW], have, PANTRY, mode="full")]
    assert ids == [2]


def test_most_mode_requires_half():
    have = ["김치", "대파"]  # 김치볶음밥 2/5, 김치찌개 2/5, 달걀말이 1/3
    assert rank([KIMCHI_RICE, OMELETTE, STEW], have, PANTRY, mode="most") == []


def test_all_mode_drops_recipes_missing_many():
    # 하나만 겹쳐도 다 넣으면 개수가 부풀려져요 — 부족 2개 이하이거나 절반 이상 가진 요리만
    have = ["김치", "대파"]  # 김치볶음밥·김치찌개는 3개 부족, 달걀말이는 2개 부족
    assert [s.id for s in rank([KIMCHI_RICE, OMELETTE, STEW], have, PANTRY, mode="all")] == [2]
    big = Candidate(9, "일품", 30, ["a", "b", "c", "d", "e", "f"], [])
    assert [s.id for s in rank([big], ["a", "b", "c"], [])] == [9]  # 3개 부족이어도 절반이면 보여 줘요


def test_small_recipe_does_not_outrank_bigger_full_recipe():
    tiny = Candidate(20, "반찬", 5, ["달걀"], [])  # 1/1
    half = Candidate(21, "반찬", 5, ["달걀", "두부"], [])  # 1/2
    have = ["김치", "밥", "스팸", "대파", "달걀", "양파"]
    ids = [s.id for s in rank([tiny, half, KIMCHI_RICE, STEW], have, PANTRY)]
    assert ids == [1, 20, 3, 21]  # 5/5 > 1/1 > 3/5 > 1/2


def test_sort_by_match_then_missing_then_time():
    have = ["김치", "밥", "스팸", "대파", "달걀", "양파"]
    ids = [s.id for s in rank([STEW, OMELETTE, KIMCHI_RICE], have, PANTRY)]
    # 둘 다 재료가 다 있으면 내 재료를 더 많이 쓰는 김치볶음밥(5/5)이 달걀말이(3/3)보다 앞, 김치찌개(3/5)는 마지막
    assert ids == [1, 2, 3]


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


def test_one_mode_allows_single_missing():
    have = ["김치", "밥", "스팸", "달걀", "양파"]  # 김치볶음밥은 대파 하나만 부족
    ids = [s.id for s in rank([KIMCHI_RICE, OMELETTE, STEW], have, PANTRY, mode="one")]
    assert 1 in ids and 3 not in ids
