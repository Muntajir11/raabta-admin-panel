import { useMemo, useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { formatCurrencyRs, formatDateTime } from '../lib/format'
import { notify } from '../lib/notify'
import { customers as mockCustomers } from '../mocks/data'

export function CustomersPage() {
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase()
    return mockCustomers
      .filter((c) => {
        if (!query) return true
        return (
          c.id.toLowerCase().includes(query) ||
          c.name.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          (c.city ?? '').toLowerCase().includes(query)
        )
      })
      .slice()
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  }, [q])

  return (
    <div>
      <PageHeader
        title="Customers"
        description="View customer profiles and order history at a glance."
        actions={
          <Button
            variant="secondary"
            onClick={() => notify.info('Segments (static): coming soon')}
          >
            Segments
          </Button>
        }
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[240px] flex-1">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by id/name/email/city…" />
          </div>
          <Button variant="ghost" onClick={() => setQ('')}>
            Clear
          </Button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-3 py-3">Customer</th>
                <th className="px-3 py-3">City</th>
                <th className="px-3 py-3">Tags</th>
                <th className="px-3 py-3 text-right">Orders</th>
                <th className="px-3 py-3 text-right">Spent</th>
                <th className="px-3 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60">
                  <td className="px-3 py-3">
                    <div className="font-medium text-slate-900">{c.name}</div>
                    <div className="text-xs text-slate-500">{c.email}</div>
                    <div className="text-xs text-slate-500">{c.id}</div>
                  </td>
                  <td className="px-3 py-3">{c.city ?? '—'}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      {(c.tags ?? []).length ? (
                        c.tags?.map((t) => (
                          <Badge key={t} tone={t === 'VIP' ? 'brand' : 'slate'}>
                            {t}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right">{c.ordersCount}</td>
                  <td className="px-3 py-3 text-right font-medium">{formatCurrencyRs(c.totalSpent)}</td>
                  <td className="px-3 py-3">{formatDateTime(c.createdAt)}</td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td className="px-3 py-10 text-center text-sm text-slate-500" colSpan={6}>
                    No customers match your search.
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

