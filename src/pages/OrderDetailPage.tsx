import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { formatCurrencyRs, formatDateTime } from '../lib/format'
import { notify } from '../lib/notify'
import { apiRequest } from '../lib/api'
import { formatApiError } from '../lib/errors'

type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'in_production'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

type PaymentStatus = 'unpaid' | 'paid' | 'refunded'

type OrderItem = {
  productId: string
  name: string
  size: string
  color: string
  gsm: number
  qty: number
  unitPrice: number
}

type ShippingAddress = {
  phone: string
  address: string
  city: string
  state: string
  pincode: string
  landmark?: string
}

type OrderDetail = {
  id: string
  orderNumber: string
  createdAt: string
  updatedAt: string
  userId: string
  items: OrderItem[]
  subtotal: number
  shipping: number
  total: number
  paymentMethod: 'cod' | 'prepaid'
  paymentStatus: PaymentStatus
  status: OrderStatus
  notes: string
  customerName: string
  customerEmail: string
  city: string
  shippingAddress?: ShippingAddress | null
  inventoryReserved?: boolean
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

export function OrderDetailPage() {
  const params = useParams<{ orderNumber: string }>()
  const navigate = useNavigate()
  const orderNumber = params.orderNumber || ''

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [status, setStatus] = useState<OrderStatus>('pending')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('unpaid')
  const [notes, setNotes] = useState('')

  const load = useCallback(async () => {
    if (!orderNumber) return
    setLoading(true)
    try {
      const data = await apiRequest<OrderDetail>(`/api/admin/orders/${encodeURIComponent(orderNumber)}`)
      setOrder(data)
      setStatus(data.status)
      setPaymentStatus(data.paymentStatus)
      setNotes(data.notes || '')
    } catch (e) {
      notify.error(formatApiError(e, 'Failed to load order'))
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }, [orderNumber])

  useEffect(() => {
    void load()
  }, [load])

  const hasChanges = useMemo(() => {
    if (!order) return false
    return order.status !== status || order.paymentStatus !== paymentStatus || (order.notes || '') !== notes
  }, [notes, order, paymentStatus, status])

  const save = async () => {
    if (!order) return
    setSaving(true)
    try {
      const patch: Partial<Pick<OrderDetail, 'status' | 'paymentStatus' | 'notes'>> = {}
      if (order.status !== status) patch.status = status
      if (order.paymentStatus !== paymentStatus) patch.paymentStatus = paymentStatus
      if ((order.notes || '') !== notes) patch.notes = notes
      const updated = await apiRequest<OrderDetail>(`/api/admin/orders/${encodeURIComponent(order.orderNumber)}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      })
      setOrder(updated)
      setStatus(updated.status)
      setPaymentStatus(updated.paymentStatus)
      setNotes(updated.notes || '')
      notify.success('Order updated')
    } catch (e) {
      notify.error(formatApiError(e, 'Failed to update order'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title={orderNumber || 'Order'}
        description="Update order status and payment status."
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate('/orders')}>
              Back
            </Button>
            <Button variant="secondary" onClick={() => void load()} disabled={loading || saving}>
              Refresh
            </Button>
            <Button onClick={() => void save()} disabled={!hasChanges || saving || loading}>
              Save
            </Button>
          </>
        }
      />

      {loading ? (
        <Card className="p-4">Loading…</Card>
      ) : !order ? (
        <Card className="p-4">
          Order not found. <Link className="text-brand-600 underline" to="/orders">Back to orders</Link>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-slate-700">Customer</div>
                <div className="text-base font-semibold text-slate-900">{order.customerName || '—'}</div>
                <div className="text-sm text-slate-500">{order.city || '—'}</div>
                <div className="text-xs text-slate-500">{formatDateTime(order.createdAt)}</div>
              </div>
              <div className="text-right">
                <Badge tone={statusTones[order.status]}>{order.status.replaceAll('_', ' ')}</Badge>
                <div className="mt-2 text-sm font-semibold text-slate-900">{formatCurrencyRs(order.total)}</div>
                <div className="mt-1 text-xs text-slate-500">{order.paymentMethod.toUpperCase()}</div>
                {typeof order.inventoryReserved === 'boolean' ? (
                  <div className="mt-1 text-xs text-slate-500">
                    Inventory reserved: <span className="font-semibold">{order.inventoryReserved ? 'Yes' : 'No'}</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <label className="text-sm font-medium text-slate-700">
                Status
                <select
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-brand-500"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OrderStatus)}
                >
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
                Payment status
                <select
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-brand-500"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                  <option value="refunded">Refunded</option>
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                Notes
                <textarea
                  className="mt-1 min-h-[96px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-brand-500"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Internal notes…"
                />
              </label>
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm font-semibold text-slate-700">Delivery address</div>
            {order.shippingAddress ? (
              <div className="mt-2 space-y-1 text-sm text-slate-700">
                <div className="font-semibold text-slate-900">{order.shippingAddress.address}</div>
                <div>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
                </div>
                {order.shippingAddress.landmark ? <div>Landmark: {order.shippingAddress.landmark}</div> : null}
                <div>Phone: {order.shippingAddress.phone}</div>
              </div>
            ) : (
              <div className="mt-2 text-sm text-slate-500">No address snapshot.</div>
            )}

            <div className="mt-6 text-sm font-semibold text-slate-700">Items</div>
            <div className="mt-2 space-y-2">
              {order.items.map((i) => (
                <div key={`${i.productId}|${i.size}|${i.color}|${i.gsm}`} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{i.name}</div>
                    <div className="text-xs text-slate-500">
                      {i.productId} • {i.size} • {i.color} • {i.gsm}gsm • Qty {i.qty}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-slate-900">{formatCurrencyRs(i.unitPrice * i.qty)}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-semibold text-slate-900">{formatCurrencyRs(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Shipping</span>
                <span className="font-semibold text-slate-900">{formatCurrencyRs(order.shipping)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-600">Total</span>
                <span className="font-semibold text-slate-900">{formatCurrencyRs(order.total)}</span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

