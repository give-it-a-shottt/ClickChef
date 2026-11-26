import { CookingPot } from '@phosphor-icons/react'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SubHeader } from '@/components/layout/MobileHeader'
import { useIsDesktop } from '@/lib/useMediaQuery'

export default function NotFoundPage() {
  const isDesktop = useIsDesktop()
  return (
    <>
      {!isDesktop && <SubHeader title="" />}
      <div className="mx-auto max-w-content px-5 py-16">
        <EmptyState
          icon={CookingPot}
          title="페이지를 찾을 수 없어요"
          description="주소가 바뀌었거나 없어진 페이지예요."
          action={
            <ButtonLink to="/" size="m">
              홈으로
            </ButtonLink>
          }
        />
      </div>
    </>
  )
}
