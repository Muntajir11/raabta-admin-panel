import { useLayoutEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, refresh } = useAuth()
  const [checking, setChecking] = useState(() => user?.role !== 'admin')
  const didCheck = useRef(false)

  useLayoutEffect(() => {
    if (didCheck.current) return
    if (user?.role === 'admin') return
    didCheck.current = true
    setChecking(true)
    void refresh().finally(() => setChecking(false))
  }, [refresh, user?.role])

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700"
          aria-hidden
        />
        <span className="sr-only">Loading…</span>
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
