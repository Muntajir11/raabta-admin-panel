import type React from 'react'
import {
  BarChart3,
  Boxes,
  Cog,
  LayoutDashboard,
  Palette,
  Percent,
  ReceiptText,
  Users,
} from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

export const primaryNav: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/orders', label: 'Orders', icon: ReceiptText },
  { to: '/products', label: 'Products', icon: Boxes },
  { to: '/designs', label: 'Custom designs', icon: Palette },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/inventory', label: 'Inventory', icon: Boxes },
  { to: '/coupons', label: 'Coupons', icon: Percent },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
]

export const secondaryNav: NavItem[] = [
  { to: '/settings', label: 'Settings', icon: Cog },
]

