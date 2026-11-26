import { useEffect } from 'react'

/**
 * 모바일 하단 고정 바(탭 바·버튼 바)가 있을 때 토스트가 그 위에 뜨도록
 * 바 높이를 CSS 변수(--toast-bottom)로 알려 줘요.
 */
export function useBottomInset(px: number) {
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--toast-bottom', `${px}px`)
    return () => {
      root.style.removeProperty('--toast-bottom')
    }
  }, [px])
}
