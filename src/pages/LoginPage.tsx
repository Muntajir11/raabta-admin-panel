import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { useAuth } from '../context/AuthContext'
import { getApiBaseUrl } from '../lib/api'
import { notify } from '../lib/notify'

function RaabtaWordmark() {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative text-center font-light tracking-tight text-slate-900">
        <span className="text-3xl sm:text-4xl">
          r<span className="relative inline-block">
            aa
            <span
              className="absolute bottom-0 left-0 right-0 h-px bg-red-600"
              aria-hidden
            />
          </span>
          bta
          <span className="text-slate-900">.</span>
        </span>
      </div>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Admin</p>
    </div>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiDown, setApiDown] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setApiDown(false)
    try {
      const base = getApiBaseUrl()
      const res = await fetch(`${base}/api/admin/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const data = (await res.json().catch(() => ({}))) as { message?: string; success?: boolean }
      if (!res.ok) {
        notify.error(data.message || 'Login failed')
        return
      }
      const u = await refresh()
      if (u?.role !== 'admin') {
        notify.error('This account is not an admin. Set role to admin in the database.')
        return
      }
      notify.success('Signed in')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setApiDown(true)
      notify.error('Backend server is not reachable. Start the API and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-slate-50 px-4 py-12">
      <Card className="w-full max-w-[400px] border border-slate-200/80 bg-white/90 p-8 shadow-sm backdrop-blur-sm">
        <div className="mb-8">
          <RaabtaWordmark />
          <p className="mt-6 text-center text-sm leading-relaxed text-slate-600">
            Sign in to manage your catalog and orders.
          </p>
        </div>
        <form className="space-y-5" onSubmit={onSubmit}>
          {apiDown ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Backend server is not reachable. Start the API and try again.
            </div>
          ) : null}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600" htmlFor="password">
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="mt-2 w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
