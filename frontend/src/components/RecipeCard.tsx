import { Clock, Heart, User } from '@phosphor-icons/react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router'
import { recipeQuery } from '@/api/queries'
import type { Match, RecipeSummary } from '@/api/types'
import { Badge } from '@/components/ui/Badge'
import { cx } from '@/lib/cx'
import { useIsSaved, useLibraryStore } from '@/stores/libraryStore'
import { showToast } from '@/stores/toastStore'
import { RecipeThumb } from './RecipeThumb'

type Props = {
  recipe: RecipeSummary
  match?: Match
  /** S = MO 2열(160), L = PC 4열(282) — 너비는 그리드가 정해요 */
  size?: 's' | 'l'
  eager?: boolean
}

/**
 * 피그마 Recipe Card — 썸네일 4:3 + 일치도 배지 + 이름(2줄) + 시간·인분 + 부족한 재료.
 * 카드 전체가 상세로 가는 링크이고, 찜 하트만 따로 눌려요.
 */
export function RecipeCard({ recipe, match, size = 's', eager }: Props) {
  const queryClient = useQueryClient()
  const prefetch = () => void queryClient.prefetchQuery(recipeQuery(recipe.id))
  const full = match && match.missing.length === 0
  return (
    <article className={cx('group relative flex flex-col', size === 's' ? 'gap-3' : 'gap-4')} onMouseEnter={prefetch} onFocus={prefetch}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-thumbnail bg-bg-image">
        <RecipeThumb
          id={recipe.id}
          name={recipe.name}
          category={recipe.category}
          imageUrl={recipe.imageUrl}
          eager={eager}
          className="transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <WishButton id={recipe.id} size={size} />
      </div>
      <div className="flex flex-col gap-1">
        {match && (
          <Badge color={full ? 'green' : 'brand'}>{full ? '재료 모두 있음' : `재료 ${match.have}/${match.need}`}</Badge>
        )}
        <h3 className={cx('line-clamp-2 text-text-main', size === 's' ? 'text-title-16' : 'text-title-18')}>
          {/* 제목 링크를 카드 전체로 늘려요 (하트 버튼은 위에 따로) */}
          <Link to={`/recipes/${recipe.id}`} className="after:absolute after:inset-0 after:rounded-thumbnail focus-visible:shadow-none">
            {recipe.name}
          </Link>
        </h3>
        <div className="flex items-center gap-2 text-caption-12 text-text-sub-weak">
          <span className="flex items-center gap-0.5">
            <Clock size={16} className="text-icon-sub-weak" aria-hidden />
            {recipe.timeMin}분
          </span>
          <span className="flex items-center gap-0.5">
            <User size={16} className="text-icon-sub-weak" aria-hidden />
            {recipe.servings}인분
          </span>
        </div>
        {match && match.missing.length > 0 && (
          <p className="line-clamp-1 text-body-12 text-text-sub">부족: {match.missing.join(', ')}</p>
        )}
      </div>
    </article>
  )
}

function WishButton({ id, size }: { id: number; size: 's' | 'l' }) {
  const saved = useIsSaved(id)
  const toggleSaved = useLibraryStore((s) => s.toggleSaved)
  const navigate = useNavigate()
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? '찜 해제' : '찜하기'}
      onClick={() => {
        const now = toggleSaved(id)
        showToast(
          now
            ? { message: '찜 목록에 저장했어요', icon: true, action: { label: '보기', onClick: () => navigate('/saved') } }
            : { message: '찜을 해제했어요' },
        )
      }}
      className={cx(
        'absolute right-2 bottom-2 z-10 flex items-center justify-center rounded-full bg-bg-default shadow-1 transition-transform active:scale-90',
        size === 's' ? 'size-9' : 'size-10',
      )}
    >
      <Heart size={20} weight={saved ? 'fill' : 'regular'} className={saved ? 'text-primary-accent' : 'text-icon-main'} aria-hidden />
    </button>
  )
}

/** 데이터를 기다릴 때 보여 주는 카드 자리 */
export function RecipeCardSkeleton({ size = 's' }: { size?: 's' | 'l' }) {
  return (
    <div className={cx('flex animate-pulse flex-col', size === 's' ? 'gap-3' : 'gap-4')} aria-hidden>
      <div className="aspect-[4/3] rounded-thumbnail bg-bg-regular" />
      <div className="flex flex-col gap-2">
        <div className="h-5 w-14 rounded-tag bg-bg-regular" />
        <div className="h-5 w-3/4 rounded bg-bg-regular" />
        <div className="h-4 w-1/2 rounded bg-bg-regular" />
      </div>
    </div>
  )
}
