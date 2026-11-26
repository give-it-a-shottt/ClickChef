import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { ToggleTag } from '@/components/ui/Tag'
import { CATEGORY_GROUPS } from '@/lib/category'
import { useFilters } from './useFilters'

function Group({ title, children }: { title: string; children: ReactNode }) {
  const id = `filter-${title}`
  return (
    <div role="group" aria-labelledby={id} className="flex flex-col gap-3">
      <h3 id={id} className="text-label-14 text-text-main">
        {title}
      </h3>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

/** P04 왼쪽 필터 / MO 필터 바텀시트 — 같은 컴포넌트를 써요 */
export function FilterPanel() {
  const f = useFilters()
  return (
    <div className="flex flex-col gap-8">
      <Group title="재료 일치">
        <ToggleTag dot={false} selected={f.match === 'all'} onToggle={() => f.update({ match: 'all' })}>
          전체
        </ToggleTag>
        <ToggleTag dot={false} selected={f.match === 'full'} onToggle={() => f.update({ match: f.match === 'full' ? 'all' : 'full' })}>
          재료 모두 있음
        </ToggleTag>
        <ToggleTag dot={false} selected={f.match === 'one'} onToggle={() => f.update({ match: f.match === 'one' ? 'all' : 'one' })}>
          1개만 부족
        </ToggleTag>
      </Group>
      <Group title="조리 시간">
        <ToggleTag dot={false} selected={f.maxTime === null} onToggle={() => f.update({ maxTime: null })}>
          전체
        </ToggleTag>
        {([15, 30] as const).map((t) => (
          <ToggleTag key={t} dot={false} selected={f.maxTime === t} onToggle={() => f.update({ maxTime: f.maxTime === t ? null : t })}>
            {t}분 이내
          </ToggleTag>
        ))}
      </Group>
      <Group title="종류">
        {CATEGORY_GROUPS.map((g) => (
          <ToggleTag
            key={g.key}
            dot={false}
            selected={f.cats.includes(g.key)}
            onToggle={() => f.update({ cats: f.cats.includes(g.key) ? f.cats.filter((c) => c !== g.key) : [...f.cats, g.key] })}
          >
            {g.label}
          </ToggleTag>
        ))}
      </Group>
      <Group title="인분">
        {([1, 2, 3] as const).map((n) => (
          <ToggleTag key={n} dot={false} selected={f.servings === n} onToggle={() => f.update({ servings: f.servings === n ? null : n })}>
            {n === 3 ? '3~4인분' : `${n}인분`}
          </ToggleTag>
        ))}
      </Group>
      <Button variant="ghost" size="s" block onClick={f.reset} disabled={f.activeCount === 0}>
        필터 초기화
      </Button>
    </div>
  )
}
