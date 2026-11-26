import { Check, X } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'

type Size = 's' | 'm'

/**
 * 피그마 Tag — 재료 칩(Outline). S 32·M 40, 칩 사이 8.
 * - Toggle: 추천에 쓸 재료 켜고 끄기 (선택 = 토마토 테두리 + 연한 배경 + 체크)
 * - Removable: 잘못 인식된 재료 지우기 (× = "<재료> 지우기")
 */
function base(size: Size, selected: boolean, disabled: boolean) {
  return cx(
    'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-tag px-3 transition-colors',
    size === 's' ? 'h-8' : 'h-10',
    disabled
      ? 'bg-bg-regular text-text-disabled'
      : selected
        ? cx('border border-primary-line bg-primary-soft text-primary-text', size === 's' ? 'text-label-13' : 'text-label-14')
        : cx('border border-line-regular bg-bg-default text-text-main', size === 's' ? 'text-body-13' : 'text-body-14'),
  )
}

function Dot({ disabled }: { disabled?: boolean }) {
  return <span aria-hidden className={cx('size-1.5 shrink-0 rounded-full', disabled ? 'bg-icon-disabled' : 'bg-sub2-base')} />
}

type ToggleProps = {
  children: ReactNode
  selected: boolean
  onToggle: () => void
  size?: Size
  disabled?: boolean
  dot?: boolean
  className?: string
}

export function ToggleTag({ children, selected, onToggle, size = 's', disabled = false, dot = true, className }: ToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onToggle}
      className={cx(base(size, selected, disabled), !selected && !disabled && 'hover:bg-bg-light', className)}
    >
      {dot && <Dot disabled={disabled} />}
      {children}
      {selected && <Check size={16} weight="bold" aria-hidden />}
    </button>
  )
}

type RemovableProps = {
  label: string
  onRemove: () => void
  size?: Size
  selected?: boolean
  dot?: boolean
  className?: string
}

export function RemovableTag({ label, onRemove, size = 's', selected = false, dot = true, className }: RemovableProps) {
  return (
    <span className={cx(base(size, selected, false), 'pr-1.5', className)}>
      {dot && <Dot />}
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`${label} 지우기`}
        className="-my-2 -mr-1 flex size-7 items-center justify-center rounded-full text-icon-sub hover:bg-bg-hover"
      >
        <X size={16} aria-hidden />
      </button>
    </span>
  )
}
