import { Camera, CameraRotate, Image as ImageIcon, Info, Lightning, LightningSlash, X } from '@phosphor-icons/react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { IconButton, ShutterButton } from '@/components/ui/IconButton'
import { captureVideoFrame } from '@/lib/imageResize'
import { useBack } from '@/lib/useBack'
import { cx } from '@/lib/cx'
import { useCamera } from './useCamera'
import { usePhotoPicker } from './usePhotoPicker'
import { useStartDetection } from './useStartDetection'

/** 02 촬영 — 뷰파인더·안내 문구·셔터. 카메라를 못 쓰면 폰 기본 카메라로 대신해요. */
export default function CapturePage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [flash, setFlash] = useState(false)
  const camera = useCamera(videoRef)
  const start = useStartDetection()
  const picker = usePhotoPicker((files) => void start(files))
  const back = useBack('/')

  const shoot = async () => {
    const video = videoRef.current
    if (!video || camera.status !== 'ready') return
    setFlash(true)
    setTimeout(() => setFlash(false), 150)
    const blob = await captureVideoFrame(video)
    void start([blob])
  }

  const blocked = camera.status === 'denied' || camera.status === 'unsupported' || camera.status === 'error'

  return (
    <div className="fixed inset-0 flex flex-col bg-black text-white">
      {/* 상단 바 */}
      <div className="relative z-10 flex h-[52px] shrink-0 items-center justify-between px-2 pt-[env(safe-area-inset-top)]">
        <IconButton icon={X} label="닫기" onClick={back} className="text-white hover:bg-white/10" iconClassName="text-white" />
        <h1 className="text-title-16">재료 촬영</h1>
        {camera.torchSupported ? (
          <IconButton
            icon={camera.torchOn ? Lightning : LightningSlash}
            weight={camera.torchOn ? 'fill' : 'regular'}
            label={camera.torchOn ? '플래시 끄기' : '플래시 켜기'}
            onClick={camera.toggleTorch}
            className="hover:bg-white/10"
            iconClassName="text-white"
          />
        ) : (
          <span className="size-12" />
        )}
      </div>

      {/* 미리보기 + 뷰파인더 */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <video ref={videoRef} playsInline muted className="absolute inset-0 size-full object-cover" />
        {camera.status === 'starting' && <p className="absolute inset-0 flex items-center justify-center text-body-14 text-white/70">카메라를 켜는 중…</p>}
        {blocked ? (
          <CameraBlocked status={camera.status} onCamera={picker.openCamera} onAlbum={picker.openAlbum} />
        ) : (
          <>
            <Viewfinder />
            <p className="absolute inset-x-0 bottom-6 mx-auto flex w-fit items-center gap-1.5 rounded-full bg-black/60 py-2.5 pr-4 pl-3.5 text-body-m-13">
              <Info size={18} aria-hidden />
              재료가 모두 보이게 위에서 찍어 주세요
            </p>
          </>
        )}
        <div className={cx('pointer-events-none absolute inset-0 bg-white transition-opacity duration-150', flash ? 'opacity-70' : 'opacity-0')} />
      </div>

      {/* 하단 조작 */}
      <div className="flex shrink-0 items-center justify-between px-10 pt-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <ControlLabel label="앨범">
          <button
            type="button"
            onClick={picker.openAlbum}
            aria-label="앨범에서 고르기"
            className="flex size-13 items-center justify-center rounded-thumbnail border border-white"
          >
            <ImageIcon size={26} aria-hidden />
          </button>
        </ControlLabel>
        <ShutterButton icon={Camera} label="사진 찍기" onClick={shoot} disabled={camera.status !== 'ready'} className="disabled:opacity-50" />
        <ControlLabel label="전환">
          <button
            type="button"
            onClick={camera.flip}
            aria-label="카메라 전환"
            disabled={blocked}
            className="flex size-13 items-center justify-center rounded-full bg-white/16 disabled:opacity-40"
          >
            <CameraRotate size={26} aria-hidden />
          </button>
        </ControlLabel>
      </div>
      {picker.inputs}
    </div>
  )
}

function ControlLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      {children}
      <span className="text-caption-m-11" aria-hidden>
        {label}
      </span>
    </div>
  )
}

function Viewfinder() {
  const corner = 'absolute size-7 border-white'
  return (
    <div aria-hidden className="absolute top-1/2 left-1/2 size-[min(295px,78vw)] -translate-x-1/2 -translate-y-1/2">
      <span className={`${corner} top-0 left-0 rounded-tl-lg border-t-[3px] border-l-[3px]`} />
      <span className={`${corner} top-0 right-0 rounded-tr-lg border-t-[3px] border-r-[3px]`} />
      <span className={`${corner} right-0 bottom-0 rounded-br-lg border-r-[3px] border-b-[3px]`} />
      <span className={`${corner} bottom-0 left-0 rounded-bl-lg border-b-[3px] border-l-[3px]`} />
    </div>
  )
}

function CameraBlocked({ status, onCamera, onAlbum }: { status: string; onCamera: () => void; onAlbum: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-white/10">
        <Camera size={32} aria-hidden />
      </span>
      <p className="text-title-18">{status === 'denied' ? '카메라 권한이 꺼져 있어요' : '이 브라우저에서는 카메라를 열 수 없어요'}</p>
      <p className="text-body-14 text-white/70">
        {status === 'denied'
          ? '브라우저 설정에서 카메라를 허용하거나, 폰 카메라로 찍어 올려 주세요.'
          : '폰 기본 카메라로 찍거나 앨범에서 사진을 골라 주세요.'}
      </p>
      <div className="mt-3 flex w-full max-w-[280px] flex-col gap-2">
        <Button size="l" leadingIcon={Camera} onClick={onCamera} block>
          폰 카메라로 찍기
        </Button>
        <Button size="l" variant="secondary" leadingIcon={ImageIcon} onClick={onAlbum} block>
          앨범에서 고르기
        </Button>
      </div>
    </div>
  )
}
