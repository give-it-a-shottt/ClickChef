import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { safeLocalStorage } from '@/lib/storage'

export type Theme = 'system' | 'light' | 'ivory' | 'dark' | 'warm-dark'
export type Feedback = 'again' | 'good' | 'hard'

export const THEME_LABEL: Record<Theme, string> = {
  light: '라이트',
  ivory: '아이보리',
  dark: '다크',
  'warm-dark': '웜 다크',
  system: '시스템 설정',
}

export const DEFAULT_SEASONINGS = ['소금', '간장', '설탕', '식용유', '고춧가루', '참기름']

type PrefsState = {
  nickname: string
  theme: Theme
  /** 집에 늘 있는 양념 — 추천할 때 가진 재료로 쳐요 */
  seasonings: string[]
  /** 이 재료가 들어간 요리는 추천에서 빼요 */
  dislikes: string[]
  servings: number
  keepAwake: boolean
  /** 레시피 id → 조리 완료 후 남긴 평가 (다음 추천에 반영) */
  feedback: Record<number, Feedback>
  setTheme: (t: Theme) => void
  setServings: (n: number) => void
  setKeepAwake: (v: boolean) => void
  setNickname: (v: string) => void
  addSeasoning: (v: string) => void
  removeSeasoning: (v: string) => void
  addDislike: (v: string) => void
  removeDislike: (v: string) => void
  setFeedback: (id: number, f: Feedback) => void
}

const addUnique = (list: string[], v: string) => {
  const t = v.trim()
  return !t || list.includes(t) ? list : [...list, t]
}

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      nickname: '요리하는 찰칵이',
      theme: 'light', // 기본은 라이트 (OS 다크 모드와 상관없이)
      seasonings: DEFAULT_SEASONINGS,
      dislikes: [],
      servings: 1,
      keepAwake: true,
      feedback: {},
      setTheme: (theme) => set({ theme }),
      setServings: (servings) => set({ servings }),
      setKeepAwake: (keepAwake) => set({ keepAwake }),
      setNickname: (nickname) => set({ nickname: nickname.trim() || '요리하는 찰칵이' }),
      addSeasoning: (v) => set((s) => ({ seasonings: addUnique(s.seasonings, v) })),
      removeSeasoning: (v) => set((s) => ({ seasonings: s.seasonings.filter((x) => x !== v) })),
      addDislike: (v) => set((s) => ({ dislikes: addUnique(s.dislikes, v) })),
      removeDislike: (v) => set((s) => ({ dislikes: s.dislikes.filter((x) => x !== v) })),
      setFeedback: (id, f) => set((s) => ({ feedback: { ...s.feedback, [id]: f } })),
    }),
    {
      name: 'clickchef-prefs',
      version: 2,
      storage: createJSONStorage(() => safeLocalStorage),
      // v1은 기본값이 '시스템 설정'이었어요. 직접 고른 게 아니라 기본값이 저장된 거라 라이트로 바꿔요.
      migrate: (persisted, version) => {
        const state = persisted as Partial<PrefsState>
        if (version < 2 && state.theme === 'system') state.theme = 'light'
        return state as PrefsState
      },
    },
  ),
)

/** html[data-theme]를 바꿔서 CSS 변수(테마 4종)를 전환해요. 'system'이면 속성을 지워 OS 설정을 따라가요. */
function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'system') delete root.dataset.theme
  else root.dataset.theme = theme
}
applyTheme(usePrefsStore.getState().theme)
usePrefsStore.subscribe((s, prev) => {
  if (s.theme !== prev.theme) applyTheme(s.theme)
})
