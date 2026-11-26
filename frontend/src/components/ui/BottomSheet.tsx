import { X } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { useModal } from '@/lib/useModal'
import { IconButton } from './IconButton'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}

/**
 * 바텀시트 + 피그마 Sheet Header(손잡이 36×4 + 제목 18 + 닫기).
 * 배경 bg/elevated, 위 모서리 radius/sheet, 뒤는 bg/dim.
 */
export function BottomSheet({ open, onClose, title, children, footer }: Props) {
  const ref = useModal(open, onClose)
  return (
    <dialog
      ref={ref}
      aria-labelledby="sheet-title"
      className="mx-auto mt-auto mb-0 max-h-[85dvh] w-full max-w-[480px] overflow-hidden rounded-t-sheet bg-bg-elevated p-0 text-text-main backdrop:bg-bg-dim open:flex open:animate-sheet-up open:flex-col"
    >
      <div className="flex shrink-0 flex-col items-center pt-2">
        <span aria-hidden className="h-1 w-9 rounded-sm bg-line-regular" />
        <div className="flex w-full items-center pt-1 pr-1.5 pl-5">
          <h2 id="sheet-title" className="flex-1 text-title-18">
            {title}
          </h2>
          <IconButton icon={X} label="닫기" onClick={onClose} className="size-11" />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">{children}</div>
      {footer && <div className="shrink-0 border-t border-line-light px-5 pt-3 pb-safe-plus">{footer}</div>}
    </dialog>
  )
}
