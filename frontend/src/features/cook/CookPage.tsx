import { Check, Lightbulb, ListBullets, X } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Navigate, useBlocker, useNavigate, useParams } from 'react-router'
import { useShallow } from 'zustand/react/shallow'
import { recipeQuery } from '@/api/queries'
import type { RecipeDetail } from '@/api/types'
import { IngredientRow } from '@/components/IngredientRow'
import { Badge } from '@/components/ui/Badge'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { IconButton } from '@/components/ui/IconButton'
import { useIngredientStatus } from '@/features/recipe/useIngredientStatus'
import { cx } from '@/lib/cx'
import { useIsDesktop } from '@/lib/useMediaQuery'
import { useWakeLock } from '@/lib/useWakeLock'
import { useLibraryStore } from '@/stores/libraryStore'
import { usePrefsStore } from '@/stores/prefsStore'
import { useCookStore } from './cookStore'
import { CookTimer } from './CookTimer'

/** 07 조리 모드 (+07-2 타이머, 07-3 재료 보기, 07-4 나가기 확인) / P07 */
export default function CookPage() {
  const id = Number(useParams().id)
  const { data: recipe, isPending, isError } = useQuery({ ...recipeQuery(id), enabled: Number.isInteger(id) })
  if (isPending) return <div className="min-h-dvh animate-pulse bg-bg-light" aria-busy />
  if (isError || !recipe || !recipe.steps.length) return <Navigate to={`/recipes/${id}`} replace />
  return <CookMode recipe={recipe} />
}

