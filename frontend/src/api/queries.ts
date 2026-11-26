import { keepPreviousData, queryOptions, useMutation } from '@tanstack/react-query'
import { api } from './client'
import type { DetectResponse, RecipeDetail, RecipeSummary, RecommendRequest, RecommendResponse } from './types'

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

export const recipesByIdsQuery = (ids: number[]) =>
  queryOptions({
    queryKey: ['recipes', ids],
    queryFn: ({ signal }) => api.get<RecipeSummary[]>(`/recipes?ids=${ids.join(',')}`, signal),
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

/** 사진 → 재료 인식 */
export function useDetectIngredients() {
  return useMutation({
    mutationFn: (files: Blob[]) => {
      const form = new FormData()
      files.forEach((f, i) => form.append('images', f, `photo-${i}.jpg`))
      return api.upload<DetectResponse>('/ingredients/detect', form)
    },
  })
}
