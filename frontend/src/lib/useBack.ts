import { useNavigate } from 'react-router'

/** 앱 안에서 들어왔으면 뒤로, 링크로 바로 들어왔으면 fallback 화면으로 가요 */
export function useBack(fallback = '/') {
  const navigate = useNavigate()
  return () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (idx > 0) navigate(-1)
    else navigate(fallback, { replace: true })
  }
}
