import { WarningCircle } from '@phosphor-icons/react'
import { isRouteErrorResponse, useRouteError } from 'react-router'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'

/** 화면을 그리다 오류가 나면 앱 전체가 하얗게 멈추지 않고 이 화면을 보여 줘요 */
export function RouteError() {
  const error = useRouteError()
  // 새 버전을 배포한 뒤 예전 화면 코드(청크)를 못 찾으면 새로고침으로 해결돼요
  const chunkFailed = error instanceof Error && /dynamically imported module|Importing a module script failed/i.test(error.message)
  return (
    <div className="mx-auto max-w-content px-5 py-20">
      <EmptyState
        icon={WarningCircle}
        title={chunkFailed ? '새 버전이 나왔어요' : '화면을 불러오지 못했어요'}
        description={
          chunkFailed
            ? '새로고침하면 최신 화면으로 열려요.'
            : isRouteErrorResponse(error)
              ? `${error.status} ${error.statusText}`
              : '잠시 후 다시 시도해 주세요.'
        }
        action={
          <Button size="m" onClick={() => window.location.reload()}>
            새로고침
          </Button>
        }
      />
    </div>
  )
}
