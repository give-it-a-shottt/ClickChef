import { CaretRight } from '@phosphor-icons/react'
import { Link } from 'react-router'
import { cx } from '@/lib/cx'

type Props = { title: string; moreTo?: string; moreLabel?: string; className?: string; as?: 'h2' | 'h3' }

/** 피그마 Section Header — 제목(Headline 20) + 전체보기 */
export function SectionHeader({ title, moreTo, moreLabel = '전체보기', className, as: H = 'h2' }: Props) {
  return (
    <div className={cx('flex items-center justify-between', className)}>
      <H className="text-headline-20 text-text-main">{title}</H>
      {moreTo && (
        <Link to={moreTo} className="-mr-1 flex items-center gap-0.5 rounded-button p-1 text-body-m-13 text-text-sub hover:text-text-main">
          {moreLabel}
          <CaretRight size={16} aria-hidden />
        </Link>
      )}
    </div>
  )
}
