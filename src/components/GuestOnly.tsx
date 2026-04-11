import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function GuestOnly({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuth()

  if (status === 'loading') {
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

  if (user?.role === 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
