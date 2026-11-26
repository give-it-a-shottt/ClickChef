"""API 요청·응답 형식. JSON은 camelCase로 주고받아요 (frontend/src/api/types.ts와 같은 모양)."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


Difficulty = Literal["쉬움", "보통", "어려움"]


class RecipeSummary(CamelModel):
    id: int
    name: str
    summary: str
    category: str
    method: str
    time_min: int
    servings: int
    difficulty: Difficulty
    kcal: int | None = None
    image_url: str | None = None


class Match(CamelModel):
    have: int
    need: int
    missing: list[str]


class RecommendItem(RecipeSummary):
    match: Match


class RecommendResponse(CamelModel):
    total: int
    items: list[RecommendItem]


class RecipeIngredient(CamelModel):
    name: str
    amount: str = ""
    kind: Literal["main", "seasoning"] = "main"


class RecipeStep(CamelModel):
    order: int
    text: str
    ingredients: list[str] = []
    timer_sec: int | None = None
    image_url: str | None = None


class RecipeDetail(RecipeSummary):
    ingredients: list[RecipeIngredient]
    steps: list[RecipeStep]
    tip: str | None = None


class RecommendFilters(CamelModel):
    match: Literal["all", "most", "full"] = "all"
    max_time: int | None = Field(default=None, ge=1, le=600)
    categories: list[str] = []
    servings: int | None = Field(default=None, ge=1, le=10)


class RecommendRequest(CamelModel):
    ingredients: list[str] = Field(min_length=1, max_length=40)
    seasonings: list[str] = Field(default=[], max_length=40)
    excluded: list[str] = Field(default=[], max_length=40)
    filters: RecommendFilters = RecommendFilters()
    sort: Literal["match", "time", "missing"] = "match"
    liked: list[int] = Field(default=[], max_length=200)


class DetectedItem(CamelModel):
    name: str
    confidence: float = Field(ge=0, le=1)


class DetectResponse(CamelModel):
    found: list[DetectedItem]
    uncertain: list[DetectedItem]
