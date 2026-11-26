import { Plus } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useShallow } from 'zustand/react/shallow'
import { Badge } from '@/components/ui/Badge'
import { ToggleTag } from '@/components/ui/Tag'
import { TextField } from '@/components/ui/TextField'
import { useCaptureStore } from '@/features/capture/captureStore'
import { cx } from '@/lib/cx'
import { usePrefsStore } from '@/stores/prefsStore'

/** 찾은 재료(토글) — 직접 추가한 재료도 여기에 붙어요 */
export function FoundChips({ size = 'm' }: { size?: 's' | 'm' }) {
  const items = useCaptureStore(useShallow((s) => s.items.filter((i) => i.source !== 'uncertain')))
  const toggle = useCaptureStore((s) => s.toggle)
  if (!items.length) return null
  return (
    <ul className="flex flex-wrap gap-2" aria-label="찾은 재료">
      {items.map((i) => (
        <li key={i.name}>
          <ToggleTag size={size} selected={i.selected} onToggle={() => toggle(i.name)}>
            {i.name}
          </ToggleTag>
        </li>
      ))}
    </ul>
  )
}

/** "이것도 있나요?" — AI가 확신하지 못한 재료. 켜면 추천에 같이 써요 */
export function UncertainChips({ desktop }: { desktop: boolean }) {
  const items = useCaptureStore(useShallow((s) => s.items.filter((i) => i.source === 'uncertain')))
  const toggle = useCaptureStore((s) => s.toggle)
  if (!items.length) return null
  return (
    <section className="flex flex-col gap-3" aria-labelledby="uncertain-title">
      <div className="flex items-center gap-2">
        {desktop ? (
          <>
            <h2 id="uncertain-title" className="text-title-18 text-text-main">
              이것도 있나요?
            </h2>
            <Badge color="yolk" size="m">
              확인 필요
            </Badge>
          </>
        ) : (
          <>
            <Badge color="yolk" size="m">
              확인 필요
            </Badge>
            <h2 id="uncertain-title" className="text-body-m-14 text-text-main">
              이것도 있나요?
            </h2>
          </>
        )}
      </div>
      <ul className="flex flex-wrap gap-2">
        {items.map((i) => (
          <li key={i.name}>
            <ToggleTag size="m" selected={i.selected} onToggle={() => toggle(i.name)}>
              {i.name}
            </ToggleTag>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** 재료 직접 추가 — 쉼표로 여러 개를 한 번에 넣을 수 있어요 */
export function AddIngredientField({ desktop, autoFocus }: { desktop: boolean; autoFocus?: boolean }) {
  const addManual = useCaptureStore((s) => s.addManual)
  const [value, setValue] = useState('')
  const submit = () => {
    if (!value.trim()) return
    addManual(value)
    setValue('')
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <TextField
        label="재료 직접 추가"
        size={desktop ? 'l' : 'm'}
        placeholder={desktop ? '예: 버섯, 두부' : '예: 버섯'}
        message={desktop ? 'Enter를 누르면 바로 추가돼요' : undefined}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        enterKeyHint="done"
        autoFocus={autoFocus}
        maxLength={40}
        trailing={
          <button
            type="submit"
            disabled={!value.trim()}
            className="-mr-1 flex items-center gap-0.5 rounded-button px-2 py-1 text-label-m-13 text-primary-text disabled:text-text-disabled"
          >
            <Plus size={14} weight="bold" aria-hidden />
            추가
          </button>
        }
      />
    </form>
  )
}

/** 기본 양념 — 이번 검색에서만 끌 수 있어요. 목록 자체는 마이에서 바꿔요 */
export function SeasoningChips({ desktop }: { desktop: boolean }) {
  const seasonings = usePrefsStore((s) => s.seasonings)
  const off = useCaptureStore((s) => s.seasoningOff)
  const toggle = useCaptureStore((s) => s.toggleSeasoning)
  return (
    <section className="flex flex-col gap-3" aria-labelledby="seasoning-title">
      <div className="flex items-center justify-between">
        <h2 id="seasoning-title" className={cx('text-text-main', desktop ? 'text-title-18' : 'text-title-16')}>
          기본 양념
        </h2>
        <Link to="/my" className={cx('text-text-sub hover:text-text-main', desktop ? 'text-body-m-14' : 'text-body-m-13')}>
          마이에서 바꾸기
        </Link>
      </div>
      {seasonings.length ? (
        <ul className="flex flex-wrap gap-1.5">
          {seasonings.map((name) => (
            <li key={name}>
              <ToggleTag size="s" selected={!off.includes(name)} onToggle={() => toggle(name)}>
                {name}
              </ToggleTag>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-body-13 text-text-sub-weak">등록한 기본 양념이 없어요. 마이에서 추가할 수 있어요.</p>
      )}
    </section>
  )
}

export function ChipSkeleton() {
  return (
    <div className="flex flex-wrap gap-2" aria-hidden>
      {[64, 56, 72, 60, 52].map((w, i) => (
        <span key={i} className="h-10 animate-pulse rounded-tag bg-bg-regular" style={{ width: w }} />
      ))}
    </div>
  )
}
