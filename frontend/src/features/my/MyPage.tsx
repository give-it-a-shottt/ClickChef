import { Check, ForkKnife, Info, Lightbulb, Prohibit, SlidersHorizontal, User, Basket } from '@phosphor-icons/react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useShallow } from 'zustand/react/shallow'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { ListItem } from '@/components/ui/ListItem'
import { TextField } from '@/components/ui/TextField'
import { CONTACT_URL } from '@/lib/constants'
import { cx } from '@/lib/cx'
import { useIsDesktop } from '@/lib/useMediaQuery'
import { useLibraryStore } from '@/stores/libraryStore'
import { THEME_LABEL, usePrefsStore, type Theme } from '@/stores/prefsStore'
import { showToast } from '@/stores/toastStore'
import { EditableChips } from './EditableChips'

type Sheet = null | 'seasonings' | 'dislikes' | 'servings' | 'theme' | 'profile'

/** 10 마이 / P10 — 로그인 없이 이 기기에 저장돼요 */
export default function MyPage() {
  const isDesktop = useIsDesktop()
  const [sheet, setSheet] = useState<Sheet>(null)
  const close = () => setSheet(null)
  return (
    <>
      {isDesktop ? <DesktopMy open={setSheet} /> : <MobileMy open={setSheet} />}
      <SeasoningsSheet open={sheet === 'seasonings'} onClose={close} />
      <DislikesSheet open={sheet === 'dislikes'} onClose={close} />
      <ServingsSheet open={sheet === 'servings'} onClose={close} />
      <ThemeSheet open={sheet === 'theme'} onClose={close} />
      <ProfileSheet open={sheet === 'profile'} onClose={close} />
    </>
  )
}

function useStats() {
  return useLibraryStore(useShallow((s) => ({ cooked: s.cooked.length, saved: Object.keys(s.saved).length, captures: s.captureCount })))
}

function Stats({ desktop }: { desktop: boolean }) {
  const { cooked, saved, captures } = useStats()
  const items = [
    { label: '만든 요리', value: cooked },
    { label: '찜', value: saved },
    { label: '촬영', value: captures },
  ]
  return (
    <dl className="flex w-full rounded-card bg-bg-light py-4">
      {items.map((i) => (
        <div key={i.label} className="flex flex-1 flex-col-reverse items-center gap-0.5">
          <dt className="text-caption-m-12 text-text-sub">{i.label}</dt>
          <dd className={cx('text-text-main', desktop ? 'text-number-22' : 'text-number-20')}>{i.value}</dd>
        </div>
      ))}
    </dl>
  )
}

const LOGIN_NOTE = '로그인 없이 이 기기에 저장돼요'

/** 앱 설정 목록 — MO·PC 같이 써요 */
function AppSettings({ open, withServings }: { open: (s: Sheet) => void; withServings: boolean }) {
  const { theme, keepAwake, servings, setKeepAwake } = usePrefsStore(
    useShallow((s) => ({ theme: s.theme, keepAwake: s.keepAwake, servings: s.servings, setKeepAwake: s.setKeepAwake })),
  )
  return (
    <>
      {withServings && <ListItem icon={ForkKnife} title="기본 인분" value={`${servings}인분`} onClick={() => open('servings')} />}
      <ListItem icon={SlidersHorizontal} title="화면 테마" value={THEME_LABEL[theme]} onClick={() => open('theme')} />
      <ListItem
        icon={Lightbulb}
        title="조리 중 화면 켜두기"
        value={keepAwake ? '켜짐' : '꺼짐'}
        onClick={() => {
          setKeepAwake(!keepAwake)
          showToast({ message: keepAwake ? '조리 중에도 화면이 꺼질 수 있어요' : '조리 중 화면을 켜 둘게요' })
        }}
      />
      <ListItem icon={Info} title="문의하기" href={CONTACT_URL} />
    </>
  )
}

