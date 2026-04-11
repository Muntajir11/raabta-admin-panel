import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getApiBaseUrl } from '../lib/api'

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
  const res = await fetch(`${base}/api/auth/session`, {
    credentials: 'include',
    cache: 'no-store',
  })
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
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<AuthUser | null>(null)

  const refresh = useCallback(async (): Promise<AuthUser | null> => {
    const u = await fetchSession()
    setUser(u)
    setStatus('ready')
    return u
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const logout = useCallback(async () => {
    const base = getApiBaseUrl()
    try {
      await fetch(`${base}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      })
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
