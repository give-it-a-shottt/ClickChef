import { ArrowClockwise, Plus, WarningCircle } from '@phosphor-icons/react'
import { useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { useShallow } from 'zustand/react/shallow'
import { BottomBar } from '@/components/layout/BottomBar'
import { SubHeader } from '@/components/layout/MobileHeader'
import { Button } from '@/components/ui/Button'
import { ILLUST } from '@/lib/illust'
import { cx } from '@/lib/cx'
import { useIsDesktop } from '@/lib/useMediaQuery'
import { detectPhotos, MAX_PHOTOS, selectSelected, useCaptureStore } from '@/features/capture/captureStore'
import { useMyIngredients } from '@/features/capture/useMyIngredients'
import { usePhotoPicker } from '@/features/capture/usePhotoPicker'
import { useStartDetection } from '@/features/capture/useStartDetection'
import { AddIngredientField, ChipSkeleton, FoundChips, SeasoningChips, UncertainChips } from './IngredientChips'

/** 03 재료 확인 / P03 */
export default function IngredientsPage() {
  const status = useCaptureStore((s) => s.status)
  const isDesktop = useIsDesktop()
  if (status === 'failed') return <Navigate to="/ingredients/failed" replace />
  return isDesktop ? <DesktopIngredients /> : <MobileIngredients />
}

function useHeading() {
  const status = useCaptureStore((s) => s.status)
  const found = useCaptureStore((s) => s.items.filter((i) => i.source === 'found').length)
  const hasPhotos = useCaptureStore((s) => s.photos.length > 0)
  if (status === 'detecting' && !found) return { title: '재료를 찾고 있어요', loading: true }
  if (found) return { title: `재료 ${found}개를 찾았어요`, loading: status === 'detecting' }
  if (hasPhotos) return { title: '재료를 확인해 주세요', loading: false }
  return { title: '어떤 재료가 있나요?', loading: false }
}

function useRecommendCta() {
  const navigate = useNavigate()
  const selected = useCaptureStore(useShallow(selectSelected))
  const { pantry } = useMyIngredients()
  return {
    disabled: selected.length === 0,
    caption: `재료 ${selected.length}개 + 기본 양념 ${pantry.length}개로 찾아요`,
    go: () => navigate('/recipes'),
  }
}

/** 인식 요청이 실패했을 때 (네트워크·하루 제한 등) */
function DetectError() {
  const error = useCaptureStore((s) => s.error)
  const photos = useCaptureStore((s) => s.photos)
  if (!error) return null
  return (
    <div role="alert" className="flex items-start gap-2 rounded-card bg-status-error-bg p-4 text-body-14 text-status-error-text">
      <WarningCircle size={20} className="mt-0.5 shrink-0" aria-hidden />
      <p className="flex-1">{error}</p>
      {photos.length > 0 && (
        <button
          type="button"
          onClick={() => void detectPhotos(photos.map((p) => p.blob), false)}
          className="flex shrink-0 items-center gap-1 text-label-13"
        >
          <ArrowClockwise size={16} aria-hidden />
          다시 시도
        </button>
      )}
    </div>
  )
}

function MobileIngredients() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const photos = useCaptureStore((s) => s.photos)
  const reset = useCaptureStore((s) => s.reset)
  const start = useStartDetection()
  const picker = usePhotoPicker((files) => void start(files, { append: true }))
  const { title, loading } = useHeading()
  const cta = useRecommendCta()

  return (
    <>
      <SubHeader title="재료 확인" />
      <div className="flex flex-col gap-6 px-5 pt-4 pb-8">
        {photos.length > 0 && (
          <div className="flex items-center gap-3 rounded-card bg-bg-light py-3 pr-2 pl-3">
            <button
              type="button"
              onClick={picker.openAlbum}
              disabled={photos.length >= MAX_PHOTOS}
              className="flex flex-1 items-center gap-3 text-left"
              aria-label="사진 추가"
            >
              <img src={photos[0].url} alt="올린 냉장고 사진" className="size-14 shrink-0 rounded-thumbnail bg-bg-image object-cover" />
              <span className="flex flex-col gap-0.5">
                <span className="text-label-14 text-text-main">냉장고 사진 {photos.length}장</span>
                <span className="text-caption-12 text-text-sub">
                  {photos.length >= MAX_PHOTOS ? `최대 ${MAX_PHOTOS}장까지 올렸어요` : '사진을 더하면 더 많이 찾아요'}
                </span>
              </span>
            </button>
            <Button
              variant="ghost"
              size="s"
              onClick={() => {
                reset()
                navigate('/capture', { replace: true })
              }}
            >
              다시 찍기
            </Button>
            {picker.inputs}
          </div>
        )}

        <section className="flex flex-col gap-2" aria-live="polite">
          <h1 className="text-headline-24 text-text-main">{title}</h1>
          <p className="text-body-14 text-text-sub">
            {loading ? '사진 속 재료를 살펴보는 중이에요. 몇 초면 돼요.' : '틀리거나 빠진 재료는 눌러서 고쳐 주세요'}
          </p>
        </section>

        <DetectError />
        {loading ? <ChipSkeleton /> : <FoundChips />}
        <UncertainChips desktop={false} />
        <AddIngredientField desktop={false} autoFocus={params.has('manual')} />
        <SeasoningChips desktop={false} />
      </div>
      <BottomBar>
        <Button size="xl" block disabled={cta.disabled} onClick={cta.go}>
          이 재료로 추천받기
        </Button>
      </BottomBar>
    </>
  )
}

