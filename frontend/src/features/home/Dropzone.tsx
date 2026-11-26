import { Image as ImageIcon, UploadSimple } from '@phosphor-icons/react'
import { useState, type DragEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { usePhotoPicker } from '@/features/capture/usePhotoPicker'
import { useStartDetection } from '@/features/capture/useStartDetection'
import { cx } from '@/lib/cx'
import { QrCode } from './QrCode'

/** P01 홈 업로드 영역 — PC에는 카메라가 없어서 사진을 끌어다 놓거나 폰으로 QR을 찍어요 */
export function Dropzone() {
  const start = useStartDetection()
  const picker = usePhotoPicker((files) => void start(files))
  const [over, setOver] = useState(false)
  const captureUrl = `${window.location.origin}/capture`

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    void start(Array.from(e.dataTransfer.files))
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false)
      }}
      onDrop={onDrop}
      className={cx(
        'flex w-[560px] shrink-0 flex-col items-center gap-4 rounded-card border-2 border-dashed px-10 pt-12 pb-8 transition-colors',
        over ? 'border-primary-accent bg-primary-soft' : 'border-line-strong bg-bg-regular',
      )}
    >
      <span className="flex size-18 items-center justify-center rounded-full bg-bg-default text-primary-accent">
        <UploadSimple size={32} aria-hidden />
      </span>
      <p className="text-headline-20 text-text-main">재료 사진을 여기에 끌어다 놓으세요</p>
      <p className="text-body-14 text-text-sub">JPG · PNG · HEIC · 최대 3장</p>
      <div className="pt-2">
        <Button size="l" leadingIcon={ImageIcon} onClick={picker.openAlbum}>
          파일 선택
        </Button>
      </div>
      {picker.inputs}
      <div className="flex w-full items-center gap-3 pt-4" aria-hidden>
        <span className="h-px flex-1 bg-primary-line" />
        <span className="text-caption-m-12 text-text-sub-weak">또는 폰으로 찍기</span>
        <span className="h-px flex-1 bg-primary-line" />
      </div>
      <div className="flex w-full items-center gap-4 rounded-button bg-bg-default p-3">
        <QrCode value={captureUrl} />
        <div className="flex flex-col gap-1">
          <p className="text-label-14 text-text-main">폰 카메라로 QR을 비춰 보세요</p>
          <p className="text-body-13 text-text-sub">폰에서 바로 촬영 화면이 열려요. 찍은 사진으로 폰에서 추천을 받아요.</p>
        </div>
      </div>
    </div>
  )
}
