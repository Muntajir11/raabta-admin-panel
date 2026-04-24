import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { formatCurrencyRs, formatDateTime } from '../lib/format'
import { nil } from '../lib/nil'
import { notify } from '../lib/notify'
import { apiRequest } from '../lib/api'
import { formatApiError } from '../lib/errors'

export type CustomerListRow = {
  id: string
  name: string
  email: string
  phone: string | null
  city: string | null
  address: string | null
  gender: string | null
  createdAt: string
  ordersCount: number
  totalSpent: number
}

export function CustomersPage() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [rows, setRows] = useState<CustomerListRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetchList = useCallback(async (search: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set('q', search.trim())
      const qs = params.toString()
      const data = await apiRequest<{ items: CustomerListRow[] }>(
        `/api/admin/customers${qs ? `?${qs}` : ''}`
      )
      setRows(data.items)
    } catch (e) {
      notify.error(formatApiError(e, 'Failed to load customers'))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchList('')
  }, [fetchList])

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Profiles and order totals from your database (role: user only)."
        actions={
          <Button variant="secondary" onClick={() => void fetchList(q)} disabled={loading}>
            Refresh
          </Button>
        }
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[240px] flex-1">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void fetchList(q)}
              placeholder="Search name, email, phone, city…"
            />
          </div>
          <Button variant="ghost" onClick={() => setQ('')}>
            Clear
          </Button>
          <Button variant="secondary" onClick={() => void fetchList(q)}>
            Search
          </Button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-3 py-3">Customer</th>
                <th className="px-3 py-3">Phone</th>
                <th className="px-3 py-3">Gender</th>
                <th className="px-3 py-3">City</th>
                <th className="px-3 py-3">Address</th>
                <th className="px-3 py-3 text-right">Orders</th>
                <th className="px-3 py-3 text-right">Spent</th>
                <th className="px-3 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td className="px-3 py-10 text-center text-slate-500" colSpan={8}>
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="px-3 py-10 text-center text-slate-500" colSpan={8}>
                    No customers found.
                  </td>
                </tr>
              ) : (
                rows.map((c) => (
                  <tr
                    key={c.id}
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer hover:bg-slate-50/60"
                    onClick={() => navigate(`/customers/${c.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        navigate(`/customers/${c.id}`)
                      }
                    }}
                  >
                    <td className="px-3 py-3">
                      <div className="font-medium text-slate-900">{c.name}</div>
                      <div className="text-xs text-slate-500">{nil(c.email)}</div>
                    </td>
                    <td className="px-3 py-3">{nil(c.phone)}</td>
                    <td className="px-3 py-3">{nil(c.gender)}</td>
                    <td className="px-3 py-3">{nil(c.city)}</td>
                    <td className="max-w-[200px] truncate px-3 py-3" title={nil(c.address)}>
                      {nil(c.address)}
                    </td>
                    <td className="px-3 py-3 text-right">{c.ordersCount}</td>
                    <td className="px-3 py-3 text-right font-medium">{formatCurrencyRs(c.totalSpent)}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{formatDateTime(c.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
