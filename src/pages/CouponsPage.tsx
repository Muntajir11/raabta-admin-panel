import { useMemo, useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { formatCurrencyRs, formatDateTime } from '../lib/format'
import { notify } from '../lib/notify'
import { coupons as mockCoupons } from '../mocks/data'

export function CouponsPage() {
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase()
    return mockCoupons
      .filter((c) => (!query ? true : c.code.toLowerCase().includes(query)))
      .slice()
      .sort((a, b) => (a.isActive === b.isActive ? a.code.localeCompare(b.code) : a.isActive ? -1 : 1))
  }, [q])

  return (
    <div>
      <PageHeader
        title="Coupons"
        description="Create discount codes for promos, free shipping, and seasonal drops."
        actions={
          <Button onClick={() => notify.error('New coupon (static): disabled')}>
            New coupon
          </Button>
        }
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[240px] flex-1">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by code…" />
          </div>
          <Button variant="ghost" onClick={() => setQ('')}>
            Clear
          </Button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-3 py-3">Code</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Value</th>
                <th className="px-3 py-3">Min order</th>
                <th className="px-3 py-3">Usage</th>
                <th className="px-3 py-3">Active</th>
                <th className="px-3 py-3">Window</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((c) => (
                <tr key={c.code} className="hover:bg-slate-50/60">
                  <td className="px-3 py-3 font-medium text-slate-900">{c.code}</td>
                  <td className="px-3 py-3">
                    <Badge tone="slate">{c.type}</Badge>
                  </td>
                  <td className="px-3 py-3">
                    {c.type === 'percent' ? (
                      <span className="font-medium">{c.value}%</span>
                    ) : (
                      <span className="font-medium">{formatCurrencyRs(c.value)}</span>
                    )}
                  </td>
                  <td className="px-3 py-3">{c.minOrder ? formatCurrencyRs(c.minOrder) : '—'}</td>
                  <td className="px-3 py-3">
                    {c.usedCount}
                    {c.usageLimit ? <span className="text-slate-500"> / {c.usageLimit}</span> : null}
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={c.isActive ? 'green' : 'rose'}>{c.isActive ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-xs text-slate-600">
                      {c.startsAt ? formatDateTime(c.startsAt) : '—'} → {c.endsAt ? formatDateTime(c.endsAt) : '—'}
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td className="px-3 py-10 text-center text-sm text-slate-500" colSpan={7}>
                    No coupons match your search.
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

