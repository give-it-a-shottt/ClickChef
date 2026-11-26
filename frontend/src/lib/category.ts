/** 식약처 요리 종류(RCP_PAT2) ↔ 화면에 보이는 묶음 이름 */
export const CATEGORY_GROUPS = [
  { key: 'bowl', label: '한 그릇', values: ['밥', '일품'] },
  { key: 'soup', label: '국·찌개', values: ['국&찌개'] },
  { key: 'side', label: '반찬', values: ['반찬'] },
  { key: 'snack', label: '간식', values: ['후식'] },
] as const

export type CategoryKey = (typeof CATEGORY_GROUPS)[number]['key']

export function categoryLabel(category: string): string {
  return CATEGORY_GROUPS.find((g) => (g.values as readonly string[]).includes(category))?.label ?? category
}
