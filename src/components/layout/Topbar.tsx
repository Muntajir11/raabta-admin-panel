import { Bell, Search } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
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
  const title = titles[pathname] ?? 'Raabta Admin'

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

          <Link
            to="/settings"
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <div className="grid h-7 w-7 place-items-center rounded-full bg-brand-600 text-xs font-semibold text-white">
              R
            </div>
            <span className="hidden sm:inline">Admin</span>
          </Link>
        </div>
      </div>
    </header>
  )
}

