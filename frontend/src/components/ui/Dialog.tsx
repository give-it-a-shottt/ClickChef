import type { ReactNode } from 'react'
import { useModal } from '@/lib/useModal'
import { Button } from './Button'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  description?: ReactNode
  cancelLabel: string
  confirmLabel: string
  onConfirm: () => void
}

/**
 * 피그마 Dialog — 되돌리기 어려운 행동 전 확인창.
 * 오른쪽이 주요 행동, 왼쪽은 취소. 바깥 탭·뒤로가기(Esc) = 취소.
 */
export function Dialog({ open, onClose, title, description, cancelLabel, confirmLabel, onConfirm }: Props) {
  const ref = useModal(open, onClose)
  return (
    <dialog
      ref={ref}
      aria-labelledby="dialog-title"
      className="m-auto w-[calc(100%-64px)] max-w-[360px] rounded-modal bg-bg-elevated p-0 text-text-main shadow-4 backdrop:bg-bg-dim open:animate-fade-in"
    >
      <div className="flex flex-col gap-2 px-6 pt-7 pb-5">
        <h2 id="dialog-title" className="text-title-18">
          {title}
        </h2>
        {description && <p className="text-body-14 whitespace-pre-line text-text-sub">{description}</p>}
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose} autoFocus>
            {cancelLabel}
          </Button>
          <Button className="flex-1" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
