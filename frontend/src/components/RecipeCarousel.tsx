import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import type { Match, RecipeSummary } from '@/api/types'
import { IconButton } from '@/components/ui/IconButton'
import { cx } from '@/lib/cx'
import { RecipeCard, RecipeCardSkeleton } from './RecipeCard'

type Item = RecipeSummary & { match?: Match | null }

type Props = {
  title: string
  subtitle?: string
  items: Item[] | undefined
  loading: boolean
  desktop: boolean
  moreTo?: string
}

/**
 * 레시피 가로 넘기기. PC는 좌우 화살표로 4장씩, 모바일은 손가락으로 밀어서 봐요.
 * 브라우저 기본 가로 스크롤 + scroll-snap이라 라이브러리 없이 가볍게 동작해요.
 */
export function RecipeCarousel({ title, subtitle, items, loading, desktop, moreTo }: Props) {
  const trackRef = useRef<HTMLUListElement>(null)
  const [edge, setEdge] = useState({ start: true, end: false })

  const updateEdge = () => {
    const el = trackRef.current
    if (!el) return
    setEdge({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 })
  }

  useEffect(() => {
    updateEdge()
    const el = trackRef.current
    if (!el) return
    const ro = new ResizeObserver(updateEdge)
    ro.observe(el)
    return () => ro.disconnect()
  }, [items])

  const page = (dir: 1 | -1) => {
    const el = trackRef.current
    if (el) el.scrollBy({ left: dir * (el.clientWidth + 24), behavior: 'smooth' })
  }

  if (!loading && !items?.length) return null
  const size = desktop ? 'l' : 's'

  return (
    <section aria-label={title} className={cx('flex flex-col', desktop ? 'gap-6' : 'gap-4')}>
      <div className="flex items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-headline-20 text-text-main">{title}</h2>
          {subtitle && <p className={cx('text-text-sub', desktop ? 'text-body-14' : 'text-body-13')}>{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {moreTo && (
            <Link to={moreTo} className="mr-1 flex items-center gap-0.5 text-body-m-13 text-text-sub hover:text-text-main">
              전체보기
              <CaretRight size={16} aria-hidden />
            </Link>
          )}
          {desktop && (
            <>
              <IconButton icon={CaretLeft} label={`${title} 이전`} variant="outline-strong" shape="circle" size="s" onClick={() => page(-1)} disabled={edge.start} />
              <IconButton icon={CaretRight} label={`${title} 다음`} variant="outline-strong" shape="circle" size="s" onClick={() => page(1)} disabled={edge.end} />
            </>
          )}
        </div>
      </div>
      <ul
        ref={trackRef}
        onScroll={updateEdge}
        className={cx(
          'flex snap-x snap-mandatory overflow-x-auto scroll-smooth scrollbar-none',
          desktop ? 'gap-6' : '-mx-5 scroll-px-5 gap-4 px-5',
        )}
      >
        {loading
          ? Array.from({ length: desktop ? 4 : 2 }, (_, i) => (
              <li key={i} className={cx('shrink-0', desktop ? 'w-[282px]' : 'w-40')}>
                <RecipeCardSkeleton size={size} />
              </li>
            ))
          : items?.map((r, i) => (
              <li key={r.id} className={cx('shrink-0 snap-start', desktop ? 'w-[282px]' : 'w-40')}>
                <RecipeCard recipe={r} match={r.match ?? undefined} size={size} eager={i < (desktop ? 4 : 2)} />
              </li>
            ))}
      </ul>
    </section>
  )
}
