type Props = { order: number; text: string }

/** 피그마 Step Item — 번호 원(primary/soft) + 본문 15 */
export function StepItem({ order, text }: Props) {
  return (
    <li className="flex gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-label-14 text-primary-text">
        {order}
      </span>
      <p className="pt-1 text-body-15 text-text-main">{text}</p>
    </li>
  )
}
