import { useSearchParams } from 'react-router'
import type { RecommendFilters, SortKey } from '@/api/types'
import { CATEGORY_GROUPS, type CategoryKey } from '@/lib/category'

export type MatchKey = 'all' | 'full' | 'one'

export type FilterState = {
  match: MatchKey
  maxTime: 15 | 30 | null
  cats: CategoryKey[]
  servings: 1 | 2 | 3 | null
  sort: SortKey
}

export const SORT_LABEL: Record<SortKey, string> = {
  match: '재료 일치도순',
  time: '조리 시간순',
  missing: '부족 재료 적은순',
}

const CAT_KEYS = CATEGORY_GROUPS.map((g) => g.key) as CategoryKey[]

/**
 * 추천 필터·정렬은 URL 쿼리에 둬요 (예: /recipes?match=full&time=15&cat=bowl,soup&sort=time).
 * 뒤로 가기·새로고침·링크 공유에도 그대로 유지되고, 따로 전역 상태가 필요 없어요.
 */
export function useFilters() {
  const [params, setParams] = useSearchParams()

  const match = (['full', 'one'].includes(params.get('match') ?? '') ? params.get('match') : 'all') as MatchKey
  const t = Number(params.get('time'))
  const maxTime = t === 15 || t === 30 ? t : null
  const cats = (params.get('cat') ?? '').split(',').filter((c): c is CategoryKey => CAT_KEYS.includes(c as CategoryKey))
  const s = Number(params.get('serv'))
  const servings = s === 1 || s === 2 || s === 3 ? s : null
  const sort = (['time', 'missing'].includes(params.get('sort') ?? '') ? params.get('sort') : 'match') as SortKey
  const state: FilterState = { match, maxTime, cats, servings, sort }

  const update = (patch: Partial<FilterState>) => {
    const next = { ...state, ...patch }
    const q = new URLSearchParams()
    if (next.match !== 'all') q.set('match', next.match)
    if (next.maxTime) q.set('time', String(next.maxTime))
    if (next.cats.length) q.set('cat', next.cats.join(','))
    if (next.servings) q.set('serv', String(next.servings))
    if (next.sort !== 'match') q.set('sort', next.sort)
    setParams(q, { replace: true })
  }

  const activeCount = Number(match !== 'all') + Number(maxTime !== null) + cats.length + Number(servings !== null)

  return { ...state, update, reset: () => setParams({}, { replace: true }), activeCount }
}

export function toApiFilters(f: FilterState): RecommendFilters {
  return {
    match: f.match,
    maxTime: f.maxTime,
    categories: CATEGORY_GROUPS.filter((g) => f.cats.includes(g.key)).flatMap((g) => [...g.values]),
    servings: f.servings,
  }
}
