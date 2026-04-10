import { useMemo, useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { formatCurrencyRs, formatDateTime } from '../lib/format'
import { notify } from '../lib/notify'
import { orders } from '../mocks/data'
import type { OrderStatus } from '../mocks/types'

const statusTones: Record<OrderStatus, Parameters<typeof Badge>[0]['tone']> = {
  pending: 'amber',
  confirmed: 'brand',
  in_production: 'brand',
  shipped: 'brand',
  delivered: 'green',
  cancelled: 'rose',
  refunded: 'rose',
}

export function OrdersPage() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<OrderStatus | 'all'>('all')

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase()
    return orders
      .filter((o) => (status === 'all' ? true : o.status === status))
      .filter((o) => {
        if (!query) return true
        return (
          o.id.toLowerCase().includes(query) ||
          o.customerName.toLowerCase().includes(query) ||
          o.customerEmail.toLowerCase().includes(query) ||
          (o.city ?? '').toLowerCase().includes(query)
        )
      })
      .slice()
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  }, [q, status])

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Track order status from pending to delivered. (Static UI for now.)"
        actions={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => notify.info('Export CSV (static): coming soon')}
            >
              Export CSV
            </Button>
            <Button onClick={() => notify.error('New order (static): disabled')}>
              New order
            </Button>
          </>
        }
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[240px] flex-1">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by order/customer/city…" />
          </div>
          <label className="text-sm font-medium text-slate-700">
            Status
            <select
              className="ml-2 h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-brand-500"
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus | 'all')}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_production">In production</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </label>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-3 py-3">Order</th>
                <th className="px-3 py-3">Customer</th>
                <th className="px-3 py-3">Payment</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Total</th>
                <th className="px-3 py-3 text-right">Items</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/60">
                  <td className="px-3 py-3">
                    <div className="font-medium text-slate-900">{o.id}</div>
                    <div className="text-xs text-slate-500">{formatDateTime(o.createdAt)}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-medium">{o.customerName}</div>
                    <div className="text-xs text-slate-500">{o.city ?? '—'}</div>
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={o.paymentStatus === 'paid' ? 'green' : o.paymentStatus === 'refunded' ? 'rose' : 'amber'}>
                      {o.paymentStatus}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={statusTones[o.status]}>{o.status.replaceAll('_', ' ')}</Badge>
                  </td>
                  <td className="px-3 py-3 text-right font-medium">{formatCurrencyRs(o.total)}</td>
                  <td className="px-3 py-3 text-right">{o.items.reduce((n, i) => n + i.qty, 0)}</td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td className="px-3 py-10 text-center text-sm text-slate-500" colSpan={6}>
                    No orders match your filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

