import { Basket, CheckCircle } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/Badge'

type Props = {
  name: string
  amount: string
  /** undefined면 내 재료 정보가 없어서 상태 표시 없이 보여요 */
  have?: boolean
}

/** 피그마 Ingredient Row — 있는 재료(초록 체크) / 부족한 재료(장바구니 + 부족 배지). 색만이 아니라 아이콘·글자로도 구분해요. */
export function IngredientRow({ name, amount, have }: Props) {
  return (
    <li className="flex h-13 items-center gap-3 border-b border-line-light">
      {have === true && <CheckCircle size={20} className="shrink-0 text-status-success-base" aria-label="있음" />}
      {have === false && <Basket size={20} className="shrink-0 text-icon-sub" aria-label="없음" />}
      <span className="flex-1 text-body-15 text-text-main">{name}</span>
      {have === false && <Badge>부족</Badge>}
      <span className="text-body-14 text-text-sub-weak">{amount}</span>
    </li>
  )
}
