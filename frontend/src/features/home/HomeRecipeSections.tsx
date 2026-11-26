import { useQuery } from '@tanstack/react-query'
import { collectionsQuery, recipesByIdsQuery } from '@/api/queries'
import { RecipeCarousel } from '@/components/RecipeCarousel'
import { useMyIngredients } from '@/features/capture/useMyIngredients'
import { cx } from '@/lib/cx'
import type { CategoryKey } from '@/lib/category'
import { useLibraryStore } from '@/stores/libraryStore'

/** 최근 본 레시피 — 본 게 없으면 섹션 자체를 숨겨요 */
function Recent({ desktop }: { desktop: boolean }) {
  const recent = useLibraryStore((s) => s.recent)
  const { have, pantry } = useMyIngredients()
  const ids = recent.slice(0, 12)
  const { data, isPending } = useQuery(recipesByIdsQuery(ids, have, pantry))
  if (!ids.length) return null
  return <RecipeCarousel title="최근 본 레시피" items={data} loading={isPending} desktop={desktop} moreTo="/saved?filter=recent" />
}

const SECTIONS: Array<{ key: CategoryKey; title: string; subtitle: string }> = [
  { key: 'bowl', title: '든든한 한 그릇', subtitle: '밥 한 그릇으로 끝나는 메뉴' },
  { key: 'soup', title: '뜨끈한 국·찌개', subtitle: '국물이 당기는 날' },
  { key: 'side', title: '매일 먹는 반찬', subtitle: '냉장고 재료로 뚝딱' },
  { key: 'snack', title: '출출할 때 간식', subtitle: '가볍게 즐기는 디저트와 간식' },
]

/** 홈 레시피 섹션: 최근 본 레시피 + 종류별 4개 섹션(날마다 다른 레시피) */
export function HomeRecipeSections({ desktop }: { desktop: boolean }) {
  const { data, isPending } = useQuery(collectionsQuery())
  return (
    <div className={cx('flex flex-col', desktop ? 'gap-16' : 'gap-9')}>
      <Recent desktop={desktop} />
      {SECTIONS.map((s) => (
        <RecipeCarousel key={s.key} title={s.title} subtitle={s.subtitle} items={data?.[s.key]} loading={isPending} desktop={desktop} />
      ))}
    </div>
  )
}
