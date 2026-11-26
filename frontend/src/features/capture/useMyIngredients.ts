import { useShallow } from 'zustand/react/shallow'
import { usePrefsStore } from '@/stores/prefsStore'
import { selectSelected, useCaptureStore } from './captureStore'

/**
 * 지금 내 재료(촬영·직접 추가 중 켜 둔 것)와 이번 검색에 쓸 기본 양념.
 * 추천·상세·최근 본 카드가 모두 이 값을 기준으로 일치도를 보여 줘요.
 */
export function useMyIngredients() {
  const have = useCaptureStore(useShallow(selectSelected))
  const seasoningOff = useCaptureStore((s) => s.seasoningOff)
  const seasonings = usePrefsStore((s) => s.seasonings)
  const pantry = seasonings.filter((x) => !seasoningOff.includes(x))
  return { have, pantry }
}
