import { MagnifyingGlass, UploadSimple } from '@phosphor-icons/react'
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/Button'
import { usePhotoPicker } from '@/features/capture/usePhotoPicker'
import { useStartDetection } from '@/features/capture/useStartDetection'
import { cx } from '@/lib/cx'

const NAV = [
  { to: '/', label: '홈' },
  { to: '/saved', label: '찜' },
  { to: '/my', label: '마이' },
]

/** 피그마 GNB PC — 로고 + 메뉴(선택 = 굵게 + 아래 2px) + 검색 300 + 재료 사진 올리기 */
export function GnbPc() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const start = useStartDetection()
  const picker = usePhotoPicker((files) => void start(files))

  return (
    <header className="sticky top-0 z-30 border-b border-line-light bg-bg-default">
      <div className="mx-auto flex h-[71px] max-w-content items-center gap-10 px-0">
        <Link to="/" aria-label="찰칵셰프 홈" className="shrink-0">
          <Logo height={34} />
        </Link>
        <nav aria-label="주 메뉴" className="flex h-full gap-2">
          {NAV.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cx(
                  'flex h-full items-center border-b-2 px-3 transition-colors',
                  isActive ? 'border-primary-accent text-label-15 text-text-main' : 'border-transparent text-body-m-15 text-text-sub hover:text-text-main',
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <span className="flex-1" />
        <div className="flex items-center gap-3">
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault()
              const q = String(new FormData(e.currentTarget).get('q') ?? '').trim()
              if (q) navigate(`/search?q=${encodeURIComponent(q)}`)
            }}
            className="flex h-10 w-[300px] items-center gap-2 rounded-input border border-line-strong bg-bg-default px-3 focus-within:border-primary-default"
          >
            <MagnifyingGlass size={20} className="shrink-0 text-icon-sub-weak" aria-hidden />
            <input
              name="q"
              type="search"
              defaultValue={params.get('q') ?? ''}
              placeholder="재료나 요리 이름으로 검색"
              aria-label="재료나 요리 이름으로 검색"
              className="min-w-0 flex-1 bg-transparent text-body-14 text-text-main outline-none placeholder:text-text-sub-weak"
            />
          </form>
          <Button size="m" leadingIcon={UploadSimple} onClick={picker.openAlbum}>
            재료 사진 올리기
          </Button>
          {picker.inputs}
        </div>
      </div>
    </header>
  )
}
