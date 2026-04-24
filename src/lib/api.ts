const defaultBase = 'http://localhost:5000'

export function getApiBaseUrl(): string {
  // In local dev, use same-origin `/api/...` so cookies are first-party
  // and requests go through Vite's proxy (see `vite.config.ts`).
  if (import.meta.env.DEV) return ''
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

/** Uses refresh cookie to obtain new access + refresh cookies (same-origin / CSRF rules apply). */
let inflightRefresh: Promise<boolean> | null = null
export async function tryRefreshSession(): Promise<boolean> {
  if (inflightRefresh) return inflightRefresh
  const base = getApiBaseUrl()
  inflightRefresh = fetch(`${base}/api/admin/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      inflightRefresh = null
    })
  return inflightRefresh
}

function cloneFormData(fd: FormData): FormData {
  const next = new FormData()
  fd.forEach((value, key) => {
    next.append(key, value)
  })
  return next
}

/** Expects `{ success: true, data: T }` from API. On 401, refreshes session once and retries. */
export async function apiRequest<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const base = getApiBaseUrl()
  const { body: rawBody, headers: reqHeaders, ...rest } = opts

  const isForm = rawBody instanceof FormData
  let bodyFirst: BodyInit | undefined =
    rawBody === null || rawBody === undefined ? undefined : (rawBody as BodyInit)
  let bodyRetry: BodyInit | undefined
  if (rawBody instanceof FormData) {
    // Always clone FormData; some environments treat request bodies as consumable streams.
    bodyFirst = cloneFormData(rawBody)
    bodyRetry = cloneFormData(rawBody)
  }

  const doFetch = (body: BodyInit | undefined) => {
    const isF = body instanceof FormData
    const hasJsonBody = !isF && body != null && body !== ''
    return fetch(`${base}${path}`, {
      credentials: 'include',
      ...rest,
      body,
      headers: {
        ...(hasJsonBody ? { 'Content-Type': 'application/json' } : {}),
        ...(reqHeaders || {}),
      },
    })
  }

  let res = await doFetch(bodyFirst)
  if (res.status === 401 && (await tryRefreshSession())) {
    res = await doFetch(isForm ? bodyRetry : bodyFirst)
  }

  const data = (await parseJson(res)) as { success?: boolean; data?: T } & ApiErr
  if (!res.ok) {
    throw new Error(data.message || res.statusText || 'Request failed')
  }
  if (data && typeof data === 'object' && 'data' in data && data.data !== undefined) {
    return data.data as T
  }
  throw new Error('Invalid API response')
}
