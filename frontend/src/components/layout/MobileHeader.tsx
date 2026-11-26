import { CaretLeft, MagnifyingGlass } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { Logo } from '@/components/Logo'
import { IconButton } from '@/components/ui/IconButton'
import { useBack } from '@/lib/useBack'

const bar = 'sticky top-0 z-30 flex h-14 items-center border-b border-line-light bg-bg-default'

/** 피그마 Header(Main) — 로고 + 검색 */
export function MainHeader() {
  const navigate = useNavigate()
  return (
    <header className={`${bar} pr-1.5 pl-5`}>
      <Link to="/" aria-label="찰칵셰프 홈">
        <Logo height={30} />
      </Link>
      <span className="flex-1" />
      <IconButton icon={MagnifyingGlass} label="레시피 검색" onClick={() => navigate('/search')} className="size-11" />
    </header>
  )
}

type SubProps = { title: string; actions?: ReactNode; fallback?: string }

/** 피그마 Header(Sub) — 뒤로 + 제목 18 + 아이콘 */
export function SubHeader({ title, actions, fallback = '/' }: SubProps) {
  const back = useBack(fallback)
  return (
    <header className={`${bar} px-1.5`}>
      <IconButton icon={CaretLeft} label="뒤로" onClick={back} className="size-11" />
      <h1 className="flex-1 truncate text-headline-18 text-text-main">{title}</h1>
      <div className="flex min-w-11 justify-end">{actions}</div>
    </header>
  )
}
