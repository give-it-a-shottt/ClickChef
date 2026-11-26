import { CaretLeft, Clock, CookingPot, Fire, Heart, ShareNetwork, User } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { recipeQuery } from '@/api/queries'
import type { RecipeDetail } from '@/api/types'
import { BottomBar } from '@/components/layout/BottomBar'
import { SubHeader } from '@/components/layout/MobileHeader'
import { IngredientRow } from '@/components/IngredientRow'
import { RecipeThumb } from '@/components/RecipeThumb'
import { StepItem } from '@/components/StepItem'
import { Badge } from '@/components/ui/Badge'
import { Button, ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { IconButton } from '@/components/ui/IconButton'
import { categoryLabel } from '@/lib/category'
import { useBack } from '@/lib/useBack'
import { cx } from '@/lib/cx'
import { useIsDesktop } from '@/lib/useMediaQuery'
import { useLibraryStore } from '@/stores/libraryStore'
import { useIngredientStatus } from './useIngredientStatus'
import { useRecipeActions } from './useRecipeActions'

/** 05 레시피 상세 / P05 */
export default function RecipeDetailPage() {
  const id = Number(useParams().id)
  const isDesktop = useIsDesktop()
  const { data: recipe, isPending, isError } = useQuery({ ...recipeQuery(id), enabled: Number.isInteger(id) })
  const addRecent = useLibraryStore((s) => s.addRecent)

  useEffect(() => {
    if (recipe) addRecent(recipe.id)
  }, [recipe, addRecent])

  if (isPending) return <DetailSkeleton desktop={isDesktop} />
  if (isError || !recipe) {
    return (
      <>
        {!isDesktop && <SubHeader title="" />}
        <div className="mx-auto max-w-content px-5 py-16">
          <EmptyState
            icon={CookingPot}
            title="레시피를 찾을 수 없어요"
            description="없어졌거나 주소가 잘못된 레시피예요."
            action={
              <ButtonLink to="/" size="m">
                홈으로
              </ButtonLink>
            }
          />
        </div>
      </>
    )
  }
  return isDesktop ? <DesktopDetail recipe={recipe} /> : <MobileDetail recipe={recipe} />
}

function Info({ recipe, desktop }: { recipe: RecipeDetail; desktop: boolean }) {
  const { known, haveCount, mains } = useIngredientStatus(recipe)
  const full = haveCount === mains.length
  return (
    <section className="flex flex-col gap-3">
      <div className="flex gap-1.5">
        {known && (
          <Badge size="m" color={full ? 'green' : 'brand'}>
            {full ? '재료 모두 있음' : `재료 ${haveCount}/${mains.length}`}
          </Badge>
        )}
        <Badge size="m" color="black">
          {categoryLabel(recipe.category)}
        </Badge>
      </div>
      <h1 className={cx('text-text-main', desktop ? 'text-display-32' : 'text-display-28')}>{recipe.name}</h1>
      {recipe.summary && <p className="text-body-15 text-text-sub">{recipe.summary}</p>}
      <ul className="flex gap-4 text-body-m-14 text-text-sub">
        <li className="flex items-center gap-1">
          <Clock size={18} className="text-icon-sub" aria-hidden />
          {recipe.timeMin}분
        </li>
        <li className="flex items-center gap-1">
          <User size={18} className="text-icon-sub" aria-hidden />
          {recipe.servings}인분
        </li>
        <li className="flex items-center gap-1">
          <Fire size={18} className="text-icon-sub" aria-hidden />
          {recipe.difficulty}
        </li>
      </ul>
    </section>
  )
}

function Ingredients({ recipe, desktop }: { recipe: RecipeDetail; desktop: boolean }) {
  const { mains, seasonings, known, owned, haveCount } = useIngredientStatus(recipe)
  return (
    <section className="flex flex-col" aria-labelledby="ingredients-title">
      <div className="flex items-center justify-between pb-1">
        <h2 id="ingredients-title" className={cx('text-text-main', desktop ? 'text-title-18' : 'text-headline-20')}>
          재료
        </h2>
        {known && (
          <span className="text-body-m-13 text-text-sub">
            {mains.length}개 중 {haveCount}개 있어요
          </span>
        )}
      </div>
      <ul>
        {mains.map((i) => (
          <IngredientRow key={i.name} name={i.name} amount={i.amount} have={known ? owned.has(i.name) : undefined} />
        ))}
      </ul>
      {seasonings.length > 0 && (
        <p className="pt-3 text-body-14 text-text-sub">
          <span className="mr-2 text-label-m-13 text-text-main">양념</span>
          {seasonings.map((s) => `${s.name} ${s.amount}`.trim()).join(' · ')}
        </p>
      )}
    </section>
  )
}

function Steps({ recipe, desktop }: { recipe: RecipeDetail; desktop: boolean }) {
  return (
    <section className={cx('flex flex-col', desktop ? 'gap-6' : 'gap-4')} aria-labelledby="steps-title">
      <h2 id="steps-title" className={cx('text-text-main', desktop ? 'text-headline-24' : 'text-headline-20')}>
        조리 순서
      </h2>
      <ol className={cx('flex flex-col', desktop ? 'gap-6' : 'gap-4')}>
        {recipe.steps.map((s) => (
          <StepItem key={s.order} order={s.order} text={s.text} />
        ))}
      </ol>
      {recipe.tip && (
        <p className="rounded-card bg-sub1-soft p-4 text-body-14 text-text-main">
          <span className="mr-1 text-label-14 text-sub1-text">팁</span>
          {recipe.tip}
        </p>
      )}
    </section>
  )
}

function MobileDetail({ recipe }: { recipe: RecipeDetail }) {
  const navigate = useNavigate()
  const back = useBack('/recipes')
  const { saved, toggleSave, share } = useRecipeActions(recipe.id, recipe.name)
  return (
    <>
      <div className="relative h-[300px] bg-bg-image">
        <RecipeThumb id={recipe.id} name={recipe.name} category={recipe.category} imageUrl={recipe.imageUrl} eager />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+8px)]">
          <IconButton icon={CaretLeft} label="뒤로" variant="secondary" shape="circle" size="m" onClick={back} className="bg-bg-default/90 shadow-1" />
          <IconButton icon={ShareNetwork} label="공유" variant="secondary" shape="circle" size="m" onClick={share} className="bg-bg-default/90 shadow-1" />
        </div>
      </div>
      <div className="flex flex-col gap-8 px-5 pt-6 pb-8">
        <Info recipe={recipe} desktop={false} />
        <Ingredients recipe={recipe} desktop={false} />
        <Steps recipe={recipe} desktop={false} />
      </div>
      <BottomBar>
        <IconButton
          icon={Heart}
          weight={saved ? 'fill' : 'regular'}
          label={saved ? '찜 해제' : '찜하기'}
          aria-pressed={saved}
          variant="outline-strong"
          onClick={toggleSave}
          className="size-14"
          iconClassName={saved ? 'text-primary-accent' : undefined}
        />
        <Button size="xl" className="flex-1" onClick={() => navigate(`/recipes/${recipe.id}/cook`)}>
          조리 시작
        </Button>
      </BottomBar>
    </>
  )
}

