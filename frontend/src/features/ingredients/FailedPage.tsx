import { Basket, Camera, CheckCircle, Images, Lightbulb, type Icon } from '@phosphor-icons/react'
import { useNavigate } from 'react-router'
import { SubHeader } from '@/components/layout/MobileHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useCaptureStore } from '@/features/capture/captureStore'
import { usePhotoPicker } from '@/features/capture/usePhotoPicker'
import { useStartDetection } from '@/features/capture/useStartDetection'
import { ILLUST } from '@/lib/illust'
import { useIsDesktop } from '@/lib/useMediaQuery'

const TIPS: Array<{ icon: Icon; title: string; short: string; long: string }> = [
  { icon: Lightbulb, title: '밝은 곳에서', short: '밝은 곳에서 위에서 내려다보며 찍기', long: '형광등 아래나 창가처럼 밝은 곳에서\n위에서 내려다보며 찍어 주세요.' },
  { icon: Images, title: '겹치지 않게', short: '재료끼리 겹치지 않게 펼쳐 놓기', long: '재료끼리 겹치면 하나로 보일 수 있어요.\n조금씩 떨어뜨려 펼쳐 주세요.' },
  { icon: Basket, title: '재료가 보이게', short: '포장지보다 재료 자체가 보이게 찍기', long: '포장지 글자보다 재료 자체가\n보이는 게 더 정확해요.' },
]

/** 06 인식 실패 / P06 */
export default function FailedPage() {
  return useIsDesktop() ? <DesktopFailed /> : <MobileFailed />
}

/** "재료 직접 입력하기" — 실패 상태를 지우고 입력창에 바로 포커스 */
function useManualInput() {
  const navigate = useNavigate()
  return () => {
    useCaptureStore.setState({ status: 'idle', error: null })
    navigate('/ingredients?manual=1', { replace: true })
  }
}

function MobileFailed() {
  const navigate = useNavigate()
  const reset = useCaptureStore((s) => s.reset)
  const manual = useManualInput()
  return (
    <>
      <SubHeader title="재료 확인" />
      <div className="flex flex-col items-center gap-6 px-5 pt-6 pb-8">
        <EmptyState
          icon={Camera}
          title="재료를 찾지 못했어요"
          description={'사진이 어둡거나 재료가 겹쳐 있으면\n찾기 어려워요. 한 번만 더 찍어 볼까요?'}
          className="w-full whitespace-pre-line"
          action={
            <Button
              size="m"
              onClick={() => {
                reset()
                navigate('/capture', { replace: true })
              }}
            >
              다시 찍기
            </Button>
          }
        />
        <Button variant="outline-strong" size="l" onClick={manual}>
          재료 직접 입력하기
        </Button>
        <section className="flex w-full flex-col gap-3 rounded-card bg-bg-light p-5">
          <h2 className="text-title-16 text-text-main">이렇게 찍으면 잘 찾아요</h2>
          <ul className="flex flex-col gap-3">
            {TIPS.map((t) => (
              <li key={t.title} className="flex items-center gap-2 text-body-14 text-text-sub">
                <CheckCircle size={18} className="shrink-0 text-status-success-base" aria-hidden />
                {t.short}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}

function DesktopFailed() {
  const photo = useCaptureStore((s) => s.photos[0])
  const start = useStartDetection()
  const picker = usePhotoPicker((files) => void start(files))
  const manual = useManualInput()
  return (
    <div className="mx-auto flex max-w-content flex-col items-center gap-12 pt-18 pb-24">
      <div className="flex items-center gap-16">
        <div className="relative h-[300px] w-[400px] overflow-hidden rounded-card bg-bg-image">
          <img src={photo?.url ?? ILLUST.cameraPreview} alt="" className="size-full scale-110 object-cover blur-[2px]" />
          <Badge color="yolk" variant="solid" size="m" className="absolute top-4 left-4">
            재료가 잘 안 보여요
          </Badge>
        </div>
        <div className="flex w-[420px] flex-col items-center gap-2">
          <EmptyState
            icon={Camera}
            title="재료를 찾지 못했어요"
            description={'사진이 어둡거나 재료가 겹쳐 있으면 찾기 어려워요.\n다른 사진을 올리거나 재료를 직접 입력해 주세요.'}
            className="w-full whitespace-pre-line"
            action={
              <Button size="m" onClick={picker.openAlbum}>
                다른 사진 올리기
              </Button>
            }
          />
          <Button variant="ghost" size="m" onClick={manual}>
            재료 직접 입력하기
          </Button>
          {picker.inputs}
        </div>
      </div>
      <section className="flex w-full flex-col gap-5">
        <h2 className="text-headline-20 text-text-main">이렇게 찍으면 잘 찾아요</h2>
        <ul className="grid grid-cols-3 gap-6">
          {TIPS.map(({ icon: I, title, long }) => (
            <li key={title} className="flex flex-col gap-3 rounded-card bg-bg-light p-6">
              <span className="flex size-11 items-center justify-center rounded-full bg-bg-default text-primary-accent">
                <I size={22} aria-hidden />
              </span>
              <h3 className="text-title-16 text-text-main">{title}</h3>
              <p className="text-body-14 whitespace-pre-line text-text-sub">{long}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