function MobileMy({ open }: { open: (s: Sheet) => void }) {
  const { nickname, seasonings, dislikes, servings } = usePrefsStore(
    useShallow((s) => ({ nickname: s.nickname, seasonings: s.seasonings.length, dislikes: s.dislikes.length, servings: s.servings })),
  )
  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center bg-bg-default px-5">
        <h1 className="text-headline-20 text-text-main">마이</h1>
      </header>
      <div className="flex flex-col gap-7 px-5 pt-2 pb-8">
        <button type="button" onClick={() => open('profile')} className="flex items-center gap-4 text-left">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-accent">
            <User size={28} aria-hidden />
          </span>
          <span className="flex flex-col gap-1">
            <span className="text-title-18 text-text-main">{nickname}</span>
            <span className="text-body-13 text-text-sub">{LOGIN_NOTE}</span>
          </span>
        </button>
        <Stats desktop={false} />
        <Group title="추천 설정">
          <ListItem icon={Basket} title="기본 양념" value={`${seasonings}개`} onClick={() => open('seasonings')} />
          <ListItem icon={Prohibit} title="싫어하는 재료" value={`${dislikes}개`} onClick={() => open('dislikes')} />
          <ListItem icon={ForkKnife} title="기본 인분" value={`${servings}인분`} onClick={() => open('servings')} />
        </Group>
        <Group title="앱 설정">
          <AppSettings open={open} withServings={false} />
        </Group>
        <p className="flex gap-4 text-caption-12 text-text-sub-weak">
          <Link to="/terms">이용약관</Link>
          <Link to="/privacy">개인정보처리방침</Link>
        </p>
      </div>
    </>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1">
      <h2 className="text-label-13 text-text-sub-weak">{title}</h2>
      <div>{children}</div>
    </section>
  )
}

function Card({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-card border border-line-light bg-bg-default px-7 py-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-title-18 text-text-main">{title}</h2>
        <p className="text-body-14 text-text-sub">{description}</p>
      </div>
      {children}
    </section>
  )
}

function DesktopMy({ open }: { open: (s: Sheet) => void }) {
  const p = usePrefsStore(
    useShallow((s) => ({
      nickname: s.nickname,
      seasonings: s.seasonings,
      dislikes: s.dislikes,
      addSeasoning: s.addSeasoning,
      removeSeasoning: s.removeSeasoning,
      addDislike: s.addDislike,
      removeDislike: s.removeDislike,
    })),
  )
  return (
    <div className="mx-auto max-w-content pb-24">
      <h1 className="pt-12 pb-8 text-headline-32 text-text-main">마이</h1>
      <div className="flex items-start gap-10">
        <div className="flex w-85 shrink-0 flex-col items-center gap-4">
          <div className="flex w-full flex-col items-center gap-5 rounded-card border border-line-light bg-bg-default px-6 py-7">
            <span className="flex size-20 items-center justify-center rounded-full bg-primary-soft text-primary-accent">
              <User size={40} aria-hidden />
            </span>
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-title-20 text-text-main">{p.nickname}</span>
              <span className="text-body-14 text-text-sub">{LOGIN_NOTE}</span>
            </div>
            <Stats desktop />
            <Button variant="outline-strong" size="m" block onClick={() => open('profile')}>
              프로필 수정
            </Button>
          </div>
          <Button variant="ghost" size="s" disabled title="카카오 로그인은 준비 중이에요">
            카카오 로그인 (준비 중)
          </Button>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <Card title="기본 양념" description="집에 늘 있는 양념이에요. 추천할 때 있는 재료로 쳐요.">
            <EditableChips
              items={p.seasonings}
              onAdd={p.addSeasoning}
              onRemove={p.removeSeasoning}
              addLabel="양념 추가"
              placeholder="예: 후추"
              emptyText="등록한 양념이 없어요"
            />
          </Card>
          <Card title="싫어하는 재료" description="이 재료가 들어간 요리는 추천에서 빼요.">
            <EditableChips
              items={p.dislikes}
              onAdd={p.addDislike}
              onRemove={p.removeDislike}
              addLabel="재료 추가"
              placeholder="예: 오이"
              emptyText="없어요"
            />
          </Card>
          <Card title="앱 설정" description="화면과 조리 모드 설정이에요.">
            <div>
              <AppSettings open={open} withServings />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

/* ---------- 설정 시트 ---------- */

function SeasoningsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { seasonings, addSeasoning, removeSeasoning } = usePrefsStore(
    useShallow((s) => ({ seasonings: s.seasonings, addSeasoning: s.addSeasoning, removeSeasoning: s.removeSeasoning })),
  )
  return (
    <BottomSheet open={open} onClose={onClose} title="기본 양념">
      <p className="pb-4 text-body-14 text-text-sub">집에 늘 있는 양념이에요. 추천할 때 있는 재료로 쳐요.</p>
      <EditableChips items={seasonings} onAdd={addSeasoning} onRemove={removeSeasoning} addLabel="양념 추가" placeholder="예: 후추" emptyText="등록한 양념이 없어요" />
    </BottomSheet>
  )
}

function DislikesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { dislikes, addDislike, removeDislike } = usePrefsStore(
    useShallow((s) => ({ dislikes: s.dislikes, addDislike: s.addDislike, removeDislike: s.removeDislike })),
  )
  return (
    <BottomSheet open={open} onClose={onClose} title="싫어하는 재료">
      <p className="pb-4 text-body-14 text-text-sub">이 재료가 들어간 요리는 추천에서 빼요.</p>
      <EditableChips items={dislikes} onAdd={addDislike} onRemove={removeDislike} addLabel="재료 추가" placeholder="예: 오이" emptyText="없어요" />
    </BottomSheet>
  )
}

