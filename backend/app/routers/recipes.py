from fastapi import APIRouter, HTTPException, Query

from ..repositories import recipes as repo
from ..schemas import (
    Match,
    RecipeDetail,
    RecipeSummary,
    RecipeWithMatch,
    RecommendItem,
    RecommendRequest,
    RecommendResponse,
)
from ..services.matcher import Candidate, rank, score_one
from ..services.normalize import normalize_list

router = APIRouter(prefix="/recipes", tags=["recipes"])

MAX_RESULTS = 60


@router.post("/recommend", response_model=RecommendResponse, response_model_by_alias=True)
def recommend(req: RecommendRequest) -> RecommendResponse:
    have = normalize_list(req.ingredients)
    pantry = normalize_list(req.seasonings)
    excluded = normalize_list(req.excluded)
    f = req.filters

    rows = repo.find_candidates(have, excluded, f.max_time, f.categories, f.servings, pantry=pantry)
    by_id = {r["id"]: r for r in rows}
    candidates = [
        Candidate(r["id"], r["category"], r["time_min"], r["main_ingredients"], r["seasonings"]) for r in rows
    ]
    ranked = rank(
        candidates,
        have,
        pantry,
        mode=f.match,
        sort=req.sort,
        liked_categories=repo.categories_of(req.liked),
    )
    items = [
        RecommendItem(
            **RecipeSummary.model_validate(by_id[s.id]).model_dump(),
            match=Match(have=s.have, need=s.need, missing=s.missing),
        )
        for s in ranked[:MAX_RESULTS]
    ]
    return RecommendResponse(total=len(ranked), items=items)


@router.get("/collections", response_model=dict[str, list[RecipeSummary]], response_model_by_alias=True)
def collections(limit: int = Query(default=12, ge=1, le=24)) -> dict[str, list[RecipeSummary]]:
    """홈 화면 4개 섹션(한 그릇·국찌개·반찬·간식)을 요청 한 번에."""
    return {k: [RecipeSummary.model_validate(r) for r in rows] for k, rows in repo.collections(limit).items()}


@router.get("/featured", response_model=list[RecipeSummary], response_model_by_alias=True)
def featured() -> list[RecipeSummary]:
    return [RecipeSummary.model_validate(r) for r in repo.featured()]


@router.get("/search", response_model=list[RecipeSummary], response_model_by_alias=True)
def search(q: str = Query(min_length=1, max_length=40)) -> list[RecipeSummary]:
    return [RecipeSummary.model_validate(r) for r in repo.search(q.strip())]


@router.get("", response_model=list[RecipeWithMatch], response_model_by_alias=True)
def list_by_ids(
    ids: str = Query(description="쉼표로 구분한 레시피 id", max_length=1000),
    have: str = Query(default="", max_length=600, description="내 재료(쉼표 구분) — 주면 일치도를 같이 계산해요"),
    pantry: str = Query(default="", max_length=600, description="기본 양념(쉼표 구분)"),
) -> list[RecipeWithMatch]:
    """찜·최근 본 레시피 목록. 내 재료를 같이 주면 카드에 일치도 배지를 그릴 수 있어요."""
    try:
        id_list = [int(x) for x in ids.split(",") if x.strip()][:100]
    except ValueError as e:
        raise HTTPException(400, "id는 숫자로 보내 주세요") from e
    have_set = set(normalize_list(have.split(","))) if have else set()
    pantry_set = set(normalize_list(pantry.split(","))) if pantry else set()
    out: list[RecipeWithMatch] = []
    for r in repo.get_summaries(id_list, with_ingredients=True):
        match = None
        if have_set:
            s = score_one(Candidate(r["id"], r["category"], r["time_min"], r["main_ingredients"], r["seasonings"]),
                          have_set, pantry_set, set())
            match = Match(have=s.have, need=s.need, missing=s.missing)
        out.append(RecipeWithMatch(**RecipeSummary.model_validate(r).model_dump(), match=match))
    return out


@router.get("/{recipe_id}", response_model=RecipeDetail, response_model_by_alias=True)
def detail(recipe_id: int) -> RecipeDetail:
    row = repo.get_detail(recipe_id)
    if not row:
        raise HTTPException(404, "레시피를 찾을 수 없어요")
    return RecipeDetail.model_validate(row)
