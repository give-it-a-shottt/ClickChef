/**
 * 레시피 사진이 없을 때 쓰는 일러스트(피그마 Illust/*).
 * 일러스트마다 배경색이 들어 있어서 카드 썸네일을 꽉 채워요.
 */
export const ILLUST = {
  friedRice: '/illust/kimchi-fried-rice.svg',
  omelette: '/illust/rolled-omelette.svg',
  kimchiStew: '/illust/kimchi-stew.svg',
  doenjangStew: '/illust/doenjang-stew.svg',
  cameraPreview: '/illust/camera-preview.svg',
} as const

export function illustFor(name: string, category: string, id = 0): string {
  if (/된장|청국장/.test(name)) return ILLUST.doenjangStew
  if (/찌개|탕|전골|국/.test(name)) return ILLUST.kimchiStew
  if (/말이|전|부침|계란|달걀/.test(name)) return ILLUST.omelette
  if (/밥|덮밥|볶음/.test(name)) return ILLUST.friedRice
  if (/국|찌개/.test(category)) return id % 2 ? ILLUST.doenjangStew : ILLUST.kimchiStew
  if (/반찬|후식/.test(category)) return ILLUST.omelette
  return ILLUST.friedRice
}