function OptionList<T extends string | number>({ options, value, onPick }: { options: Array<{ value: T; label: string }>; value: T; onPick: (v: T) => void }) {
  return (
    <ul role="radiogroup">
      {options.map((o) => (
        <li key={o.value}>
          <button
            type="button"
            role="radio"
            aria-checked={o.value === value}
            onClick={() => onPick(o.value)}
            className="flex h-14 w-full items-center justify-between border-b border-line-light text-left text-body-m-15 text-text-main"
          >
            {o.label}
            {o.value === value && <Check size={20} weight="bold" className="text-primary-accent" aria-hidden />}
          </button>
        </li>
      ))}
    </ul>
  )
}

function ServingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { servings, setServings } = usePrefsStore(useShallow((s) => ({ servings: s.servings, setServings: s.setServings })))
  return (
    <BottomSheet open={open} onClose={onClose} title="기본 인분">
      <OptionList
        options={[1, 2, 3, 4].map((n) => ({ value: n, label: `${n}인분` }))}
        value={servings}
        onPick={(n) => {
          setServings(n)
          onClose()
        }}
      />
    </BottomSheet>
  )
}

function ThemeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, setTheme } = usePrefsStore(useShallow((s) => ({ theme: s.theme, setTheme: s.setTheme })))
  return (
    <BottomSheet open={open} onClose={onClose} title="화면 테마">
      <OptionList
        options={(Object.keys(THEME_LABEL) as Theme[]).map((t) => ({ value: t, label: THEME_LABEL[t] }))}
        value={theme}
        onPick={(t) => {
          setTheme(t)
          onClose()
        }}
      />
    </BottomSheet>
  )
}

function ProfileSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { nickname, setNickname } = usePrefsStore(useShallow((s) => ({ nickname: s.nickname, setNickname: s.setNickname })))
  return (
    <BottomSheet open={open} onClose={onClose} title="프로필 수정">
      {open && <ProfileForm initial={nickname} onSave={(v) => (setNickname(v), onClose())} />}
    </BottomSheet>
  )
}

function ProfileForm({ initial, onSave }: { initial: string; onSave: (v: string) => void }) {
  const [value, setValue] = useState(initial)
  return (
    <form
      className="flex flex-col gap-4 pt-2"
      onSubmit={(e) => {
        e.preventDefault()
        onSave(value)
      }}
    >
      <TextField label="닉네임" value={value} onChange={(e) => setValue(e.target.value)} maxLength={12} message="12자까지 쓸 수 있어요" />
      <Button type="submit" size="xl" block>
        저장
      </Button>
    </form>
  )
}
