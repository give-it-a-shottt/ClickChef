import { useEffect, useRef, useState, type RefObject } from 'react'

export type CameraStatus = 'starting' | 'ready' | 'denied' | 'unsupported' | 'error'
export type Facing = 'environment' | 'user'

/**
 * 웹 페이지 안에 카메라 미리보기를 띄워요 (getUserMedia, HTTPS 필수).
 * 카카오톡·인스타 같은 앱 안 브라우저에서는 막히는 경우가 있어서, 실패하면 상태로 알려 주고
 * 화면은 폰 기본 카메라(<input capture>)로 대신해요.
 */
const supported = () => typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)

export function useCamera(videoRef: RefObject<HTMLVideoElement | null>) {
  const [facing, setFacing] = useState<Facing>('environment')
  const [status, setStatus] = useState<CameraStatus>(() => (supported() ? 'starting' : 'unsupported'))
  const [torchSupported, setTorchSupported] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const trackRef = useRef<MediaStreamTrack | null>(null)

  useEffect(() => {
    if (!supported()) return
    let stream: MediaStream | null = null
    let cancelled = false
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      .then(async (s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        stream = s
        const track = s.getVideoTracks()[0]
        trackRef.current = track
        const caps = (track.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { torch?: boolean }
        setTorchSupported(Boolean(caps.torch))
        setTorchOn(false)
        const video = videoRef.current
        if (video) {
          video.srcObject = s
          await video.play().catch(() => undefined)
        }
        setStatus('ready')
      })
      .catch((e: DOMException) => {
        if (cancelled) return
        setStatus(e.name === 'NotAllowedError' || e.name === 'SecurityError' ? 'denied' : e.name === 'NotFoundError' ? 'unsupported' : 'error')
      })
    return () => {
      cancelled = true
      stream?.getTracks().forEach((t) => t.stop())
      trackRef.current = null
    }
  }, [facing, videoRef])

  const toggleTorch = async () => {
    const track = trackRef.current
    if (!track) return
    const next = !torchOn
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] })
      setTorchOn(next)
    } catch {
      setTorchSupported(false)
    }
  }

  const flip = () => {
    setStatus('starting')
    setFacing((f) => (f === 'environment' ? 'user' : 'environment'))
  }

  return { status, torchSupported, torchOn, toggleTorch, flip }
}
