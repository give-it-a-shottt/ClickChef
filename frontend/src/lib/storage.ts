/**
 * 사파리 개인정보 보호 모드처럼 localStorage 접근이 막힌 환경에서도
 * 앱이 멈추지 않도록 감싼 저장소예요. 막히면 메모리에만 저장해요.
 */
function wrap(get: () => Storage): Storage {
  const memory = new Map<string, string>()
  const safe = <T,>(fn: (s: Storage) => T, fallback: () => T): T => {
    try {
      return fn(get())
    } catch {
      return fallback()
    }
  }
  return {
    get length() {
      return safe((s) => s.length, () => memory.size)
    },
    clear: () => safe((s) => s.clear(), () => memory.clear()),
    getItem: (k) => safe((s) => s.getItem(k), () => memory.get(k) ?? null),
    key: (i) => safe((s) => s.key(i), () => [...memory.keys()][i] ?? null),
    removeItem: (k) => safe((s) => s.removeItem(k), () => void memory.delete(k)),
    setItem: (k, v) => safe((s) => s.setItem(k, v), () => void memory.set(k, v)),
  }
}

export const safeLocalStorage = wrap(() => window.localStorage)
export const safeSessionStorage = wrap(() => window.sessionStorage)
