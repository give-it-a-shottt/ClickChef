import { useNavigate } from 'react-router'
import { resizeImage } from '@/lib/imageResize'
import { showToast } from '@/stores/toastStore'
import { detectPhotos, MAX_PHOTOS, useCaptureStore } from './captureStore'

/**
 * 사진 파일 → (브라우저에서 줄이기) → 재료 확인 화면으로 이동 → 서버 인식.
 * 홈·PC 상단 메뉴·촬영 화면·재료 확인 화면(사진 추가)이 같은 흐름을 써요.
 */
export function useStartDetection() {
  const navigate = useNavigate()
  return async (files: Array<File | Blob>, { append = false } = {}) => {
    const images = files.filter((f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test((f as File).name ?? ''))
    if (!images.length) {
      showToast({ message: '사진 파일만 올릴 수 있어요' })
      return
    }
    const room = MAX_PHOTOS - (append ? useCaptureStore.getState().photos.length : 0)
    if (room <= 0) {
      showToast({ message: `사진은 ${MAX_PHOTOS}장까지 올릴 수 있어요` })
      return
    }
    if (images.length > room) showToast({ message: `사진은 ${MAX_PHOTOS}장까지만 쓸게요` })
    let blobs: Blob[]
    try {
      blobs = await Promise.all(images.slice(0, room).map(resizeImage))
    } catch (e) {
      showToast({ message: e instanceof Error ? e.message : '사진을 읽지 못했어요' })
      return
    }
    if (!append) navigate('/ingredients')
    void detectPhotos(blobs, append)
  }
}
