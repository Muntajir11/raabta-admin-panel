import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { formatCurrencyRs, formatDateTime } from '../lib/format'
import { nil } from '../lib/nil'
import { notify } from '../lib/notify'
import { apiRequest } from '../lib/api'

type CustomerUser = {
  id: string
  name: string
  email: string
  phone: string | null
  city: string | null
  address: string | null
  gender: string | null
  createdAt: string
  updatedAt: string
}

type OrderRow = {
  id: string
  orderNumber: string
  createdAt: string
  total: number
  paymentStatus: string
  status: string
  items: Array<{ name: string; qty: number }>
}

export function CustomerDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<CustomerUser | null>(null)
  const [orders, setOrders] = useState<OrderRow[]>([])

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const data = await apiRequest<{ user: CustomerUser; orders: OrderRow[] }>(
        `/api/admin/customers/${encodeURIComponent(userId)}`
      )
      setUser(data.user)
      setOrders(data.orders)
    } catch (e) {
      notify.error(e instanceof Error ? e.message : 'Failed to load customer')
      setUser(null)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">Loading…</div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <PageHeader title="Customer" description="Not found." />
        <Button variant="secondary" onClick={() => navigate('/customers')}>
          Back to customers
        </Button>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={user.name}
        description={user.email}
        actions={
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/customers')}
            className="inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            All customers
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-slate-900">Profile</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4 border-b border-slate-100 py-2">
              <dt className="text-slate-500">Email</dt>
              <dd className="text-right font-medium text-slate-900">{nil(user.email)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 py-2">
              <dt className="text-slate-500">Phone</dt>
              <dd className="text-right font-medium text-slate-900">{nil(user.phone)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 py-2">
              <dt className="text-slate-500">Gender</dt>
              <dd className="text-right font-medium text-slate-900">{nil(user.gender)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 py-2">
              <dt className="text-slate-500">City</dt>
              <dd className="text-right font-medium text-slate-900">{nil(user.city)}</dd>
            </div>
            <div className="flex flex-col gap-1 border-b border-slate-100 py-2">
              <dt className="text-slate-500">Address</dt>
              <dd className="font-medium text-slate-900 whitespace-pre-wrap">{nil(user.address)}</dd>
            </div>
            <div className="flex justify-between gap-4 py-2">
              <dt className="text-slate-500">Joined</dt>
              <dd className="text-right font-medium text-slate-900">{formatDateTime(user.createdAt)}</dd>
            </div>
          </dl>
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-semibold text-slate-900">Orders</h2>
          {orders.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No orders yet.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Order</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Payment</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td className="px-3 py-2 font-mono text-xs">{o.orderNumber}</td>
                      <td className="px-3 py-2">{formatDateTime(o.createdAt)}</td>
                      <td className="px-3 py-2">
                        <Badge tone="slate">{o.status}</Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Badge tone={o.paymentStatus === 'paid' ? 'green' : 'rose'}>{o.paymentStatus}</Badge>
                      </td>
                      <td className="px-3 py-2 text-right font-medium">{formatCurrencyRs(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
