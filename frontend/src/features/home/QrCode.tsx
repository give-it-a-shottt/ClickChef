import { encode } from 'uqr'

/** 실제로 찍히는 QR (SVG). 테마와 상관없이 흰 바탕·검은 칸이어야 카메라가 잘 읽어요. */
export function QrCode({ value, size = 64 }: { value: string; size?: number }) {
  const { data, size: n } = encode(value, { border: 1 })
  let d = ''
  data.forEach((row, y) =>
    row.forEach((on, x) => {
      if (on) d += `M${x} ${y}h1v1h-1z`
    }),
  )
  return (
    <svg width={size} height={size} viewBox={`0 0 ${n} ${n}`} role="img" aria-label="폰으로 촬영 화면 열기 QR 코드" className="shrink-0 rounded-[4px] bg-white">
      <path d={d} fill="#121212" shapeRendering="crispEdges" />
    </svg>
  )
}
