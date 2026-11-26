import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { safeLocalStorage } from '@/lib/storage'

const RECENT_MAX = 20

type LibraryState = {
  /** 찜한 레시피 id → 저장 시각 */
  saved: Record<number, number>
  /** 최근 본 레시피 id (최신이 앞) */
  recent: number[]
  /** 끝까지 만든 레시피 id (중복 허용 안 함) */
  cooked: number[]
  captureCount: number
  toggleSaved: (id: number) => boolean
  addRecent: (id: number) => void
  markCooked: (id: number) => void
  addCapture: () => void
}

/** 내 기록 — 로그인 없이 브라우저에 저장해요 */
export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      saved: {},
      recent: [],
      cooked: [],
      captureCount: 0,
      toggleSaved: (id) => {
        const saved = { ...get().saved }
        const next = !(id in saved)
        if (next) saved[id] = Date.now()
        else delete saved[id]
        set({ saved })
        return next
      },
      addRecent: (id) => set((s) => ({ recent: [id, ...s.recent.filter((x) => x !== id)].slice(0, RECENT_MAX) })),
      markCooked: (id) => set((s) => (s.cooked.includes(id) ? s : { cooked: [...s.cooked, id] })),
      addCapture: () => set((s) => ({ captureCount: s.captureCount + 1 })),
    }),
    { name: 'clickchef-library', version: 1, storage: createJSONStorage(() => safeLocalStorage) },
  ),
)

/** 카드 하나가 자기 찜 여부만 구독해요 — 다른 카드의 찜이 바뀌어도 다시 그려지지 않아요 */
export const useIsSaved = (id: number) => useLibraryStore((s) => id in s.saved)
