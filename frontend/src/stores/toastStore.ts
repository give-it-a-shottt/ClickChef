import { create } from 'zustand'

export type ToastInput = {
  message: string
  /** 체크 아이콘을 붙일지 */
  icon?: boolean
  action?: { label: string; onClick: () => void }
}
type ToastState = { toast: (ToastInput & { id: number }) | null }

let seq = 0
let timer: ReturnType<typeof setTimeout> | undefined

/** 토스트는 한 번에 하나만. 3초 뒤 사라지고, 실행 취소 같은 행동이 있으면 5초 (피그마 Toast 규칙) */
export const useToastStore = create<ToastState>(() => ({ toast: null }))

export function showToast(input: ToastInput) {
  clearTimeout(timer)
  const id = ++seq
  useToastStore.setState({ toast: { ...input, id } })
  timer = setTimeout(() => hideToast(id), input.action ? 5000 : 3000)
}

export function hideToast(id?: number) {
  const cur = useToastStore.getState().toast
  if (!cur || (id !== undefined && cur.id !== id)) return
  useToastStore.setState({ toast: null })
}
