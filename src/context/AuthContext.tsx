import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getApiBaseUrl, tryRefreshSession } from '../lib/api'
import { notify } from '../lib/notify'
import { formatApiError, isNetworkError } from '../lib/errors'

export type AuthUser = {
  id: string
  name: string
  email: string
  role: string
}

type AuthStatus = 'loading' | 'ready'

type AuthContextValue = {
  status: AuthStatus
  user: AuthUser | null
  /** Returns the latest user after re-fetch (e.g. after login). */
  refresh: () => Promise<AuthUser | null>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function fetchSession(): Promise<AuthUser | null> {
  const base = getApiBaseUrl()
  let res = await fetch(`${base}/api/admin/auth/session`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (res.status === 401 && (await tryRefreshSession())) {
    res = await fetch(`${base}/api/admin/auth/session`, {
      credentials: 'include',
      cache: 'no-store',
    })
  }
  if (!res.ok) return null
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean
    data?: { user?: AuthUser }
  }
  const u = json.data?.user
  if (!u?.id || !u.email) return null
  return u
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('ready')
  const [user, setUser] = useState<AuthUser | null>(null)

  const refresh = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const u = await fetchSession()
      setUser(u)
      setStatus('ready')
      return u
    } catch {
      setUser(null)
      setStatus('ready')
      return null
    }
  }, [])

  const logout = useCallback(async () => {
    const base = getApiBaseUrl()
    try {
      await fetch(`${base}/api/admin/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      })
    } catch (err) {
      if (isNetworkError(err)) {
        notify.info('Signed out locally (backend unreachable)')
      } else {
        notify.error(formatApiError(err, 'Logout failed'))
      }
    } finally {
      setUser(null)
      setStatus('ready')
    }
  }, [])

  const value = useMemo(
    () => ({ status, user, refresh, logout }),
    [status, user, refresh, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
