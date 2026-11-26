import { useRef, type ChangeEvent } from 'react'

/**
 * 숨긴 <input type="file">로 앨범·카메라를 열어요.
 * capture="environment"는 폰 기본 카메라를 바로 열어요 (카메라 API를 못 쓰는 환경의 대체 경로).
 */
export function usePhotoPicker(onFiles: (files: File[]) => void) {
  const albumRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const handle = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = '' // 같은 사진을 다시 골라도 change가 나도록
    if (files.length) onFiles(files)
  }

  const inputs = (
    <>
      <input ref={albumRef} type="file" accept="image/*,.heic,.heif" multiple hidden onChange={handle} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={handle} />
    </>
  )

  return {
    openAlbum: () => albumRef.current?.click(),
    openCamera: () => cameraRef.current?.click(),
    inputs,
  }
}
