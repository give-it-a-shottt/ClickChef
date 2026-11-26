"""재료 일치도 계산 — DB와 분리된 순수 함수라서 pytest로 바로 검증할 수 있어요.

규칙
- 점수 = 가진 주재료 수 ÷ (필요한 주재료 수 + 0.5)
  · 0.5를 더하는 이유: 그냥 나누면 재료 1개짜리(1/1)와 5개짜리(5/5)가 똑같이 1.0이라
    재료가 적은 요리가 위로 몰려요. 0.5를 더하면 1/1=0.67, 5/5=0.91로 내 재료를 많이 쓰는 요리가 앞에 와요.
- '전체' 보기에도 부족한 주재료가 2개 이하이거나 절반 이상 가진 요리만 넣어요
  (하나만 겹쳐도 다 넣으면 개수가 부풀려지고 못 만드는 요리가 섞여요)
- 기본 양념(pantry)에 있는 재료는 가진 것으로 쳐요
- 없는 양념은 '부족' 목록에는 넣지 않고 점수만 조금 깎아요 (양념 하나 때문에 추천이 빠지지 않게)
- 피드백을 준 요리와 같은 종류는 조금 올려요
"""

from dataclasses import dataclass
from typing import Literal

MatchMode = Literal["all", "most", "one", "full"]
SortKey = Literal["match", "time", "missing"]

SMOOTHING = 0.5
SEASONING_PENALTY = 0.02
LIKED_BONUS = 0.03
ALL_MAX_MISSING = 2  # '전체' 보기: 부족한 주재료가 이만큼 이하이거나
ALL_MIN_RATIO = 0.5  # 이 비율 이상 가지고 있으면 보여 줘요


@dataclass(frozen=True)
class Candidate:
    id: int
    category: str
    time_min: int
    main_ingredients: list[str]
    seasonings: list[str]


@dataclass(frozen=True)
class Scored:
    id: int
    have: int
    need: int
    missing: list[str]
    score: float
    time_min: int


def score_one(c: Candidate, have: set[str], pantry: set[str], liked_categories: set[str]) -> Scored:
    owned = have | pantry
    mains = c.main_ingredients or []
    have_main = [i for i in mains if i in owned]
    missing = [i for i in mains if i not in owned]
    missing_seasonings = [s for s in c.seasonings if s not in owned]
    need = len(mains)
    ratio = len(have_main) / (need + SMOOTHING) if need else 0.0
    score = ratio - SEASONING_PENALTY * len(missing_seasonings)
    if c.category in liked_categories:
        score += LIKED_BONUS
    return Scored(c.id, len(have_main), need, missing, round(score, 4), c.time_min)


def passes(s: Scored, mode: MatchMode) -> bool:
    if s.need == 0 or s.have == 0:
        return False
    if mode == "full":
        return not s.missing
    if mode == "one":  # 재료가 다 있거나 하나만 부족
        return len(s.missing) <= 1
    if mode == "most":
        return s.have / s.need >= 0.5
    return len(s.missing) <= ALL_MAX_MISSING or s.have / s.need >= ALL_MIN_RATIO


def rank(
    candidates: list[Candidate],
    have: list[str],
    pantry: list[str],
    *,
    mode: MatchMode = "all",
    sort: SortKey = "match",
    liked_categories: set[str] | None = None,
) -> list[Scored]:
    have_set, pantry_set = set(have), set(pantry)
    liked = liked_categories or set()
    scored = [score_one(c, have_set, pantry_set, liked) for c in candidates]
    scored = [s for s in scored if passes(s, mode)]
    if sort == "time":
        key = lambda s: (s.time_min, -s.score, len(s.missing))  # noqa: E731
    elif sort == "missing":
        key = lambda s: (len(s.missing), -s.score, s.time_min)  # noqa: E731
    else:
        key = lambda s: (-s.score, len(s.missing), s.time_min)  # noqa: E731
    return sorted(scored, key=key)
