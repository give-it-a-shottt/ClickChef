import { CaretDown, CookingPot, MagnifyingGlass, SlidersHorizontal } from '@phosphor-icons/react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import type { SortKey } from '@/api/types'
import { SubHeader } from '@/components/layout/MobileHeader'
import { RecipeCard, RecipeCardSkeleton } from '@/components/RecipeCard'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button, ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { IconButton } from '@/components/ui/IconButton'
import { ToggleTag } from '@/components/ui/Tag'
import { cx } from '@/lib/cx'
import { useIsDesktop } from '@/lib/useMediaQuery'
import { FilterPanel } from './FilterPanel'
import { SORT_LABEL, useFilters } from './useFilters'
import { useRecommend } from './useRecommend'

/** 04 추천 목록 / P04 */
export default function RecommendPage() {
  const isDesktop = useIsDesktop()
  return isDesktop ? <DesktopRecommend /> : <MobileRecommend />
}

function UsedIngredients({ have, desktop }: { have: string[]; desktop: boolean }) {
  const navigate = useNavigate()
  return (
    <div className={cx('flex items-center gap-3 rounded-card bg-bg-light py-3 pr-2', desktop ? 'w-[277px] shrink-0 pl-5' : 'pl-4')}>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-caption-m-12 text-text-sub">내 재료 {have.length}개 + 기본 양념</span>
        <span className="truncate text-label-14 text-text-main">{have.join(' · ')}</span>
      </div>
      <Button variant="ghost" size="s" onClick={() => navigate('/ingredients')}>
        {desktop ? '재료 수정' : '수정'}
      </Button>
    </div>
  )
}

function SortSelect({ desktop }: { desktop: boolean }) {
  const { sort, update } = useFilters()
  return (
    <label className="relative flex items-center gap-1 text-text-sub">
      <span className="sr-only">정렬</span>
      <select
        value={sort}
        onChange={(e) => update({ sort: e.target.value as SortKey })}
        className={cx('cursor-pointer appearance-none bg-transparent pr-5 text-right outline-none', desktop ? 'text-body-m-14' : 'text-body-m-13')}
      >
        {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
          <option key={k} value={k}>
            {desktop ? SORT_LABEL[k] : SORT_LABEL[k].replace('재료 ', '')}
          </option>
        ))}
      </select>
      <CaretDown size={16} className="pointer-events-none absolute right-0" aria-hidden />
    </label>
  )
}

function Results({ desktop }: { desktop: boolean }) {
  const { query } = useRecommend()
  const { reset, activeCount } = useFilters()
  const size = desktop ? 'l' : 's'
  const grid = desktop ? 'grid grid-cols-3 gap-x-6 gap-y-10' : 'grid grid-cols-2 gap-x-[15px] gap-y-6 sm:grid-cols-3'

  if (query.isPending) {
    return (
      <div className={grid} aria-busy>
        {Array.from({ length: desktop ? 6 : 4 }, (_, i) => (
          <RecipeCardSkeleton key={i} size={size} />
        ))}
      </div>
    )
  }
  if (query.isError) {
    return (
      <EmptyState
        icon={CookingPot}
        title="추천을 불러오지 못했어요"
        description={query.error.message}
        action={
          <Button size="m" onClick={() => void query.refetch()}>
            다시 시도
          </Button>
        }
      />
    )
  }
  if (!query.data.items.length) {
    return (
      <EmptyState
        icon={MagnifyingGlass}
        title="조건에 맞는 요리가 없어요"
        description="필터를 줄이거나 재료를 더 넣어 보세요."
        action={
          <>
            {activeCount > 0 && (
              <Button size="m" variant="secondary" onClick={reset}>
                필터 초기화
              </Button>
            )}
            <ButtonLink to="/ingredients" size="m">
              재료 추가하기
            </ButtonLink>
          </>
        }
      />
    )
  }
  return (
    <ul className={cx(grid, query.isPlaceholderData && 'opacity-60 transition-opacity')}>
      {query.data.items.map((r, i) => (
        <li key={r.id}>
          <RecipeCard recipe={r} match={r.match} size={size} eager={i < 4} />
        </li>
      ))}
    </ul>
  )
}

