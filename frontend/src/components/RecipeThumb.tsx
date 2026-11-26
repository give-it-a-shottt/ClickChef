import { useState } from 'react'
import { illustFor } from '@/lib/illust'
import { cx } from '@/lib/cx'

type Props = {
  id: number
  name: string
  category: string
  imageUrl: string | null
  className?: string
  /** 첫 화면에 보이는 이미지는 바로 받아요 */
  eager?: boolean
}

/** 레시피 사진. 사진이 없거나 못 불러오면 요리 종류에 맞는 일러스트로 대신해요. */
export function RecipeThumb({ id, name, category, imageUrl, className, eager }: Props) {
  const [failed, setFailed] = useState(false)
  const src = imageUrl && !failed ? imageUrl : illustFor(name, category, id)
  return (
    <img
      src={src}
      alt=""
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      width={320}
      height={240}
      onError={() => setFailed(true)}
      className={cx('size-full bg-bg-image object-cover', className)}
    />
  )
}
