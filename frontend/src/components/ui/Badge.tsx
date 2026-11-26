import type { Icon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'

export type BadgeColor = 'brand' | 'yolk' | 'green' | 'black' | 'orange'
type Variant = 'soft' | 'line' | 'solid'

/**
 * 피그마 Badge — 누를 수 없는 짧은 라벨.
 * Brand=재료 일치도·추천, Green=재료 모두 있음, Yolk=NEW, Black=시간·인분, Orange=매운맛.
 * 빨간 배지는 브랜드색과 헷갈려서 만들지 않아요.
 */
const colorClass: Record<BadgeColor, Record<Variant, string>> = {
  brand: {
    soft: 'bg-primary-soft text-primary-text',
    line: 'border border-primary-line bg-bg-default text-primary-text',
    solid: 'bg-primary-default text-text-on-primary',
  },
  yolk: {
    soft: 'bg-sub1-soft text-sub1-text',
    line: 'border border-sub1-base bg-bg-default text-sub1-text',
    solid: 'bg-sub1-base text-text-on-sub1',
  },
  green: {
    soft: 'bg-badge-green-soft text-badge-green-text',
    line: 'border border-badge-green-line bg-bg-default text-badge-green-text',
    solid: 'bg-badge-green-solid text-text-on-primary',
  },
  black: {
    soft: 'bg-badge-black-soft text-badge-black-text',
    line: 'border border-badge-black-line bg-bg-default text-badge-black-text',
    solid: 'bg-badge-black-solid text-text-on-primary',
  },
  orange: {
    soft: 'bg-badge-orange-soft text-badge-orange-text',
    line: 'border border-badge-orange-line bg-bg-default text-badge-orange-text',
    solid: 'bg-badge-orange-solid text-text-on-primary',
  },
}

type Props = {
  color?: BadgeColor
  variant?: Variant
  size?: 's' | 'm'
  icon?: Icon
  className?: string
  children: ReactNode
}

export function Badge({ color = 'brand', variant = 'soft', size = 's', icon: I, className, children }: Props) {
  return (
    <span
      className={cx(
        'inline-flex w-fit shrink-0 items-center whitespace-nowrap rounded-tag',
        size === 's' ? 'h-5 gap-0.5 px-1.5 text-caption-m-12' : 'h-6 gap-1 px-2 text-caption-m-13',
        colorClass[color][variant],
        className,
      )}
    >
      {I && <I size={size === 's' ? 12 : 14} aria-hidden />}
      {children}
    </span>
  )
}