function NoIngredients({ desktop }: { desktop: boolean }) {
  return (
    <>
      {!desktop && <SubHeader title="추천 요리" />}
      <div className="mx-auto max-w-content px-5 py-12">
        <EmptyState
          icon={CookingPot}
          title="재료를 먼저 알려 주세요"
          description="냉장고 사진을 찍거나 재료를 직접 입력하면 만들 수 있는 요리를 찾아 드려요."
          action={
            <>
              <ButtonLink to={desktop ? '/' : '/capture'} size="m">
                {desktop ? '사진 올리기' : '재료 촬영하기'}
              </ButtonLink>
              <ButtonLink to="/ingredients?manual=1" size="m" variant="secondary">
                직접 입력하기
              </ButtonLink>
            </>
          }
        />
      </div>
    </>
  )
}

function MobileRecommend() {
  const { query, have } = useRecommend()
  const f = useFilters()
  const [sheet, setSheet] = useState(false)
  if (!have.length) return <NoIngredients desktop={false} />
  const total = query.data?.total

  return (
    <>
      <SubHeader
        title="추천 요리"
        fallback="/ingredients"
        actions={
          <span className="relative">
            <IconButton icon={SlidersHorizontal} label="필터" onClick={() => setSheet(true)} className="size-11" />
            {f.activeCount > 0 && (
              <span className="pointer-events-none absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-primary-default text-[10px] font-semibold text-white">
                {f.activeCount}
              </span>
            )}
          </span>
        }
      />
      <div className="flex flex-col gap-5 px-5 pt-4 pb-8">
        <UsedIngredients have={have} desktop={false} />
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 scrollbar-none">
          <ToggleTag dot={false} selected={f.activeCount === 0} onToggle={f.reset}>
            전체
          </ToggleTag>
          <ToggleTag dot={false} selected={f.match === 'full'} onToggle={() => f.update({ match: f.match === 'full' ? 'all' : 'full' })}>
            재료 모두 있음
          </ToggleTag>
          <ToggleTag dot={false} selected={f.maxTime === 15} onToggle={() => f.update({ maxTime: f.maxTime === 15 ? null : 15 })}>
            15분 이내
          </ToggleTag>
          <ToggleTag
            dot={false}
            selected={f.cats.includes('bowl')}
            onToggle={() => f.update({ cats: f.cats.includes('bowl') ? f.cats.filter((c) => c !== 'bowl') : [...f.cats, 'bowl'] })}
          >
            한 그릇
          </ToggleTag>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-title-18 text-text-main" aria-live="polite">
            지금 만들 수 있는 요리{total !== undefined ? ` ${total}개` : ''}
          </h1>
          <SortSelect desktop={false} />
        </div>
        <Results desktop={false} />
      </div>
      <BottomSheet
        open={sheet}
        onClose={() => setSheet(false)}
        title="필터"
        footer={
          <Button size="xl" block onClick={() => setSheet(false)}>
            {total !== undefined ? `요리 ${total}개 보기` : '적용하기'}
          </Button>
        }
      >
        <div className="pt-2">
          <FilterPanel />
        </div>
      </BottomSheet>
    </>
  )
}

function DesktopRecommend() {
  const { query, have } = useRecommend()
  if (!have.length) return <NoIngredients desktop />
  const total = query.data?.total
  return (
    <>
      <section className="mx-auto flex max-w-content items-end gap-6 pt-12 pb-8">
        <div className="flex flex-1 flex-col gap-2">
          <h1 className="text-headline-32 text-text-main" aria-live="polite">
            지금 만들 수 있는 요리{total !== undefined ? ` ${total}개` : ''}
          </h1>
          <p className="text-body-15 text-text-sub">내 재료와 많이 겹치는 요리부터 보여 드려요</p>
        </div>
        <UsedIngredients have={have} desktop />
      </section>
      <div className="mx-auto flex max-w-content gap-10 pb-24">
        <aside className="w-60 shrink-0" aria-label="필터">
          <div className="sticky top-24">
            <FilterPanel />
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="flex items-center justify-between">
            <span className="text-label-15 text-text-main">{total ?? 0}개</span>
            <SortSelect desktop />
          </div>
          <Results desktop />
        </div>
      </div>
    </>
  )
}
