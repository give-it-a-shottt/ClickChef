/** 조건부 className 합치기 (clsx 대신 쓰는 짧은 도우미) */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
