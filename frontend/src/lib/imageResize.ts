/**
 * 업로드 전에 사진을 긴 변 1280px JPEG로 줄여요.
 * - Vercel 함수 요청 본문 한도(4.5MB) 안에 3장이 들어가요
 * - Gemini가 받는 이미지 토큰도 줄어요
 * 브라우저가 못 읽는 HEIC(아이폰 사진, 크롬)는 그때만 변환 라이브러리를 불러와요.
 */
const MAX_SIDE = 1280
const QUALITY = 0.82
const MAX_BYTES = 1.4 * 1024 * 1024

function isHeic(file: Blob & { name?: string }) {
  return /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name ?? '')
}

async function decode(file: Blob): Promise<ImageBitmap> {
  return createImageBitmap(file, { imageOrientation: 'from-image' })
}

async function toJpeg(bitmap: ImageBitmap, quality: number): Promise<Blob> {
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h)
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('이미지 변환 실패'))), 'image/jpeg', quality),
  )
}

export async function resizeImage(file: File | Blob): Promise<Blob> {
  let bitmap: ImageBitmap
  try {
    bitmap = await decode(file)
  } catch {
    if (!isHeic(file)) throw new Error('사진을 읽지 못했어요. JPG나 PNG로 올려 주세요')
    const { default: heic2any } = await import('heic2any')
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: QUALITY })
    bitmap = await decode(Array.isArray(converted) ? converted[0] : converted)
  }
  let blob = await toJpeg(bitmap, QUALITY)
  if (blob.size > MAX_BYTES) blob = await toJpeg(bitmap, 0.6)
  bitmap.close()
  return blob
}

/** 동영상 화면(카메라 미리보기)에서 지금 장면을 JPEG로 찍어요 */
export async function captureVideoFrame(video: HTMLVideoElement): Promise<Blob> {
  const bitmap = await createImageBitmap(video)
  const blob = await toJpeg(bitmap, QUALITY)
  bitmap.close()
  return blob
}
