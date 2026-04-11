import { Bell, LogOut, Search } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Input } from '../ui/Input'

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/orders': 'Orders',
  '/products': 'Products',
  '/designs': 'Custom designs',
  '/customers': 'Customers',
  '/inventory': 'Inventory',
  '/coupons': 'Coupons',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
  '/support': 'Support & returns',
}

export function Topbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const title =
    pathname.startsWith('/customers/') && pathname !== '/customers'
      ? 'Customer detail'
      : (titles[pathname] ?? 'Raabta Admin')

  async function handleSignOut() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="truncate text-xs text-slate-600">
            Manage catalog, orders, and custom prints
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3">
          <div className="hidden w-full max-w-md sm:block">
            <Input
              leftIcon={<Search className="h-4 w-4 text-slate-500" />}
              placeholder="Search orders, products, customers…"
              aria-label="Global search (static)"
            />
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
            aria-label="Notifications (static)"
          >
            <Bell className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2">
            <Link
              to="/settings"
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <div className="grid h-7 w-7 place-items-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                {(user?.name || user?.email || 'A').slice(0, 1).toUpperCase()}
              </div>
              <span className="hidden max-w-[120px] truncate sm:inline">
                {user?.name || 'Admin'}
              </span>
            </Link>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4 text-slate-500" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

