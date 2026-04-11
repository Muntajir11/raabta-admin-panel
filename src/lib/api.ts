const defaultBase = 'http://localhost:5000'

export function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || defaultBase
}

export function resolveMediaUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return ''
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl
  return `${getApiBaseUrl()}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`
}

type ApiErr = { success?: boolean; message?: string; code?: string }

async function parseJson(res: Response): Promise<unknown> {
  const ct = res.headers.get('content-type') || ''
  if (!ct.includes('application/json')) return {}
  return res.json().catch(() => ({}))
}

/** Expects `{ success: true, data: T }` from API. */
export async function apiRequest<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const base = getApiBaseUrl()
  const isForm = opts.body instanceof FormData
  const hasJsonBody = !isForm && opts.body != null && opts.body !== ''
  const res = await fetch(`${base}${path}`, {
    credentials: 'include',
    ...opts,
    headers: {
      ...(hasJsonBody ? { 'Content-Type': 'application/json' } : {}),
      ...(opts.headers || {}),
    },
  })
  const data = (await parseJson(res)) as { success?: boolean; data?: T } & ApiErr
  if (!res.ok) {
    throw new Error(data.message || res.statusText || 'Request failed')
  }
  if (data && typeof data === 'object' && 'data' in data && data.data !== undefined) {
    return data.data as T
  }
  throw new Error('Invalid API response')
}
