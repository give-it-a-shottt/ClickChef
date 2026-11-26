import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { api } from './client'
import type { RecipeDetail, RecipeSummary, RecipeWithMatch, RecommendRequest, RecommendResponse } from './types'

/**
 * 쿼리 키와 요청을 한곳에 모았어요.
 * 레시피는 바뀌지 않는 데이터라 한 번 받으면 다시 요청하지 않아요(staleTime: Infinity).
 */
export const recipeQuery = (id: number) =>
  queryOptions({
    queryKey: ['recipe', id],
    queryFn: ({ signal }) => api.get<RecipeDetail>(`/recipes/${id}`, signal),
    staleTime: Infinity,
  })

export const recipesByIdsQuery = (ids: number[], have: string[] = [], pantry: string[] = []) =>
  queryOptions({
    queryKey: ['recipes', ids, have, pantry],
    queryFn: ({ signal }) => {
      const q = new URLSearchParams({ ids: ids.join(',') })
      if (have.length) q.set('have', have.join(','))
      if (pantry.length) q.set('pantry', pantry.join(','))
      return api.get<RecipeWithMatch[]>(`/recipes?${q}`, signal)
    },
    staleTime: Infinity,
    enabled: ids.length > 0,
    placeholderData: keepPreviousData,
  })

export const recommendQuery = (req: RecommendRequest) =>
  queryOptions({
    queryKey: ['recommend', req],
    queryFn: ({ signal }) => api.post<RecommendResponse>('/recipes/recommend', req, signal),
    staleTime: 5 * 60_000,
    enabled: req.ingredients.length > 0,
    placeholderData: keepPreviousData,
  })

export const searchQuery = (q: string) =>
  queryOptions({
    queryKey: ['search', q],
    queryFn: ({ signal }) => api.get<RecipeSummary[]>(`/recipes/search?q=${encodeURIComponent(q)}`, signal),
    staleTime: 5 * 60_000,
    enabled: q.trim().length > 0,
    placeholderData: keepPreviousData,
  })

/** 첫 방문처럼 최근 본 레시피가 없을 때 보여 줄 쉬운 요리 (날마다 바뀌어요) */
export const featuredQuery = () =>
  queryOptions({
    queryKey: ['featured'],
    queryFn: ({ signal }) => api.get<RecipeSummary[]>('/recipes/featured', signal),
    staleTime: 60 * 60_000,
  })
