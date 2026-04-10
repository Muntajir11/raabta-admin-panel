import { useMemo, useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { formatDateTime } from '../lib/format'
import { notify } from '../lib/notify'
import { tickets } from '../mocks/data'

type TicketStatus = (typeof tickets)[number]['status'] | 'all'

export function SupportReturnsPage() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<TicketStatus>('all')

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase()
    return tickets
      .filter((t) => (status === 'all' ? true : t.status === status))
      .filter((t) => {
        if (!query) return true
        return (
          t.id.toLowerCase().includes(query) ||
          t.customerName.toLowerCase().includes(query) ||
          t.customerEmail.toLowerCase().includes(query) ||
          (t.orderId ?? '').toLowerCase().includes(query) ||
          t.summary.toLowerCase().includes(query)
        )
      })
      .slice()
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  }, [q, status])

  return (
    <div>
      <PageHeader
        title="Support & returns"
        description="Handle delivery issues, custom-print clarifications, and returns/exchanges."
        actions={
          <Button
            variant="secondary"
            onClick={() => notify.info('Reply macros (static): coming soon')}
          >
            Reply macros
          </Button>
        }
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[240px] flex-1">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ticket/order/customer…" />
          </div>
          <label className="text-sm font-medium text-slate-700">
            Status
            <select
              className="ml-2 h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-brand-500"
              value={status}
              onChange={(e) => setStatus(e.target.value as TicketStatus)}
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </label>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-3 py-3">Ticket</th>
                <th className="px-3 py-3">Customer</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Order</th>
                <th className="px-3 py-3">Summary</th>
                <th className="px-3 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/60">
                  <td className="px-3 py-3">
                    <div className="font-medium text-slate-900">{t.id}</div>
                    <div className="text-xs text-slate-500">{formatDateTime(t.createdAt)}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-medium">{t.customerName}</div>
                    <div className="text-xs text-slate-500">{t.customerEmail}</div>
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone="slate">{t.type}</Badge>
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={t.status === 'resolved' ? 'green' : t.status === 'open' ? 'amber' : 'brand'}>
                      {t.status.replaceAll('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">{t.orderId ?? '—'}</td>
                  <td className="px-3 py-3 text-slate-700">{t.summary}</td>
                  <td className="px-3 py-3 text-right">
                    <Button size="sm" onClick={() => notify.info(`Open ticket (static): ${t.id}`)}>
                      Open
                    </Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td className="px-3 py-10 text-center text-sm text-slate-500" colSpan={7}>
                    No tickets match your filters.
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

