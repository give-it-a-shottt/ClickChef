import { Outlet, ScrollRestoration, useMatches } from 'react-router'
import { DockBar } from '@/components/layout/DockBar'
import { FooterPc } from '@/components/layout/FooterPc'
import { GnbPc } from '@/components/layout/GnbPc'
import { Toaster } from '@/components/ui/Toaster'
import { useIsDesktop } from '@/lib/useMediaQuery'

export type RouteHandle = {
  /** 모바일 하단 탭을 보여 줄 화면 */
  dock?: boolean
  /** 상단 메뉴·하단 정보 없이 집중하는 화면 (촬영·조리 모드·완료) */
  focus?: boolean
}

/**
 * 모든 화면의 바깥 틀. PC는 GNB + 본문 + Footer, 모바일은 본문 + (탭 화면이면) Dock Bar.
 * 모바일 상단 바는 화면마다 제목·버튼이 달라서 각 화면이 직접 그려요.
 */
export function AppShell() {
  const isDesktop = useIsDesktop()
  const matches = useMatches()
  const handle = (matches[matches.length - 1]?.handle ?? {}) as RouteHandle

  return (
    <>
      {isDesktop && !handle.focus && <GnbPc />}
      <main id="main" className="min-h-dvh">
        <Outlet />
      </main>
      {isDesktop && !handle.focus && <FooterPc />}
      {!isDesktop && handle.dock && <DockBar />}
      <Toaster />
      <ScrollRestoration />
    </>
  )
}
