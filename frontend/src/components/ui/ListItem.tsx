import { CaretRight, type Icon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'

type Props = {
  icon: Icon
  title: string
  value?: ReactNode
  onClick?: () => void
  href?: string
}

/** 피그마 List Item — 설정·메뉴 한 줄(56). 줄 전체가 터치 영역 */
export function ListItem({ icon: I, title, value, onClick, href }: Props) {
  const inner = (
    <>
      <I size={22} className="shrink-0 text-icon-main" aria-hidden />
      <span className="flex-1 text-body-m-15 text-text-main">{title}</span>
      {value !== undefined && <span className="text-body-14 text-text-sub-weak">{value}</span>}
      <CaretRight size={18} className="shrink-0 text-icon-sub-weak" aria-hidden />
    </>
  )
  const cls = 'flex h-14 w-full items-center gap-3 border-b border-line-light text-left transition-colors hover:bg-bg-light'
  if (href) {
    return (
      <a href={href} className={cls} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
        {inner}
      </a>
    )
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  )
}
