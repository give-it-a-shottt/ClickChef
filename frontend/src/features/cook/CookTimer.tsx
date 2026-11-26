import { ArrowClockwise, Pause, Play } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { cx } from '@/lib/cx'
import { useCookStore } from './cookStore'

const fmt = (ms: number) => {
  const total = Math.ceil(ms / 1000)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

/** 끝났을 때 짧은 알림음 + 진동 (조리대에서 떨어져 있어도 알 수 있게) */
function alarm() {
  navigator.vibrate?.([200, 100, 200, 100, 200])
  try {
    const ctx = new AudioContext()
    ;[0, 0.35, 0.7].forEach((t) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.25, ctx.currentTime + t)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.3)
      osc.connect(gain).connect(ctx.destination)
      osc.start(ctx.currentTime + t)
      osc.stop(ctx.currentTime + t + 0.3)
    })
    setTimeout(() => void ctx.close(), 1500)
  } catch {
    /* 소리를 못 내는 환경이면 진동만 */
  }
}

/**
 * 피그마 Cook Timer — Idle(시작 전) → Running(어두운 카드 + 진행 바) → Done(초록 + 다음 단계).
 * 매초 바뀌는 숫자는 이 컴포넌트 안에서만 다시 그려요. 조리 화면 전체는 다시 그려지지 않아요.
 */
export function CookTimer({ onNext, isLast }: { onNext: () => void; isLast: boolean }) {
  const timer = useCookStore((s) => s.timer)
  const { startTimer, pauseTimer, resetTimer, finishTimer } = useCookStore(
    useShallow((s) => ({ startTimer: s.startTimer, pauseTimer: s.pauseTimer, resetTimer: s.resetTimer, finishTimer: s.finishTimer })),
  )
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (timer.status !== 'running') return
    const id = setInterval(() => {
      const t = Date.now()
      setNow(t)
      if (timer.endsAt && t >= timer.endsAt) {
        finishTimer()
        alarm()
      }
    }, 250)
    return () => clearInterval(id)
  }, [timer.status, timer.endsAt, finishTimer])

  if (!timer.totalMs) return null
  const remaining =
    timer.status === 'running' && timer.endsAt ? Math.min(timer.totalMs, Math.max(0, timer.endsAt - now)) : timer.remainingMs
  const progress = timer.totalMs ? 1 - remaining / timer.totalMs : 0
  const minutes = Math.round(timer.totalMs / 60000)

  if (timer.status === 'done') {
    return (
      <div className="flex items-center gap-3 rounded-card bg-status-success-bg p-5" role="status">
        <div className="flex flex-1 flex-col">
          <span className="text-label-m-13 text-status-success-text">타이머 끝!</span>
          <span className="text-display-40 text-status-success-text">00:00</span>
        </div>
        <Button size="m" onClick={onNext}>
          {isLast ? '요리 완료' : '다음 단계'}
        </Button>
      </div>
    )
  }

  const running = timer.status === 'running'
  const active = running || timer.status === 'paused'
  return (
    <div className={cx('flex flex-col gap-4 rounded-card p-5 transition-colors', active ? 'bg-bg-inverse' : 'bg-primary-soft')}>
      <div className="flex items-center gap-3">
        <div className="flex flex-1 flex-col">
          <span className={cx('text-label-m-13', active ? 'text-text-inverse/72' : 'text-primary-text')}>
            {active ? (running ? '남은 시간' : '일시정지') : `이 단계 타이머 · ${minutes}분`}
          </span>
          <span className={cx('text-display-40 tabular-nums', active ? 'text-text-inverse' : 'text-text-main')} aria-live="off">
            {fmt(remaining)}
          </span>
        </div>
        {active ? (
          <div className="flex gap-2">
            <IconButton icon={ArrowClockwise} label="타이머 초기화" variant="secondary" shape="circle" size="m" onClick={resetTimer} />
            <IconButton
              icon={running ? Pause : Play}
              weight="fill"
              label={running ? '일시정지' : '이어서'}
              variant="primary"
              shape="circle"
              size="m"
              onClick={running ? pauseTimer : startTimer}
            />
          </div>
        ) : (
          <Button size="m" leadingIcon={Play} onClick={startTimer}>
            시작
          </Button>
        )}
      </div>
      {active && (
        <div className="h-1.5 overflow-hidden rounded-full bg-white/20" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-primary-accent transition-[width] duration-200" style={{ width: `${progress * 100}%` }} />
        </div>
      )}
    </div>
  )
}
