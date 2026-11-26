from fastapi import APIRouter, HTTPException, Query

from ..repositories import recipes as repo
from ..schemas import Match, RecipeDetail, RecipeSummary, RecommendItem, RecommendRequest, RecommendResponse
from ..services.matcher import Candidate, rank
from ..services.normalize import normalize_list

router = APIRouter(prefix="/recipes", tags=["recipes"])

MAX_RESULTS = 60


@router.post("/recommend", response_model=RecommendResponse, response_model_by_alias=True)
def recommend(req: RecommendRequest) -> RecommendResponse:
    have = normalize_list(req.ingredients)
    pantry = normalize_list(req.seasonings)
    excluded = normalize_list(req.excluded)
    f = req.filters

    rows = repo.find_candidates(have, excluded, f.max_time, f.categories, f.servings)
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


@router.get("/search", response_model=list[RecipeSummary], response_model_by_alias=True)
def search(q: str = Query(min_length=1, max_length=40)) -> list[RecipeSummary]:
    return [RecipeSummary.model_validate(r) for r in repo.search(q.strip())]


@router.get("", response_model=list[RecipeSummary], response_model_by_alias=True)
def list_by_ids(ids: str = Query(description="쉼표로 구분한 레시피 id", max_length=1000)) -> list[RecipeSummary]:
    try:
        id_list = [int(x) for x in ids.split(",") if x.strip()][:100]
    except ValueError as e:
        raise HTTPException(400, "id는 숫자로 보내 주세요") from e
    return [RecipeSummary.model_validate(r) for r in repo.get_summaries(id_list)]


@router.get("/{recipe_id}", response_model=RecipeDetail, response_model_by_alias=True)
def detail(recipe_id: int) -> RecipeDetail:
    row = repo.get_detail(recipe_id)
    if not row:
        raise HTTPException(404, "레시피를 찾을 수 없어요")
    return RecipeDetail.model_validate(row)
