import { useEffect, useRef } from 'react'

/**
 * 브라우저 기본 <dialog>를 열고 닫아요.
 * showModal()이 포커스 가두기·Esc 닫기·뒤 화면 비활성(inert)을 알아서 해 줘서 라이브러리가 필요 없어요.
 */
export function useModal(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onCancel = (e: Event) => {
      e.preventDefault()
      onClose()
    }
    // 바깥(배경)을 누르면 닫혀요
    const onClick = (e: MouseEvent) => {
      if (e.target === el) onClose()
    }
    el.addEventListener('cancel', onCancel)
    el.addEventListener('click', onClick)
    return () => {
      el.removeEventListener('cancel', onCancel)
      el.removeEventListener('click', onClick)
    }
  }, [onClose])

  return ref
}
