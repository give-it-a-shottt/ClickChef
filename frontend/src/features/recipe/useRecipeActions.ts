import { useNavigate } from 'react-router'
import { useIsSaved, useLibraryStore } from '@/stores/libraryStore'
import { showToast } from '@/stores/toastStore'

/** 찜·공유 — 상세(MO 하단 바, PC 요약 카드)에서 같이 써요 */
export function useRecipeActions(id: number, name: string) {
  const saved = useIsSaved(id)
  const toggleSaved = useLibraryStore((s) => s.toggleSaved)
  const navigate = useNavigate()

  const toggleSave = () => {
    const now = toggleSaved(id)
    showToast(
      now
        ? { message: '찜 목록에 저장했어요', icon: true, action: { label: '보기', onClick: () => navigate('/saved') } }
        : { message: '찜을 해제했어요' },
    )
  }

  const share = async () => {
    const url = `${window.location.origin}/recipes/${id}`
    if (navigator.share) {
      try {
        await navigator.share({ title: `${name} — 찰칵셰프`, url })
        return
      } catch (e) {
        if ((e as DOMException).name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      showToast({ message: '링크를 복사했어요', icon: true })
    } catch {
      showToast({ message: '링크를 복사하지 못했어요' })
    }
  }

  return { saved, toggleSave, share }
}
