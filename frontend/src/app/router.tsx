import { createBrowserRouter } from 'react-router'
import { AppShell, type RouteHandle } from './AppShell'
import { RouteError } from './RouteError'

/** 화면마다 코드를 나눠서(lazy) 처음 열 때 필요한 JS만 받아요 */
const page = (load: () => Promise<{ default: React.ComponentType }>) => async () => ({ Component: (await load()).default })
const dock: RouteHandle = { dock: true }
const focus: RouteHandle = { focus: true }

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    errorElement: <RouteError />,
    hydrateFallbackElement: <div className="min-h-dvh" />,
    children: [
      { index: true, handle: dock, lazy: page(() => import('@/features/home/HomePage')) },
      { path: 'capture', handle: focus, lazy: page(() => import('@/features/capture/CapturePage')) },
      { path: 'ingredients', lazy: page(() => import('@/features/ingredients/IngredientsPage')) },
      { path: 'ingredients/failed', lazy: page(() => import('@/features/ingredients/FailedPage')) },
      { path: 'recipes', handle: dock, lazy: page(() => import('@/features/recommend/RecommendPage')) },
      { path: 'recipes/:id', lazy: page(() => import('@/features/recipe/RecipeDetailPage')) },
      { path: 'recipes/:id/cook', handle: focus, lazy: page(() => import('@/features/cook/CookPage')) },
      { path: 'recipes/:id/done', handle: focus, lazy: page(() => import('@/features/cook/DonePage')) },
      { path: 'saved', handle: dock, lazy: page(() => import('@/features/saved/SavedPage')) },
      { path: 'my', handle: dock, lazy: page(() => import('@/features/my/MyPage')) },
      { path: 'search', handle: dock, lazy: page(() => import('@/features/search/SearchPage')) },
      { path: 'privacy', lazy: page(() => import('@/features/legal/PrivacyPage')) },
      { path: 'terms', lazy: page(() => import('@/features/legal/TermsPage')) },
      { path: '*', lazy: page(() => import('./NotFoundPage')) },
    ],
  },
])
