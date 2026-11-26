export class ApiError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const BASE = '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(BASE + path, init)
  } catch {
    throw new ApiError(0, '인터넷 연결을 확인해 주세요')
  }
  if (!res.ok) {
    let message = '잠시 후 다시 시도해 주세요'
    try {
      const body = (await res.json()) as { detail?: unknown }
      if (typeof body.detail === 'string') message = body.detail
    } catch {
      /* 본문이 JSON이 아니면 기본 문구 */
    }
    throw new ApiError(res.status, message)
  }
  return (await res.json()) as T
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>(path, { signal }),
  post: <T>(path: string, body: unknown, signal?: AbortSignal) =>
    request<T>(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    }),
  upload: <T>(path: string, form: FormData, signal?: AbortSignal) => request<T>(path, { method: 'POST', body: form, signal }),
}
