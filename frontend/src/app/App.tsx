import { Logo } from '@/components/Logo'

export function App() {
  return (
    <main className="mx-auto flex max-w-content flex-col gap-4 p-6">
      <Logo height={40} />
      <p className="text-headline-24">냉장고 재료, 찍기만 하세요</p>
      <button className="h-12 rounded-button bg-primary-default px-5 text-label-16 text-text-on-primary shadow-2">
        재료 촬영하기
      </button>
    </main>
  )
}
