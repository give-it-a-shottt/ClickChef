import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { buttonClass, iconSize, type StyleProps } from './buttonStyles'

function Content({ size = 'l', leadingIcon: Lead, trailingIcon: Trail, children }: StyleProps & { children: ReactNode }) {
  const s = iconSize[size]
  return (
    <>
      {Lead && <Lead size={s} aria-hidden />}
      {children}
      {Trail && <Trail size={s} aria-hidden />}
    </>
  )
}

type ButtonProps = StyleProps & ButtonHTMLAttributes<HTMLButtonElement>

export function Button({ variant, size, leadingIcon, trailingIcon, block, className, children, type = 'button', ...rest }: ButtonProps) {
  return (
    <button type={type} className={buttonClass({ variant, size, block, className })} {...rest}>
      <Content size={size} leadingIcon={leadingIcon} trailingIcon={trailingIcon}>
        {children}
      </Content>
    </button>
  )
}

/** 화면 이동은 <a>로 — 버튼 모양 링크 */
export function ButtonLink({ variant, size, leadingIcon, trailingIcon, block, className, children, ...rest }: StyleProps & LinkProps) {
  return (
    <Link className={buttonClass({ variant, size, block, className })} {...rest}>
      <Content size={size} leadingIcon={leadingIcon} trailingIcon={trailingIcon}>
        {children}
      </Content>
    </Link>
  )
}
