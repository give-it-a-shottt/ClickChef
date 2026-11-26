import { useSyncExternalStore } from 'react'

/** 브라우저 media query를 React 상태처럼 구독해요. 값이 바뀔 때만 다시 그려요. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** lg(1024px) 이상이면 PC 레이아웃. 모바일·PC 중 한쪽만 렌더링해요. */
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)')
