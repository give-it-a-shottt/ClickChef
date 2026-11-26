import type { RecipeDetail } from '@/api/types'
import { useMyIngredients } from '@/features/capture/useMyIngredients'

/**
 * 내 재료 기준으로 주재료마다 있음/없음을 계산해요.
 * 내 재료 정보가 없으면(known=false) 화면에서 있음/부족 표시를 하지 않아요.
 * 상세 화면과 조리 모드의 '재료 보기' 시트가 같이 써요.
 */
export function useIngredientStatus(recipe: RecipeDetail) {
  const { have, pantry } = useMyIngredients()
  const owned = new Set([...have, ...pantry])
  const mains = recipe.ingredients.filter((i) => i.kind === 'main')
  const seasonings = recipe.ingredients.filter((i) => i.kind === 'seasoning')
  const known = have.length > 0
  const haveCount = mains.filter((i) => owned.has(i.name)).length
  return { mains, seasonings, known, owned, haveCount }
}
