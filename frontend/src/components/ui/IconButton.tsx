import type { Icon, IconWeight } from '@phosphor-icons/react'
import type { ButtonHTMLAttributes } from 'react'
import { cx } from '@/lib/cx'

type Variant = 'primary' | 'secondary' | 'outline-strong' | 'ghost'
type Size = 'l' | 'm' | 's'

const sizeClass: Record<Size, string> = { l: 'size-12', m: 'size-10', s: 'size-8' }
const iconSize: Record<Size, number> = { l: 24, m: 20, s: 20 }
const variantClass: Record<Variant, string> = {
  primary: 'bg-primary-default text-icon-on-primary hover:bg-primary-hover active:bg-primary-pressed',
  secondary: 'bg-bg-regular text-icon-main hover:bg-bg-hover active:bg-bg-pressed',
  'outline-strong': 'border border-line-black bg-bg-default text-icon-main hover:bg-bg-light',
  ghost: 'text-icon-main hover:bg-bg-hover active:bg-bg-pressed',
}

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icon: Icon
  /** 아이콘만 있는 버튼이라 스크린리더용 이름이 꼭 필요해요 */
  label: string
  variant?: Variant
  shape?: 'square' | 'circle'
  size?: Size
  weight?: IconWeight
  iconClassName?: string
}

/** 피그마 Icon Button: L 48(아이콘 24)·M 40·S 32(20). 터치 영역 44 이상 */
export function IconButton({ icon: I, label, variant = 'ghost', shape = 'square', size = 'l', weight, iconClassName, className, type = 'button', ...rest }: Props) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex shrink-0 items-center justify-center transition-colors disabled:opacity-40',
        shape === 'circle' ? 'rounded-full' : 'rounded-button',
        sizeClass[size],
        variantClass[variant],
        className,
      )}
      {...rest}
    >
      <I size={iconSize[size]} weight={weight} className={iconClassName} aria-hidden />
    </button>
  )
}

/** 촬영 화면 셔터 (72, 화면에서 가장 강한 요소) */
export function ShutterButton({ icon: I, label, className, ...rest }: Omit<Props, 'variant' | 'shape' | 'size'>) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cx('flex size-18 items-center justify-center rounded-full bg-white transition-transform active:scale-95', className)}
      {...rest}
    >
      <span className="flex size-[58px] items-center justify-center rounded-full bg-primary-default text-icon-on-primary">
        <I size={24} aria-hidden />
      </span>
    </button>
  )
}
