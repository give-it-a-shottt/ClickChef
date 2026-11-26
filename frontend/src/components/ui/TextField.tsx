import { WarningCircle, type Icon } from '@phosphor-icons/react'
import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cx } from '@/lib/cx'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label?: string
  /** 보조 문구. error가 있으면 error가 대신 보여요 */
  message?: ReactNode
  error?: string
  size?: 'l' | 'm'
  leadingIcon?: Icon
  trailing?: ReactNode
  /** 라벨을 화면에서는 숨기고 스크린리더에만 읽혀요 */
  hideLabel?: boolean
  className?: string
}

/**
 * 피그마 Text Field — 라벨 + Line 입력창 + 메시지.
 * MO는 L(48). iOS가 16px 미만 입력창을 확대하지 않도록 L의 실제 글자는 16px로 둬요.
 */
export function TextField({ label, message, error, size = 'l', leadingIcon: Lead, trailing, hideLabel, className, disabled, id, ...rest }: Props) {
  const autoId = useId()
  const inputId = id ?? autoId
  const msgId = `${inputId}-msg`
  const hasMsg = Boolean(error || message)
  return (
    <div className={cx('flex flex-col gap-2', className)}>
      {label && (
        <label htmlFor={inputId} className={cx('text-label-14 text-text-main', hideLabel && 'sr-only')}>
          {label}
        </label>
      )}
      <div
        className={cx(
          'flex items-center gap-2 rounded-input border transition-colors',
          size === 'l' ? 'h-12 px-4' : 'h-10 px-3',
          disabled
            ? 'border-line-light bg-bg-regular'
            : error
              ? 'border-status-error-base bg-bg-default'
              : 'border-line-strong bg-bg-default focus-within:border-primary-default',
        )}
      >
        {Lead && <Lead size={20} className="shrink-0 text-icon-sub-weak" aria-hidden />}
        <input
          id={inputId}
          disabled={disabled}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={hasMsg ? msgId : undefined}
          className={cx(
            'min-w-0 flex-1 bg-transparent text-text-main outline-none placeholder:text-text-sub-weak disabled:text-text-disabled',
            size === 'l' ? 'text-[16px]/[22px] tracking-[-0.025em]' : 'text-body-14',
          )}
          {...rest}
        />
        {trailing}
      </div>
      {hasMsg && (
        <p id={msgId} className={cx('flex items-center gap-1 text-body-13', error ? 'text-status-error-text' : 'text-text-sub')}>
          {error && <WarningCircle size={16} className="shrink-0" aria-hidden />}
          {error ?? message}
        </p>
      )}
    </div>
  )
}
