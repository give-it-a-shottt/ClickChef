import type { Icon } from '@phosphor-icons/react'
import { cx } from '@/lib/cx'

export type ButtonVariant = 'primary' | 'strong' | 'secondary' | 'outline' | 'outline-strong' | 'ghost'
export type ButtonSize = 'xl' | 'l' | 'm' | 's'

/** 피그마 Button: XL 56(MO 하단 고정)·L 48(MO 기본)·M 40(PC·팝업)·S 32 */
const sizeClass: Record<ButtonSize, string> = {
  xl: 'h-14 min-w-24 gap-2 px-6 text-label-16',
  l: 'h-12 min-w-20 gap-1.5 px-5 text-label-16',
  m: 'h-10 min-w-18 gap-1.5 px-4 text-label-15',
  s: 'h-8 min-w-15 gap-1 px-3 text-label-m-14',
}
export const iconSize: Record<ButtonSize, number> = { xl: 24, l: 20, m: 20, s: 16 }

const variantClass: Record<ButtonVariant, string> = {
  primary: 'bg-primary-default text-text-on-primary hover:bg-primary-hover active:bg-primary-pressed',
  strong: 'bg-bg-inverse text-text-inverse hover:bg-bg-inverse-hover active:bg-bg-inverse-pressed',
  secondary: 'bg-bg-regular text-text-main hover:bg-bg-hover active:bg-bg-pressed',
  outline: 'border border-primary-line bg-bg-default text-primary-text hover:bg-primary-soft active:bg-primary-soft-pressed',
  'outline-strong': 'border border-line-black bg-bg-default text-text-main hover:bg-bg-light active:bg-bg-hover',
  ghost: 'text-text-main hover:bg-bg-hover active:bg-bg-pressed',
}

export type StyleProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  leadingIcon?: Icon
  trailingIcon?: Icon
  block?: boolean
  className?: string
}

export function buttonClass({ variant = 'primary', size = 'l', block, className }: StyleProps) {
  return cx(
    'inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-button transition-colors',
    'disabled:pointer-events-none disabled:border-transparent disabled:bg-bg-regular disabled:text-text-disabled',
    sizeClass[size],
    variantClass[variant],
    block && 'w-full',
    className,
  )
}