function DesktopDetail({ recipe }: { recipe: RecipeDetail }) {
  const navigate = useNavigate()
  const back = useBack('/recipes')
  const { saved, toggleSave, share } = useRecipeActions(recipe.id, recipe.name)
  return (
    <div className="mx-auto max-w-content pb-24">
      <button type="button" onClick={back} className="flex items-center gap-2 py-6 text-body-m-14 text-text-sub hover:text-text-main">
        <CaretLeft size={16} aria-hidden />
        추천 목록으로
      </button>
      <div className="flex items-start gap-12">
        <div className="flex min-w-0 flex-1 flex-col gap-12">
          <div className="h-[460px] overflow-hidden rounded-card bg-bg-image">
            <RecipeThumb id={recipe.id} name={recipe.name} category={recipe.category} imageUrl={recipe.imageUrl} eager />
          </div>
          <Steps recipe={recipe} desktop />
        </div>
        <aside className="sticky top-24 flex w-[472px] shrink-0 flex-col gap-6 rounded-card border border-line-light bg-bg-default p-7">
          <Info recipe={recipe} desktop />
          <Ingredients recipe={recipe} desktop />
          <div className="flex flex-col gap-2">
            <Button size="xl" block onClick={() => navigate(`/recipes/${recipe.id}/cook`)}>
              조리 모드 시작
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline-strong"
                className="flex-1"
                leadingIcon={Heart}
                aria-pressed={saved}
                onClick={toggleSave}
              >
                {saved ? '찜했어요' : '찜하기'}
              </Button>
              <Button variant="outline-strong" className="flex-1" leadingIcon={ShareNetwork} onClick={share}>
                공유
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function DetailSkeleton({ desktop }: { desktop: boolean }) {
  return (
    <div className={cx('animate-pulse', desktop ? 'mx-auto flex max-w-content gap-12 pt-16' : '')} aria-busy aria-label="레시피를 불러오는 중">
      <div className={cx('bg-bg-regular', desktop ? 'h-[460px] flex-1 rounded-card' : 'h-[300px]')} />
      <div className={cx('flex flex-col gap-3', desktop ? 'w-[472px]' : 'px-5 pt-6')}>
        <div className="h-6 w-24 rounded-tag bg-bg-regular" />
        <div className="h-9 w-2/3 rounded bg-bg-regular" />
        <div className="h-5 w-full rounded bg-bg-regular" />
      </div>
    </div>
  )
}