function DesktopIngredients() {
  const [params] = useSearchParams()
  const photos = useCaptureStore((s) => s.photos)
  const [active, setActive] = useState(0)
  const start = useStartDetection()
  const addPicker = usePhotoPicker((files) => void start(files, { append: true }))
  const replacePicker = usePhotoPicker((files) => void start(files))
  const { title, loading } = useHeading()
  const cta = useRecommendCta()
  const current = photos[Math.min(active, photos.length - 1)]

  return (
    <>
      <section className="mx-auto flex max-w-content flex-col gap-2 pt-12 pb-8">
        <h1 className="text-headline-32 text-text-main" aria-live="polite">
          {title}
        </h1>
        <p className="text-body-15 text-text-sub">
          {loading
            ? '사진 속 재료를 살펴보는 중이에요. 몇 초면 돼요.'
            : '틀리거나 빠진 재료는 눌러서 고쳐 주세요. 확인이 끝나면 지금 만들 수 있는 요리를 찾아 드려요.'}
        </p>
      </section>

      <div className="mx-auto flex max-w-content gap-12 pb-24">
        {/* 사진 */}
        <div className="flex w-[480px] shrink-0 flex-col gap-3">
          <div className="h-[400px] overflow-hidden rounded-card bg-bg-image">
            <img src={current?.url ?? ILLUST.cameraPreview} alt={current ? '올린 냉장고 사진' : ''} className="size-full object-cover" />
          </div>
          <div className="flex items-center gap-2">
            {photos.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`사진 ${i + 1} 보기`}
                aria-pressed={p === current}
                className={cx('size-16 overflow-hidden rounded-thumbnail bg-bg-image', p === current && 'ring-2 ring-primary-accent')}
              >
                <img src={p.url} alt="" className="size-full object-cover" />
              </button>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={addPicker.openAlbum}
                className="flex size-16 flex-col items-center justify-center gap-0.5 rounded-thumbnail border border-dashed border-line-regular bg-bg-light text-icon-sub hover:bg-bg-hover"
              >
                <Plus size={20} aria-hidden />
                <span className="text-caption-m-11 text-text-sub">사진 추가</span>
              </button>
            )}
            <span className="flex-1" />
            <Button variant="ghost" size="s" onClick={replacePicker.openAlbum}>
              다시 올리기
            </Button>
          </div>
          {addPicker.inputs}
          {replacePicker.inputs}
        </div>

        {/* 재료 */}
        <div className="flex min-w-0 flex-1 flex-col gap-8">
          <DetectError />
          <section className="flex flex-col gap-3">
            <h2 className="text-title-18 text-text-main">찾은 재료</h2>
            {loading ? <ChipSkeleton /> : <FoundChips />}
          </section>
          <UncertainChips desktop />
          <AddIngredientField desktop autoFocus={params.has('manual')} />
          <SeasoningChips desktop />
          <div className="flex items-center gap-4 pt-2">
            <Button size="xl" className="w-80" disabled={cta.disabled} onClick={cta.go}>
              이 재료로 추천받기
            </Button>
            <p className="text-body-14 text-text-sub">{cta.caption}</p>
          </div>
        </div>
      </div>
    </>
  )
}
