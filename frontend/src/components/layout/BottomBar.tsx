import type { ReactNode } from 'react'
import { useBottomInset } from '@/lib/useBottomInset'

/** 피그마 Bottom Button Bar — MO 하단 고정 버튼 바 (좌우 20, 위 12, 안전 영역, 버튼 XL 56) */
export function BottomBar({ children }: { children: ReactNode }) {
  useBottomInset(80)
  return (
    <>
      <div aria-hidden className="h-[calc(80px+env(safe-area-inset-bottom))]" />
      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-line-light bg-bg-default px-5 pt-3 pb-safe-plus">
        {children}
      </div>
    </>
  )
}
