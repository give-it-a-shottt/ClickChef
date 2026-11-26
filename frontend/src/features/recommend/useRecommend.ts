import { useQuery } from '@tanstack/react-query'
import { recommendQuery } from '@/api/queries'
import { useMyIngredients } from '@/features/capture/useMyIngredients'
import { usePrefsStore } from '@/stores/prefsStore'
import { toApiFilters, useFilters } from './useFilters'

/** 내 재료(촬영 흐름) + 설정(양념·싫어하는 재료·피드백) + URL 필터를 모아 추천을 요청해요 */
export function useRecommend() {
  const { have, pantry } = useMyIngredients()
  const dislikes = usePrefsStore((s) => s.dislikes)
  const feedback = usePrefsStore((s) => s.feedback)
  const filters = useFilters()
  const liked = Object.entries(feedback)
    .filter(([, f]) => f !== 'hard')
    .map(([id]) => Number(id))

  const query = useQuery(
    recommendQuery({
      ingredients: have,
      seasonings: pantry,
      excluded: dislikes,
      filters: toApiFilters(filters),
      sort: filters.sort,
      liked,
    }),
  )
  return { query, have, pantry, filters }
}
