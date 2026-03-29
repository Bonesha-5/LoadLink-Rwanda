export type ApiError = {
  status: number
  message: string
  details?: unknown
}

const DEFAULT_BASE_URL = 'http://localhost:3000'

function getBaseUrl(): string {
  const v = (import.meta as any)?.env?.VITE_API_BASE_URL as string | undefined
  return (v && v.trim()) || DEFAULT_BASE_URL
}

async function readJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

export async function apiRequest<T>(
  path: string,
  opts?: {
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
    token?: string | null
    body?: unknown
    headers?: Record<string, string>
  },
): Promise<T> {
  const url = `${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`
  const method = opts?.method ?? 'GET'

  const headers: Record<string, string> = {
    ...(opts?.headers ?? {}),
  }
  if (opts?.body !== undefined && !(opts?.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json'
  }
  if (opts?.token) {
    headers.Authorization = `Bearer ${opts.token}`
  }

  const res = await fetch(url, {
    method,
    headers,
    body:
      opts?.body === undefined
        ? undefined
        : opts.body instanceof FormData
          ? opts.body
          : JSON.stringify(opts.body),
  })

  if (!res.ok) {
    const payload = await readJsonSafe(res)
    const message =
      (payload && typeof payload === 'object' && 'message' in payload && typeof (payload as any).message === 'string'
        ? (payload as any).message
        : `Request failed (${res.status})`)
    const err: ApiError = { status: res.status, message, details: payload }
    throw err
  }

  return (await readJsonSafe(res)) as T
}

