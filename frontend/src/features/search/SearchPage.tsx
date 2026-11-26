import { CaretLeft, MagnifyingGlass, X } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { searchQuery } from '@/api/queries'
import { RecipeCard, RecipeCardSkeleton } from '@/components/RecipeCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { IconButton } from '@/components/ui/IconButton'
import { useBack } from '@/lib/useBack'
import { cx } from '@/lib/cx'
import { useIsDesktop } from '@/lib/useMediaQuery'

const SUGGESTIONS = ['김치', '달걀', '두부', '찌개', '볶음밥', '감자']

/** 검색 — 디자인이 없어서 추천 목록 그리드를 재사용했어요. 검색어는 URL(?q=)에 둬요. */
export default function SearchPage() {
  const isDesktop = useIsDesktop()
  const [params, setParams] = useSearchParams()
  const q = (params.get('q') ?? '').trim()
  const search = (next: string) => setParams(next.trim() ? { q: next.trim() } : {}, { replace: true })

  return (
    <>
      {!isDesktop && <MobileSearchBar initial={q} onSearch={search} />}
      <div className={cx('mx-auto max-w-content', isDesktop ? 'pt-12 pb-24' : 'px-5 pt-5 pb-8')}>
        {q ? <Results q={q} desktop={isDesktop} /> : <Suggestions onPick={search} desktop={isDesktop} />}
      </div>
    </>
  )
}

function MobileSearchBar({ initial, onSearch }: { initial: string; onSearch: (q: string) => void }) {
  const back = useBack('/')
  const [value, setValue] = useState(initial)
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-1 border-b border-line-light bg-bg-default pr-4 pl-1.5">
      <IconButton icon={CaretLeft} label="뒤로" onClick={back} className="size-11" />
      <form
        role="search"
        className="flex h-10 flex-1 items-center gap-2 rounded-input bg-bg-regular px-3"
        onSubmit={(e) => {
          e.preventDefault()
          onSearch(value)
        }}
      >
        <MagnifyingGlass size={18} className="shrink-0 text-icon-sub-weak" aria-hidden />
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="재료나 요리 이름으로 검색"
          aria-label="재료나 요리 이름으로 검색"
          autoFocus={!initial}
          enterKeyHint="search"
          className="min-w-0 flex-1 bg-transparent text-[16px]/[22px] text-text-main outline-none placeholder:text-text-sub-weak"
        />
        {value && (
          <button
            type="button"
            aria-label="검색어 지우기"
            onClick={() => {
              setValue('')
              onSearch('')
            }}
          >
            <X size={18} className="text-icon-sub" aria-hidden />
          </button>
        )}
      </form>
    </header>
  )
}

function Suggestions({ onPick, desktop }: { onPick: (q: string) => void; desktop: boolean }) {
  return (
    <section className="flex flex-col gap-4">
      <h1 className={cx('text-text-main', desktop ? 'text-headline-32' : 'text-title-18')}>무엇을 찾아볼까요?</h1>
      <p className="text-body-14 text-text-sub">요리 이름이나 재료로 찾아보세요.</p>
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="h-10 rounded-full border border-line-regular px-4 text-body-14 text-text-main hover:bg-bg-light"
          >
            {s}
          </button>
        ))}
      </div>
    </section>
  )
}

function Results({ q, desktop }: { q: string; desktop: boolean }) {
  const { data, isPending } = useQuery(searchQuery(q))
  const size = desktop ? 'l' : 's'
  const grid = desktop ? 'grid grid-cols-4 gap-x-6 gap-y-10' : 'grid grid-cols-2 gap-x-[15px] gap-y-6 sm:grid-cols-3'
  return (
    <section className="flex flex-col gap-5">
      <h1 className={cx('text-text-main', desktop ? 'text-headline-32' : 'text-title-18')} aria-live="polite">
        ‘{q}’ 검색 결과{data ? ` ${data.length}개` : ''}
      </h1>
      {isPending ? (
        <div className={grid}>
          {Array.from({ length: desktop ? 4 : 4 }, (_, i) => (
            <RecipeCardSkeleton key={i} size={size} />
          ))}
        </div>
      ) : data?.length ? (
        <ul className={grid}>
          {data.map((r, i) => (
            <li key={r.id}>
              <RecipeCard recipe={r} size={size} eager={i < 4} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={MagnifyingGlass} title="검색 결과가 없어요" description="다른 이름이나 재료로 찾아보세요." />
      )}
    </section>
  )
}
