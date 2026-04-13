import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function GuestOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  if (user?.role === 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
