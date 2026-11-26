import { X } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { recipeQuery } from '@/api/queries'
import { RecipeThumb } from '@/components/RecipeThumb'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { ToggleTag } from '@/components/ui/Tag'
import { cx } from '@/lib/cx'
import { useIsDesktop } from '@/lib/useMediaQuery'
import { useLibraryStore } from '@/stores/libraryStore'
import { usePrefsStore, type Feedback } from '@/stores/prefsStore'
import { showToast } from '@/stores/toastStore'
import { useCookStore } from './cookStore'

const OPTIONS: Array<{ key: Feedback; label: string; pc?: string }> = [
  { key: 'again', label: '또 만들래요' },
  { key: 'good', label: '보통이에요' },
  { key: 'hard', label: '어려웠어요', pc: '좀 어려웠어요' },
]

/** 08 조리 완료 / P08 */
export default function DonePage() {
  const id = Number(useParams().id)
  const isDesktop = useIsDesktop()
  const navigate = useNavigate()
  const elapsed = (useLocation().state as { elapsedMin?: number } | null)?.elapsedMin
  const { data: recipe, isPending } = useQuery({ ...recipeQuery(id), enabled: Number.isInteger(id) })
  const feedback = usePrefsStore((s) => s.feedback[id])
  const setFeedback = usePrefsStore((s) => s.setFeedback)
  const saved = useLibraryStore((s) => id in s.saved)
  const toggleSaved = useLibraryStore((s) => s.toggleSaved)

  // 조리를 끝냈으니 다음에 조리 모드에 들어오면 처음 단계부터 시작해요
  useEffect(() => {
    useCookStore.setState({ recipeId: null, step: 0 })
  }, [])

  if (isPending) return <div className="min-h-dvh" aria-busy />
  if (!recipe) return <Navigate to="/" replace />

  const saveAndFinish = () => {
    if (!saved) toggleSaved(recipe.id)
    showToast({ message: '찜 목록에 저장했어요', icon: true })
    navigate('/', { replace: true })
  }
  const home = () => navigate('/', { replace: true })
  // 단계를 빠르게 넘겨 본 경우(3분 미만)는 레시피 기준 시간을 보여 줘요
  const minutes = elapsed && elapsed >= 3 ? elapsed : recipe.timeMin

  const feedbackCard = (
    <section className={cx('flex flex-col gap-3 rounded-card bg-bg-light', isDesktop ? 'p-6' : 'p-5')} aria-labelledby="feedback-title">
      <div className="flex flex-col gap-1">
        <h2 id="feedback-title" className="text-title-16 text-text-main">
          오늘 요리 어땠어요?
        </h2>
        <p className="text-body-13 text-text-sub">다음 추천에 반영할게요</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((o) => (
          <ToggleTag key={o.key} size={isDesktop ? 'm' : 's'} dot={false} selected={feedback === o.key} onToggle={() => setFeedback(recipe.id, o.key)}>
            {isDesktop ? (o.pc ?? o.label) : o.label}
          </ToggleTag>
        ))}
      </div>
    </section>
  )

  const heading = (
    <>
      <Badge size="m" color="green">
        {recipe.steps.length}단계 완료 · {minutes}분
      </Badge>
      <div className="flex flex-col gap-2">
        <h1 className={cx('text-text-main', isDesktop ? 'text-display-40' : 'text-display-28')}>
          완성했어요!
          <br />
          맛있게 드세요
        </h1>
        <p className="text-body-15 text-text-sub">
          {recipe.name} · {recipe.servings}인분
        </p>
      </div>
    </>
  )

  if (isDesktop) {
    return (
      <div className="flex min-h-dvh flex-col">
        <header className="flex h-18 items-center px-10">
          <Button variant="ghost" size="m" onClick={home}>
            닫기
          </Button>
        </header>
        <div className="flex flex-1 items-center justify-center gap-20 pb-20">
          <div className="size-100 overflow-hidden rounded-full bg-bg-image">
            <RecipeThumb id={recipe.id} name={recipe.name} category={recipe.category} imageUrl={recipe.imageUrl} eager />
          </div>
          <div className="flex w-120 flex-col gap-6">
            {heading}
            {feedbackCard}
            <div className="flex gap-2">
              <Button size="xl" className="flex-1" onClick={saveAndFinish}>
                {saved ? '끝내기' : '찜하고 끝내기'}
              </Button>
              <Button variant="outline-strong" size="xl" className="w-35" onClick={home}>
                홈으로
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-14 items-center justify-end px-1.5">
        <IconButton icon={X} label="닫기" onClick={home} className="size-11" />
      </header>
      <div className="flex flex-1 flex-col gap-6 px-5 pt-2 pb-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="size-40 overflow-hidden rounded-full bg-bg-image">
            <RecipeThumb id={recipe.id} name={recipe.name} category={recipe.category} imageUrl={recipe.imageUrl} eager />
          </div>
          {heading}
        </div>
        {feedbackCard}
      </div>
      <div className="sticky bottom-0 flex flex-col gap-2 bg-bg-default px-5 pt-3 pb-safe-plus">
        <Button size="xl" block onClick={saveAndFinish}>
          {saved ? '끝내기' : '찜하고 끝내기'}
        </Button>
        <Button variant="ghost" size="l" block onClick={home}>
          홈으로
        </Button>
      </div>
    </div>
  )
}
