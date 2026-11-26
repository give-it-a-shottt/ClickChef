import type { Icon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'

type Props = {
  icon: Icon
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}

/** 피그마 Empty State — 이유 + 다음 행동. 아이콘 원은 회색으로 (빨간색으로 겁주지 않기) */
export function EmptyState({ icon: I, title, description, action, className }: Props) {
  return (
    <div className={cx('flex flex-col items-center py-12 text-center', className)}>
      <span className="flex size-20 items-center justify-center rounded-full bg-bg-regular text-icon-sub">
        <I size={36} aria-hidden />
      </span>
      <h2 className="mt-5 text-title-18 text-text-main">{title}</h2>
      {description && <p className="mt-2 text-body-14 text-text-sub">{description}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  )
}
