import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { formatCurrencyRs, formatDateTime } from '../lib/format'
import { notify } from '../lib/notify'
import { apiRequest } from '../lib/api'

type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'in_production'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

type PaymentStatus = 'unpaid' | 'paid' | 'refunded'

type OrderRow = {
  id: string
  orderNumber: string
  createdAt: string
  customerName: string
  customerEmail: string
  city: string
  paymentMethod: 'cod' | 'prepaid'
  paymentStatus: PaymentStatus
  status: OrderStatus
  total: number
  itemsCount: number
}

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
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<OrderStatus | 'all'>('all')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | 'all'>('all')
  const [rows, setRows] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      if (status !== 'all') params.set('status', status)
      if (paymentStatus !== 'all') params.set('paymentStatus', paymentStatus)
      const qs = params.toString()
      const data = await apiRequest<{ items: OrderRow[] } & { total: number }>(
        `/api/admin/orders${qs ? `?${qs}` : ''}`
      )
      setRows(data.items)
    } catch (e) {
      notify.error(e instanceof Error ? e.message : 'Failed to load orders')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [paymentStatus, q, status])

  useEffect(() => {
    void fetchList()
  }, [fetchList])

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Track order status from pending to delivered."
        actions={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => notify.info('Export CSV (static): coming soon')}
            >
              Export CSV
            </Button>
            <Button variant="secondary" onClick={() => void fetchList()} disabled={loading}>
              Refresh
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
          <label className="text-sm font-medium text-slate-700">
            Payment
            <select
              className="ml-2 h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-brand-500"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus | 'all')}
            >
              <option value="all">All</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded</option>
            </select>
          </label>
          <Button variant="secondary" onClick={() => void fetchList()} disabled={loading}>
            Search
          </Button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-3 py-3">Order</th>
                <th className="px-3 py-3">Customer</th>
                <th className="px-3 py-3">Method</th>
                <th className="px-3 py-3">Payment</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Total</th>
                <th className="px-3 py-3 text-right">Items</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td className="px-3 py-10 text-center text-sm text-slate-500" colSpan={7}>
                    Loading…
                  </td>
                </tr>
              ) : rows.map((o) => (
                <tr
                  key={o.id}
                  className="cursor-pointer hover:bg-slate-50/60"
                  onClick={() => navigate(`/orders/${encodeURIComponent(o.orderNumber)}`)}
                >
                  <td className="px-3 py-3">
                    <div className="font-medium text-slate-900">{o.id}</div>
                    <div className="text-xs text-slate-500">{formatDateTime(o.createdAt)}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-medium">{o.customerName}</div>
                    <div className="text-xs text-slate-500">{o.city ?? '—'}</div>
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={o.paymentMethod === 'prepaid' ? 'brand' : 'amber'}>{o.paymentMethod.toUpperCase()}</Badge>
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
                  <td className="px-3 py-3 text-right">{o.itemsCount}</td>
                </tr>
              ))}
              {!loading && rows.length === 0 ? (
                <tr>
                  <td className="px-3 py-10 text-center text-sm text-slate-500" colSpan={7}>
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

