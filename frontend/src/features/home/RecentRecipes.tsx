import { useQuery } from '@tanstack/react-query'
import { featuredQuery, recipesByIdsQuery } from '@/api/queries'
import { RecipeCard, RecipeCardSkeleton } from '@/components/RecipeCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { useMyIngredients } from '@/features/capture/useMyIngredients'
import { cx } from '@/lib/cx'
import { useLibraryStore } from '@/stores/libraryStore'

/**
 * 최근 본 레시피. 처음 와서 본 게 없으면 오늘의 쉬운 요리를 보여 줘요.
 * MO는 가로 스크롤(카드 160), PC는 4열(282).
 */
export function RecentRecipes({ desktop }: { desktop: boolean }) {
  const recent = useLibraryStore((s) => s.recent)
  const { have, pantry } = useMyIngredients()
  const ids = recent.slice(0, desktop ? 4 : 10)
  const recentQ = useQuery(recipesByIdsQuery(ids, have, pantry))
  const featuredQ = useQuery({ ...featuredQuery(), enabled: ids.length === 0 })
  const showRecent = ids.length > 0
  const items = showRecent ? recentQ.data : featuredQ.data?.map((r) => ({ ...r, match: null }))
  const loading = showRecent ? recentQ.isPending : featuredQ.isPending
  const size = desktop ? 'l' : 's'
  const list = desktop ? items?.slice(0, 4) : items

  if (!loading && !list?.length) return null
  return (
    <section aria-labelledby="recent-title" className={cx('flex flex-col', desktop ? 'gap-6' : 'gap-4')}>
      <div id="recent-title">
        <SectionHeader
          title={showRecent ? '최근 본 레시피' : '이런 요리 어때요?'}
          moreTo={showRecent ? '/saved?filter=recent' : undefined}
        />
      </div>
      <div
        className={cx(
          desktop
            ? 'grid grid-cols-4 gap-6'
            : '-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-1 scrollbar-none',
        )}
      >
        {loading
          ? Array.from({ length: desktop ? 4 : 2 }, (_, i) => (
              <div key={i} className={desktop ? '' : 'w-40 shrink-0'}>
                <RecipeCardSkeleton size={size} />
              </div>
            ))
          : list?.map((r, i) => (
              <div key={r.id} className={desktop ? '' : 'w-40 shrink-0 snap-start'}>
                <RecipeCard recipe={r} match={r.match ?? undefined} size={size} eager={i < 2} />
              </div>
            ))}
      </div>
    </section>
  )
}
