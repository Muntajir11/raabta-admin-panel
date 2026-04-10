import { NavLink } from 'react-router-dom'
import { primaryNav, roleNavNote, secondaryNav } from './nav'
import type React from 'react'

function SidebarLink({
  to,
  label,
  Icon,
}: {
  to: string
  label: string
  Icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'group flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
          isActive
            ? 'bg-white text-slate-900 shadow-soft ring-1 ring-slate-200'
            : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:ring-1 hover:ring-slate-200',
        ].join(' ')
      }
    >
      <Icon className="h-4 w-4 text-slate-500 group-hover:text-slate-700" />
      <span className="truncate">{label}</span>
    </NavLink>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-slate-100/60 p-4 lg:block">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">Raabta Admin</div>
          <div className="truncate text-xs text-slate-600">
            Custom T-shirt store (static)
          </div>
        </div>
        <div className="rounded-full bg-brand-600 px-2 py-1 text-[11px] font-semibold text-white">
          v0
        </div>
      </div>

      <div className="mt-5 space-y-1">
        {primaryNav.map((i) => (
          <SidebarLink key={i.to} to={i.to} label={i.label} Icon={i.icon} />
        ))}
      </div>

      <div className="mt-6 border-t border-slate-200 pt-4">
        <div className="mb-2 flex items-center gap-2 px-2 text-xs font-semibold text-slate-700">
          <roleNavNote.icon className="h-4 w-4 text-slate-500" />
          {roleNavNote.label}
        </div>
        <div className="rounded-lg bg-white/70 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
          This admin is static for now. Later we can wire permissions (Owner,
          Support, Production, Fulfillment).
        </div>
      </div>

      <div className="mt-6 space-y-1">
        {secondaryNav.map((i) => (
          <SidebarLink key={i.to} to={i.to} label={i.label} Icon={i.icon} />
        ))}
      </div>
    </aside>
  )
}

