import type React from 'react'
import { ArrowUpRight, PackageCheck, Palette, ReceiptText, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { formatCurrencyRs, formatDateTime } from '../lib/format'
import { Badge } from '../components/ui/Badge'
import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../lib/api'
import { notify } from '../lib/notify'
import { formatApiError } from '../lib/errors'

type DashboardData = {
  revenueTotal: number
  customersCount: number
  productsCount: number
  activeProductsCount: number
  newDesignRequests: number
  recentOrders: Array<{
    id: string
    orderNumber: string
    createdAt: string
    customerName: string
    city: string
    status: string
    total: number
  }>
  designQueue: Array<{
    id: string
    createdAt: string
    customerName: string
    productId: string
    status: string
    totalRs: number
  }>
}

function Stat({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string
  value: string
  hint: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Icon className="h-4 w-4 text-slate-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        <div className="mt-1 text-xs text-slate-600">{hint}</div>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const res = await apiRequest<DashboardData>('/api/admin/dashboard')
        if (cancelled) return
        setData(res)
      } catch (e) {
        if (!cancelled) notify.error(formatApiError(e, 'Failed to load dashboard'))
        if (!cancelled) setData(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const totalRevenue = data?.revenueTotal ?? 0
  const customersCount = data?.customersCount ?? 0
  const productsCount = data?.productsCount ?? 0
  const activeProductsCount = data?.activeProductsCount ?? 0
  const openDesigns = data?.newDesignRequests ?? 0

  const recentOrders = useMemo(() => data?.recentOrders ?? [], [data?.recentOrders])
  const recentDesigns = useMemo(() => data?.designQueue ?? [], [data?.designQueue])

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="High-level view of orders, custom prints, and catalog health."
        actions={
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            View orders <ArrowUpRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          title="Revenue"
          value={formatCurrencyRs(totalRevenue)}
          hint="Total revenue from orders"
          icon={ReceiptText}
        />
        <Stat
          title="Customers"
          value={`${customersCount}`}
          hint="Total customers in database"
          icon={Users}
        />
        <Stat
          title="Active products"
          value={`${activeProductsCount}/${productsCount}`}
          hint="Active vs total products"
          icon={PackageCheck}
        />
        <Stat
          title="New design requests"
          value={`${openDesigns}`}
          hint="Awaiting review/approval (coming soon)"
          icon={Palette}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Recent orders</CardTitle>
            <Link to="/orders" className="text-sm font-medium text-brand-700 hover:underline">
              Open
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={4}>
                        Loading…
                      </td>
                    </tr>
                  ) : recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{o.id}</div>
                        <div className="text-xs text-slate-500">{formatDateTime(o.createdAt)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{o.customerName}</div>
                        <div className="text-xs text-slate-500">{o.city ?? '—'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={o.status === 'pending' ? 'amber' : o.status === 'cancelled' ? 'rose' : 'green'}>
                          {String(o.status).replaceAll('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrencyRs(o.total)}</td>
                    </tr>
                  ))}
                  {!loading && recentOrders.length === 0 ? (
                    <tr>
                      <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={4}>
                        No orders yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Design queue</CardTitle>
            <Link to="/designs" className="text-sm font-medium text-brand-700 hover:underline">
              Open
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Design</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={4}>
                        Loading…
                      </td>
                    </tr>
                  ) : recentDesigns.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{d.id}</div>
                        <div className="text-xs text-slate-500">{formatDateTime(d.createdAt)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{d.customerName}</div>
                        <div className="text-xs text-slate-500">{d.productId}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={d.status === 'new' ? 'amber' : d.status === 'rejected' ? 'rose' : 'green'}>
                          {d.status.replaceAll('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrencyRs(d.totalRs)}</td>
                    </tr>
                  ))}
                  {!loading && recentDesigns.length === 0 ? (
                    <tr>
                      <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={4}>
                        No design requests yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

