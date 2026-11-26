/** 백엔드(FastAPI) 응답 형식 — backend/app/schemas.py와 같은 모양이에요. */

export type Difficulty = '쉬움' | '보통' | '어려움'

export interface RecipeSummary {
  id: number
  name: string
  /** 한 줄 소개 */
  summary: string
  /** 요리 종류 (밥, 국&찌개, 반찬, 일품, 후식 …) */
  category: string
  /** 조리 방법 (볶기, 끓이기 …) */
  method: string
  timeMin: number
  servings: number
  difficulty: Difficulty
  kcal: number | null
  imageUrl: string | null
}

export interface Match {
  have: number
  need: number
  missing: string[]
}

export interface RecommendItem extends RecipeSummary {
  match: Match
}

/** 찜·최근 본 목록 — 내 재료를 같이 보냈을 때만 match가 있어요 */
export interface RecipeWithMatch extends RecipeSummary {
  match: Match | null
}

export interface RecommendResponse {
  total: number
  items: RecommendItem[]
}

export interface RecipeIngredient {
  name: string
  amount: string
  kind: 'main' | 'seasoning'
}

export interface RecipeStep {
  order: number
  text: string
  /** 이 단계에서 쓰는 재료 */
  ingredients: string[]
  /** 이 단계 타이머 (없으면 null) */
  timerSec: number | null
  imageUrl: string | null
}

export interface RecipeDetail extends RecipeSummary {
  ingredients: RecipeIngredient[]
  steps: RecipeStep[]
  tip: string | null
}

export interface DetectedItem {
  name: string
  confidence: number
}

export interface DetectResponse {
  found: DetectedItem[]
  /** 확신이 낮은 재료 → "이것도 있나요?" */
  uncertain: DetectedItem[]
}

export type SortKey = 'match' | 'time' | 'missing'

export interface RecommendFilters {
  /** all: 하나라도 겹치면 / most: 절반 이상 / full: 모두 있음 */
  match: 'all' | 'most' | 'full'
  maxTime: number | null
  categories: string[]
  servings: number | null
}

export interface RecommendRequest {
  ingredients: string[]
  seasonings: string[]
  excluded: string[]
  filters: RecommendFilters
  sort: SortKey
  /** 피드백을 준 레시피 id와 평가 — 비슷한 요리를 조금 올려요 */
  liked: number[]
}
