import { Plus } from '@phosphor-icons/react'
import { useState } from 'react'
import { RemovableTag } from '@/components/ui/Tag'

type Props = {
  items: string[]
  onRemove: (v: string) => void
  onAdd: (v: string) => void
  addLabel: string
  placeholder: string
  emptyText: string
}

/** 기본 양념·싫어하는 재료 편집 — 칩(×로 지우기) + "추가"를 누르면 그 자리에 입력창이 열려요 */
export function EditableChips({ items, onRemove, onAdd, addLabel, placeholder, emptyText }: Props) {
  const [adding, setAdding] = useState(false)
  const [value, setValue] = useState('')
  const submit = () => {
    value
      .split(/[,，、]/)
      .map((v) => v.trim())
      .filter(Boolean)
      .forEach(onAdd)
    setValue('')
  }
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-wrap items-center gap-2">
        {items.map((v) => (
          <li key={v}>
            <RemovableTag size="m" label={v} onRemove={() => onRemove(v)} />
          </li>
        ))}
        {!items.length && !adding && <li className="text-body-14 text-text-sub-weak">{emptyText}</li>}
        <li>
          {adding ? (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                submit()
              }}
              className="flex h-10 items-center gap-1 rounded-tag border border-primary-default bg-bg-default pr-1 pl-3"
            >
              <input
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={() => {
                  if (value.trim()) submit()
                  setAdding(false)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setValue('')
                    setAdding(false)
                  }
                }}
                placeholder={placeholder}
                aria-label={addLabel}
                maxLength={20}
                enterKeyHint="done"
                className="w-28 bg-transparent text-[16px] text-text-main outline-none placeholder:text-text-sub-weak lg:text-body-14"
              />
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex h-8 items-center gap-1 rounded-button px-2 text-label-m-14 text-text-main hover:bg-bg-hover"
            >
              <Plus size={16} aria-hidden />
              {addLabel}
            </button>
          )}
        </li>
      </ul>
    </div>
  )
}
