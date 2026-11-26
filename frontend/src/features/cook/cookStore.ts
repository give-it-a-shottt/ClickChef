import { create } from 'zustand'

export type TimerStatus = 'idle' | 'running' | 'paused' | 'done'

type Timer = {
  status: TimerStatus
  totalMs: number
  /** 멈춰 있을 때 남은 시간 */
  remainingMs: number
  /** 진행 중일 때 끝나는 시각 (Date.now() 기준) — 매초 상태를 바꾸지 않고 이 값으로 남은 시간을 계산해요 */
  endsAt: number | null
}

type CookState = {
  recipeId: number | null
  step: number
  startedAt: number | null
  timer: Timer
  begin: (recipeId: number, firstTimerSec: number | null) => void
  goTo: (step: number, timerSec: number | null) => void
  startTimer: () => void
  pauseTimer: () => void
  resetTimer: () => void
  finishTimer: () => void
}

const idle = (sec: number | null): Timer => {
  const ms = (sec ?? 0) * 1000
  return { status: 'idle', totalMs: ms, remainingMs: ms, endsAt: null }
}

/** 조리 모드 진행 상태 (새로고침하면 처음부터예요) */
export const useCookStore = create<CookState>((set, get) => ({
  recipeId: null,
  step: 0,
  startedAt: null,
  timer: idle(null),
  begin: (recipeId, firstTimerSec) => {
    if (get().recipeId === recipeId) return // 같은 레시피로 돌아오면 이어서
    set({ recipeId, step: 0, startedAt: Date.now(), timer: idle(firstTimerSec) })
  },
  goTo: (step, timerSec) => set({ step, timer: idle(timerSec) }),
  startTimer: () =>
    set(({ timer }) => ({ timer: { ...timer, status: 'running', endsAt: Date.now() + (timer.status === 'done' ? timer.totalMs : timer.remainingMs) } })),
  pauseTimer: () =>
    set(({ timer }) => ({
      timer: { ...timer, status: 'paused', remainingMs: Math.max(0, (timer.endsAt ?? 0) - Date.now()), endsAt: null },
    })),
  resetTimer: () => set(({ timer }) => ({ timer: { ...timer, status: 'idle', remainingMs: timer.totalMs, endsAt: null } })),
  finishTimer: () => set(({ timer }) => ({ timer: { ...timer, status: 'done', remainingMs: 0, endsAt: null } })),
}))
