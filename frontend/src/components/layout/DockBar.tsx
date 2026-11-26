import { Heart, House, User, type Icon } from '@phosphor-icons/react'
import { NavLink } from 'react-router'
import { cx } from '@/lib/cx'
import { useBottomInset } from '@/lib/useBottomInset'

const TABS: Array<{ to: string; label: string; icon: Icon }> = [
  { to: '/', label: '홈', icon: House },
  { to: '/saved', label: '찜', icon: Heart },
  { to: '/my', label: '마이', icon: User },
]

/** 피그마 Dock Bar — MO 하단 탭 3단. 선택 탭은 아이콘 Fill + text/main */
export function DockBar() {
  useBottomInset(56)
  return (
    <>
      <div aria-hidden className="h-[calc(56px+env(safe-area-inset-bottom))]" />
      <nav aria-label="주 메뉴" className="fixed inset-x-0 bottom-0 z-30 border-t border-line-light bg-bg-default pb-safe">
        <ul className="flex h-14">
          {TABS.map(({ to, label, icon: I }) => (
            <li key={to} className="flex-1">
              <NavLink to={to} end={to === '/'} className="flex h-full flex-col items-center justify-center gap-1">
                {({ isActive }) => (
                  <>
                    <I size={24} weight={isActive ? 'fill' : 'regular'} className={isActive ? 'text-icon-main' : 'text-icon-sub'} aria-hidden />
                    <span className={cx(isActive ? 'text-label-11 text-text-main' : 'text-label-m-11 text-text-sub')}>{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
