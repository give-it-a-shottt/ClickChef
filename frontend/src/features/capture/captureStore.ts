import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { api, ApiError } from '@/api/client'
import type { DetectResponse } from '@/api/types'
import { safeSessionStorage } from '@/lib/storage'
import { useLibraryStore } from '@/stores/libraryStore'

export const MAX_PHOTOS = 3

export type Photo = { id: string; blob: Blob; url: string }
export type IngredientSource = 'found' | 'uncertain' | 'manual'
export type IngredientItem = { name: string; source: IngredientSource; selected: boolean }
export type CaptureStatus = 'idle' | 'detecting' | 'ready' | 'failed' | 'error'

type CaptureState = {
  photos: Photo[]
  status: CaptureStatus
  error: string | null
  /** 찾은 재료 + 확인 필요 재료 + 직접 추가한 재료 (선택 여부 포함) */
  items: IngredientItem[]
  /** 이번 검색에서만 끈 기본 양념 */
  seasoningOff: string[]
  toggle: (name: string) => void
  addManual: (name: string) => void
  toggleSeasoning: (name: string) => void
  reset: () => void
}

/**
 * 촬영 → 재료 확인 흐름의 상태.
 * 사진(Blob)은 새로고침하면 사라지지만, 재료 목록은 sessionStorage에 남겨서 뒤로 가기·새로고침에도 유지돼요.
 */
export const useCaptureStore = create<CaptureState>()(
  persist(
    (set) => ({
      photos: [],
      status: 'idle',
      error: null,
      items: [],
      seasoningOff: [],
      toggle: (name) =>
        set((s) => ({ items: s.items.map((i) => (i.name === name ? { ...i, selected: !i.selected } : i)) })),
      addManual: (raw) =>
        set((s) => {
          const names = raw
            .split(/[,，、]/)
            .map((n) => n.trim())
            .filter(Boolean)
          let items = s.items
          for (const name of names) {
            const hit = items.find((i) => i.name === name)
            items = hit
              ? items.map((i) => (i.name === name ? { ...i, selected: true } : i))
              : [...items, { name, source: 'manual', selected: true }]
          }
          return { items }
        }),
      toggleSeasoning: (name) =>
        set((s) => ({
          seasoningOff: s.seasoningOff.includes(name) ? s.seasoningOff.filter((x) => x !== name) : [...s.seasoningOff, name],
        })),
      reset: () =>
        set((s) => {
          s.photos.forEach((p) => URL.revokeObjectURL(p.url))
          return { photos: [], status: 'idle', error: null, items: [], seasoningOff: [] }
        }),
    }),
    {
      name: 'clickchef-capture',
      storage: createJSONStorage(() => safeSessionStorage),
      partialize: (s) => ({ items: s.items, seasoningOff: s.seasoningOff, status: s.status === 'detecting' ? 'idle' : s.status }),
    },
  ),
)

/** 지금 켜져 있는 재료 이름 (추천 요청에 쓰여요) */
export const selectSelected = (s: CaptureState) => s.items.filter((i) => i.selected).map((i) => i.name)

function mergeResult(items: IngredientItem[], res: DetectResponse): IngredientItem[] {
  const next = [...items]
  const upsert = (name: string, source: IngredientSource) => {
    const hit = next.find((i) => i.name === name)
    if (!hit) next.push({ name, source, selected: source === 'found' })
    else if (source === 'found' && hit.source === 'uncertain') Object.assign(hit, { source, selected: true })
  }
  res.found.forEach((i) => upsert(i.name, 'found'))
  res.uncertain.forEach((i) => upsert(i.name, 'uncertain'))
  return next
}

/**
 * 사진을 서버로 보내 재료를 찾아요. 화면 이동과 상관없이 끝까지 진행돼요.
 * append면 기존 결과에 새 사진의 재료를 더해요.
 */
export async function detectPhotos(blobs: Blob[], append: boolean) {
  const store = useCaptureStore.getState()
  if (!append) store.reset()
  const room = MAX_PHOTOS - (append ? useCaptureStore.getState().photos.length : 0)
  const accepted = blobs.slice(0, Math.max(0, room))
  if (!accepted.length) return
  const photos = accepted.map((blob) => ({ id: crypto.randomUUID(), blob, url: URL.createObjectURL(blob) }))
  useCaptureStore.setState((s) => ({ photos: [...s.photos, ...photos], status: 'detecting', error: null }))
  useLibraryStore.getState().addCapture()

  const form = new FormData()
  accepted.forEach((b, i) => form.append('images', b, `photo-${i}.jpg`))
  try {
    const res = await api.upload<DetectResponse>('/ingredients/detect', form)
    useCaptureStore.setState((s) => {
      const items = mergeResult(s.items, res)
      return { items, status: items.length ? 'ready' : 'failed' }
    })
  } catch (e) {
    const message = e instanceof ApiError ? e.message : '사진을 분석하지 못했어요'
    useCaptureStore.setState((s) => ({ status: s.items.length ? 'ready' : 'error', error: message }))
  }
}
