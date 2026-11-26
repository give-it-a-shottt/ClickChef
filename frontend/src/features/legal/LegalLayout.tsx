import type { ReactNode } from 'react'
import { SubHeader } from '@/components/layout/MobileHeader'
import { useIsDesktop } from '@/lib/useMediaQuery'

export function LegalLayout({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  const isDesktop = useIsDesktop()
  return (
    <>
      {!isDesktop && <SubHeader title={title} />}
      <article className="mx-auto flex max-w-[760px] flex-col gap-6 px-5 pt-8 pb-20 text-body-15 text-text-sub lg:pt-12 [&_h2]:pt-2 [&_h2]:text-title-18 [&_h2]:text-text-main [&_li]:ml-5 [&_li]:list-disc">
        {isDesktop && <h1 className="text-headline-32 text-text-main">{title}</h1>}
        <p className="text-body-13 text-text-sub-weak">시행일: {updated}</p>
        {children}
      </article>
    </>
  )
}
