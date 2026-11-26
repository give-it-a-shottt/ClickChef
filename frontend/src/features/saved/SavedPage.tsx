import { CaretDown, Heart, MagnifyingGlass } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router'
import { recipesByIdsQuery } from '@/api/queries'
import type { RecipeWithMatch } from '@/api/types'
import { RecipeCard, RecipeCardSkeleton } from '@/components/RecipeCard'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { IconButton } from '@/components/ui/IconButton'
import { ToggleTag } from '@/components/ui/Tag'
import { useMyIngredients } from '@/features/capture/useMyIngredients'
import { cx } from '@/lib/cx'
import { useIsDesktop } from '@/lib/useMediaQuery'
import { useLibraryStore } from '@/stores/libraryStore'

type Filter = 'all' | 'cooked' | 'now' | 'recent'
type Sort = 'saved' | 'match' | 'time'
const SORT_LABEL: Record<Sort, string> = { saved: '최근 저장순', match: '재료 일치도순', time: '조리 시간순' }

const canMakeNow = (r: RecipeWithMatch) => Boolean(r.match && r.match.missing.length === 0)

/** 09 찜 / P09 — 필터·정렬은 URL(?filter=&sort=)에 둬요 */
export default function SavedPage() {
  const isDesktop = useIsDesktop()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const filter = (['cooked', 'now', 'recent'].includes(params.get('filter') ?? '') ? params.get('filter') : 'all') as Filter
  const sort = (['match', 'time'].includes(params.get('sort') ?? '') ? params.get('sort') : 'saved') as Sort
  const set = (patch: { filter?: Filter; sort?: Sort }) => {
    const next = { filter, sort, ...patch }
    const q = new URLSearchParams()
    if (next.filter !== 'all') q.set('filter', next.filter)
    if (next.sort !== 'saved') q.set('sort', next.sort)
    setParams(q, { replace: true })
  }

  const saved = useLibraryStore((s) => s.saved)
  const cooked = useLibraryStore((s) => s.cooked)
  const recent = useLibraryStore((s) => s.recent)
  const { have, pantry } = useMyIngredients()

  const savedIds = Object.entries(saved)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => Number(id))
  // 필터에 필요한 레시피를 한 번에 받아요 (찜 + 만든 요리 + 최근 본)
  const allIds = [...new Set([...savedIds, ...cooked, ...recent])]
  const { data, isPending } = useQuery(recipesByIdsQuery(allIds, have, pantry))
  const byId = new Map((data ?? []).map((r) => [r.id, r]))
  const pick = (ids: number[]) => ids.map((id) => byId.get(id)).filter((r): r is RecipeWithMatch => Boolean(r))

  const savedItems = pick(savedIds)
  const counts = { all: savedIds.length, cooked: cooked.length, now: savedItems.filter(canMakeNow).length }
  let items =
    filter === 'cooked' ? pick([...cooked].reverse()) : filter === 'recent' ? pick(recent) : filter === 'now' ? savedItems.filter(canMakeNow) : savedItems
  if (sort === 'match') items = [...items].sort((a, b) => ratio(b) - ratio(a))
  else if (sort === 'time') items = [...items].sort((a, b) => a.timeMin - b.timeMin)
  else if (filter === 'all' && have.length) items = [...items].sort((a, b) => Number(canMakeNow(b)) - Number(canMakeNow(a))) // 오늘 만들 수 있는 요리를 앞에

  const size = isDesktop ? 'l' : 's'
  const chipSize = isDesktop ? 'm' : 's'
  const grid = isDesktop ? 'grid grid-cols-4 gap-x-6 gap-y-10' : 'grid grid-cols-2 gap-x-[15px] gap-y-6 sm:grid-cols-3'
  const title = filter === 'recent' ? '최근 본 레시피' : filter === 'cooked' ? '만들어 본 요리' : '저장한 레시피'

  const chips = (
    <>
      <ToggleTag size={chipSize} dot={false} selected={filter === 'all'} onToggle={() => set({ filter: 'all' })}>
        전체 {counts.all}
      </ToggleTag>
      <ToggleTag size={chipSize} dot={false} selected={filter === 'cooked'} onToggle={() => set({ filter: filter === 'cooked' ? 'all' : 'cooked' })}>
        만들어 본 요리 {counts.cooked}
      </ToggleTag>
      <ToggleTag
        size={chipSize}
        dot={false}
        disabled={!have.length}
        selected={filter === 'now'}
        onToggle={() => set({ filter: filter === 'now' ? 'all' : 'now' })}
      >
        지금 만들 수 있음{have.length ? ` ${counts.now}` : ''}
      </ToggleTag>
      {filter === 'recent' && (
        <ToggleTag size={chipSize} dot={false} selected onToggle={() => set({ filter: 'all' })}>
          최근 본
        </ToggleTag>
      )}
    </>
  )
  const sortSelect = (
    <label className="relative flex items-center text-text-sub">
      <span className="sr-only">정렬</span>
      <select
        value={sort}
        onChange={(e) => set({ sort: e.target.value as Sort })}
        className={cx('cursor-pointer appearance-none bg-transparent pr-5 outline-none', isDesktop ? 'text-body-m-14' : 'text-body-m-13')}
      >
        {(Object.keys(SORT_LABEL) as Sort[]).map((k) => (
          <option key={k} value={k} disabled={k === 'match' && !have.length}>
            {SORT_LABEL[k]}
          </option>
        ))}
      </select>
      <CaretDown size={16} className="pointer-events-none absolute right-0" aria-hidden />
    </label>
  )

  const body =
    isPending && allIds.length ? (
      <div className={grid}>
        {Array.from({ length: isDesktop ? 4 : 4 }, (_, i) => (
          <RecipeCardSkeleton key={i} size={size} />
        ))}
      </div>
    ) : items.length ? (
      <ul className={grid}>
        {items.map((r, i) => (
          <li key={r.id}>
            <RecipeCard recipe={r} match={r.match ?? undefined} size={size} eager={i < 4} />
          </li>
        ))}
      </ul>
    ) : (
      <EmptyState
        icon={Heart}
        title={filter === 'all' ? '아직 찜한 레시피가 없어요' : '해당하는 레시피가 없어요'}
        description={filter === 'all' ? '마음에 드는 레시피의 하트를 눌러 두면 여기에 모여요.' : '다른 필터를 골라 보세요.'}
        action={
          filter === 'all' && (
            <ButtonLink to="/" size="m">
              요리 추천받기
            </ButtonLink>
          )
        }
      />
    )

  if (isDesktop) {
    return (
      <div className="mx-auto max-w-content pb-24">
        <section className="flex flex-col gap-2 pt-12 pb-6">
          <h1 className="text-headline-32 text-text-main">찜</h1>
          <p className="text-body-15 text-text-sub">저장한 레시피 {counts.all}개 · 오늘 재료로 만들 수 있는 요리는 앞에 보여 드려요</p>
        </section>
        <div className="flex items-center gap-2 pb-6">
          {chips}
          <span className="flex-1" />
          {sortSelect}
        </div>
        {body}
      </div>
    )
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center bg-bg-default pr-1.5 pl-5">
        <h1 className="flex-1 text-headline-20 text-text-main">찜</h1>
        <IconButton icon={MagnifyingGlass} label="레시피 검색" onClick={() => navigate('/search')} className="size-11" />
      </header>
      <div className="flex flex-col gap-5 px-5 pt-2 pb-8">
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 scrollbar-none">{chips}</div>
        <div className="flex items-center justify-between">
          <h2 className="text-title-18 text-text-main">
            {title} {items.length}개
          </h2>
          {sortSelect}
        </div>
        {body}
      </div>
    </>
  )
}

function ratio(r: RecipeWithMatch) {
  return r.match && r.match.need ? r.match.have / r.match.need : 0
}