function CookMode({ recipe }: { recipe: RecipeDetail }) {
  const isDesktop = useIsDesktop()
  const navigate = useNavigate()
  const keepAwake = usePrefsStore((s) => s.keepAwake)
  const awake = useWakeLock(keepAwake)
  const markCooked = useLibraryStore((s) => s.markCooked)
  const { step, timerStatus, begin, goTo } = useCookStore(
    useShallow((s) => ({ step: s.step, timerStatus: s.timer.status, begin: s.begin, goTo: s.goTo })),
  )
  const [sheet, setSheet] = useState(false)

  const total = recipe.steps.length
  const current = recipe.steps[Math.min(step, total - 1)]
  const isLast = step >= total - 1

  useEffect(() => {
    begin(recipe.id, recipe.steps[0]?.timerSec ?? null)
  }, [begin, recipe])

  const go = (next: number) => {
    if (next < 0) return
    if (next >= total) {
      markCooked(recipe.id)
      const startedAt = useCookStore.getState().startedAt ?? Date.now()
      const elapsedMin = Math.max(1, Math.round((Date.now() - startedAt) / 60000))
      navigate(`/recipes/${recipe.id}/done`, { replace: true, state: { elapsedMin } })
      return
    }
    goTo(next, recipe.steps[next].timerSec)
    window.scrollTo({ top: 0 })
  }

  // 키보드 ← → 로 단계 이동 (입력창이 아닐 때)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || document.querySelector('dialog[open]')) return
      if (e.key === 'ArrowRight') go(step + 1)
      if (e.key === 'ArrowLeft') go(step - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // 조리 중에 나가려고 하면(뒤로 가기 포함) 확인창을 띄워요. 완료 화면으로 가는 건 막지 않아요.
  const inProgress = step > 0 || timerStatus === 'running' || timerStatus === 'paused'
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      inProgress && currentLocation.pathname !== nextLocation.pathname && !nextLocation.pathname.endsWith('/done'),
  )
  const exit = () => navigate(`/recipes/${recipe.id}`, { replace: true })

  const amountOf = (name: string) => recipe.ingredients.find((i) => i.name === name)?.amount ?? ''
  const stepIngredients = current.ingredients.map((n) => `${n} ${amountOf(n)}`.trim())
  const next = recipe.steps[step + 1]

  const wake = awake && (
    <span className="flex items-center gap-1 text-caption-12 text-text-sub-weak">
      <Check size={14} weight="bold" aria-hidden />
      화면이 꺼지지 않아요
    </span>
  )
  const segments = (
    <div className="flex gap-1" aria-hidden>
      {recipe.steps.map((s, i) => (
        <span key={s.order} className={cx('h-1.5 flex-1 rounded-full transition-colors', i <= step ? 'bg-primary-accent' : 'bg-bg-regular')} />
      ))}
    </div>
  )
  const ingredientsBlock = stepIngredients.length > 0 && (
    <div className={cx('flex flex-col', isDesktop ? 'gap-3' : 'gap-2')}>
      <span className={cx('text-text-sub', isDesktop ? 'text-label-m-14' : 'text-label-m-13')}>이 단계 재료</span>
      <ul className={cx('flex flex-wrap', isDesktop ? 'gap-2' : 'gap-1.5')}>
        {stepIngredients.map((t) => (
          <li key={t}>
            <Badge size="m" color="black">
              {t}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  )
  const tip = recipe.tip && (
    <div className={cx('flex gap-3 rounded-card bg-sub1-soft', isDesktop ? 'px-5 py-4' : 'p-4')}>
      <Lightbulb size={20} className="shrink-0 text-sub1-text" aria-hidden />
      <p className="text-body-14 text-text-main">{recipe.tip}</p>
    </div>
  )

  const dialog = (
    <Dialog
      open={blocker.state === 'blocked'}
      onClose={() => blocker.reset?.()}
      title="조리를 끝낼까요?"
      description={'지금 나가면 진행 중인 타이머가 멈춰요.\n다시 들어오면 처음 단계부터 시작해요.'}
      cancelLabel="계속 요리하기"
      confirmLabel="끝내기"
      onConfirm={() => {
        useCookStore.setState({ recipeId: null })
        blocker.proceed?.()
      }}
    />
  )

  if (isDesktop) {
    return (
      <div className="flex min-h-dvh flex-col">
        <header className="flex h-18 items-center gap-4 px-10">
          <Button variant="ghost" size="m" onClick={exit}>
            나가기
          </Button>
          <h1 className="flex-1 text-title-18 text-text-main">{recipe.name} · 조리 모드</h1>
          {wake}
        </header>
        <div className="px-10">{segments}</div>
        <div className="mx-auto flex w-full max-w-content flex-1 gap-16 pt-14 pb-10">
          <section className="flex min-w-0 flex-1 flex-col gap-8" aria-live="polite">
            <span className="w-fit rounded-full bg-primary-soft px-3.5 py-1.5 text-label-15 text-primary-text">
              {step + 1} / {total} 단계
            </span>
            <p className="text-display-40 text-text-main">{current.text}</p>
            {ingredientsBlock}
          </section>
          <aside className="flex w-100 shrink-0 flex-col gap-4">
            <CookTimer key={step} onNext={() => go(step + 1)} isLast={isLast} />
            {tip}
            {next && (
              <div className="flex flex-col gap-1 rounded-card bg-bg-light px-5 py-4">
                <span className="text-caption-m-12 text-text-sub-weak">다음 단계</span>
                <p className="text-body-m-14 text-text-sub">
                  {next.order}. {next.text}
                </p>
              </div>
            )}
          </aside>
        </div>
        <nav className="sticky bottom-0 border-t border-line-light bg-bg-default">
          <div className="mx-auto flex max-w-content items-center gap-4 pt-4 pb-6">
            <Button variant="outline-strong" size="xl" className="w-50" onClick={() => go(step - 1)} disabled={step === 0}>
              이전 단계
            </Button>
            <p className="flex-1 text-center text-body-13 text-text-sub-weak">키보드 ← → 로도 넘길 수 있어요</p>
            <Button size="xl" className="w-70" onClick={() => go(step + 1)}>
              {isLast ? '요리 완료' : '다음 단계'}
            </Button>
          </div>
        </nav>
        {dialog}
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 bg-bg-default">
        <div className="flex h-14 items-center px-1.5">
          <IconButton icon={X} label="나가기" onClick={exit} className="size-11" />
          <h1 className="flex-1 truncate text-center text-title-16 text-text-main">{recipe.name}</h1>
          <IconButton icon={ListBullets} label="재료 보기" onClick={() => setSheet(true)} className="size-11" />
        </div>
        <div className="flex flex-col gap-2 px-5 pt-1 pb-1">
          <div className="flex items-center justify-between">
            <span className="text-label-14 text-primary-text">
              {step + 1} / {total} 단계
            </span>
            {wake}
          </div>
          {segments}
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-6 px-5 pt-7 pb-6" aria-live="polite">
        <section className="flex flex-col gap-3">
          <span className="w-fit rounded-full bg-primary-soft px-2.5 py-1 text-label-13 text-primary-text">{step + 1}단계</span>
          <p className="text-headline-24 text-text-main">{current.text}</p>
        </section>
        {ingredientsBlock}
        <CookTimer key={step} onNext={() => go(step + 1)} isLast={isLast} />
        {tip}
      </div>
      <nav className="sticky bottom-0 flex gap-2 border-t border-line-light bg-bg-default px-5 pt-3 pb-safe-plus">
        <Button variant="outline-strong" size="xl" className="w-28" onClick={() => go(step - 1)} disabled={step === 0}>
          이전
        </Button>
        <Button size="xl" className="flex-1" onClick={() => go(step + 1)}>
          {isLast ? '요리 완료' : '다음 단계'}
        </Button>
      </nav>
      <IngredientsSheet recipe={recipe} open={sheet} onClose={() => setSheet(false)} />
      {dialog}
    </div>
  )
}

/** 07-3 재료 보기 — 조리 중 오른쪽 위 목록 아이콘 */
function IngredientsSheet({ recipe, open, onClose }: { recipe: RecipeDetail; open: boolean; onClose: () => void }) {
  const { mains, seasonings, known, owned } = useIngredientStatus(recipe)
  return (
    <BottomSheet open={open} onClose={onClose} title={`재료 보기 · ${recipe.servings}인분`}>
      <ul>
        {mains.map((i) => (
          <IngredientRow key={i.name} name={i.name} amount={i.amount} have={known ? owned.has(i.name) : undefined} />
        ))}
      </ul>
      {seasonings.length > 0 && (
        <div className="flex flex-col gap-1 pt-4">
          <span className="text-label-13 text-text-sub">양념</span>
          <p className="text-body-14 text-text-main">{seasonings.map((s) => `${s.name} ${s.amount}`.trim()).join(' · ')}</p>
        </div>
      )}
    </BottomSheet>
  )
}
