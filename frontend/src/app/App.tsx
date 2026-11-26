import { RouterProvider } from 'react-router'
import { Providers } from './providers'
import { router } from './router'
import '@/stores/prefsStore' // 저장된 테마를 바로 적용해요

export function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  )
}
