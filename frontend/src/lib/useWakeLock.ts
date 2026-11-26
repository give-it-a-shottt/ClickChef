import { useEffect, useState } from 'react'

/**
 * 조리 중 화면이 꺼지지 않게 해요 (Screen Wake Lock API).
 * 탭을 벗어났다 돌아오면 브라우저가 잠금을 풀어서, 돌아올 때 다시 요청해요.
 * 지원하지 않는 브라우저에서는 active=false로 남고 화면에 표시하지 않아요.
 */
export function useWakeLock(enabled: boolean) {
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return
    let sentinel: WakeLockSentinel | null = null
    let cancelled = false

    const request = async () => {
      try {
        sentinel = await navigator.wakeLock.request('screen')
        if (cancelled) {
          void sentinel.release()
          return
        }
        setActive(true)
        sentinel.addEventListener('release', () => setActive(false))
      } catch {
        setActive(false)
      }
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible' && (!sentinel || sentinel.released)) void request()
    }

    void request()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      void sentinel?.release()
    }
  }, [enabled])

  return enabled && active
}
