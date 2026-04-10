import type React from 'react'
import { ArrowUpRight, PackageCheck, Palette, ReceiptText, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { designs, orders, customers, products } from '../mocks/data'
import { formatCurrencyRs, formatDateTime } from '../lib/format'
import { Badge } from '../components/ui/Badge'
import { Link } from 'react-router-dom'

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
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)
  const activeProducts = products.filter((p) => p.isActive).length
  const openDesigns = designs.filter((d) => d.status === 'new').length

  const recentOrders = [...orders].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 5)
  const recentDesigns = [...designs].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 5)

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
          title="Revenue (mock)"
          value={formatCurrencyRs(totalRevenue)}
          hint="Total of all mock orders"
          icon={ReceiptText}
        />
        <Stat
          title="Customers"
          value={`${customers.length}`}
          hint="Total customers in mock dataset"
          icon={Users}
        />
        <Stat
          title="Active products"
          value={`${activeProducts}/${products.length}`}
          hint="Active vs total products"
          icon={PackageCheck}
        />
        <Stat
          title="New design requests"
          value={`${openDesigns}`}
          hint="Awaiting review/approval"
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
                  {recentOrders.map((o) => (
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
                          {o.status.replaceAll('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrencyRs(o.total)}</td>
                    </tr>
                  ))}
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
                  {recentDesigns.map((d) => (
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
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

