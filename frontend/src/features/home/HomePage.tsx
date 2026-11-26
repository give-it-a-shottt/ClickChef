import { Camera, ChefHat, Image as ImageIcon, Sparkle } from '@phosphor-icons/react'
import { MainHeader } from '@/components/layout/MobileHeader'
import { Badge } from '@/components/ui/Badge'
import { Button, ButtonLink } from '@/components/ui/Button'
import { usePhotoPicker } from '@/features/capture/usePhotoPicker'
import { useStartDetection } from '@/features/capture/useStartDetection'
import { useIsDesktop } from '@/lib/useMediaQuery'
import { Dropzone } from './Dropzone'
import { HomeRecipeSections } from './HomeRecipeSections'

export default function HomePage() {
  return useIsDesktop() ? <DesktopHome /> : <MobileHome />
}

/** 01 홈 (MO 375) */
function MobileHome() {
  const start = useStartDetection()
  const picker = usePhotoPicker((files) => void start(files))
  return (
    <>
      <MainHeader />
      <div className="flex flex-col gap-7 px-5 pt-4 pb-8">
        <section className="flex flex-col gap-2">
          <h1 className="text-display-28 text-text-main">
            냉장고 재료,
            <br />
            찍기만 하세요
          </h1>
          <p className="text-body-15 text-text-sub">사진 한 장이면 지금 만들 수 있는 한식을 찾아 드려요</p>
        </section>

        <section className="flex flex-col gap-4 rounded-card bg-primary-soft p-5" aria-label="재료 촬영">
          <div className="flex items-center gap-3">
            <div className="flex flex-1 flex-col gap-1">
              <h2 className="text-title-18 text-text-main">오늘 냉장고엔 뭐가 있나요?</h2>
              <p className="text-body-13 text-text-sub">재료가 한눈에 보이게 위에서 찍어 주세요</p>
            </div>
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-bg-default text-primary-accent">
              <ChefHat size={26} aria-hidden />
            </span>
          </div>
          <ButtonLink to="/capture" size="xl" leadingIcon={Camera} block>
            재료 촬영하기
          </ButtonLink>
          <Button variant="outline" size="l" leadingIcon={ImageIcon} block onClick={picker.openAlbum}>
            앨범에서 고르기
          </Button>
          {picker.inputs}
        </section>

        <HomeRecipeSections desktop={false} />
      </div>
    </>
  )
}

const STEPS = ['사진 올리기', '재료 확인', '요리 고르기']

/** P01 홈 (PC 1440) */
function DesktopHome() {
  return (
    <>
      <section className="mx-auto flex max-w-content items-center gap-16 pt-18 pb-20">
        <div className="flex flex-1 flex-col gap-6">
          <Badge size="m" icon={Sparkle}>
            AI 재료 인식
          </Badge>
          <h1 className="text-display-56 text-text-main">
            냉장고 재료,
            <br />
            찍기만 하세요
          </h1>
          <p className="text-headline-18 text-text-sub">
            사진 한 장이면 지금 만들 수 있는 한식을 찾아 드려요.
            <br />
            없는 재료는 빼고, 있는 재료로만 골라 드려요.
          </p>
          <ol className="flex gap-8 pt-4">
            {STEPS.map((label, i) => (
              <li key={label} className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-bg-regular text-label-14 text-text-main">
                  {i + 1}
                </span>
                <span className="text-body-m-15 text-text-main">{label}</span>
              </li>
            ))}
          </ol>
        </div>
        <Dropzone />
      </section>
      <div className="mx-auto max-w-content pb-24">
        <HomeRecipeSections desktop />
      </div>
    </>
  )
}
