import { useMemo, useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { formatCurrencyRs, formatDateTime } from '../lib/format'
import { notify } from '../lib/notify'
import { designs as mockDesigns } from '../mocks/data'
import type { CustomDesign } from '../mocks/types'

type DesignStatus = CustomDesign['status'] | 'all'

const toneByStatus: Record<Exclude<DesignStatus, 'all'>, Parameters<typeof Badge>[0]['tone']> = {
  new: 'amber',
  reviewed: 'brand',
  approved: 'green',
  rejected: 'rose',
  printed: 'green',
}

export function DesignsPage() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<DesignStatus>('all')

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase()
    return mockDesigns
      .filter((d) => (status === 'all' ? true : d.status === status))
      .filter((d) => {
        if (!query) return true
        return (
          d.id.toLowerCase().includes(query) ||
          d.customerName.toLowerCase().includes(query) ||
          d.customerEmail.toLowerCase().includes(query) ||
          d.productId.toLowerCase().includes(query)
        )
      })
      .slice()
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  }, [q, status])

  return (
    <div>
      <PageHeader
        title="Custom designs"
        description="Review and approve customer-submitted designs before printing."
        actions={
          <Button
            variant="secondary"
            onClick={() => notify.info('Bulk actions (static): coming soon')}
          >
            Bulk actions
          </Button>
        }
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[240px] flex-1">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by design/customer/product…" />
          </div>
          <label className="text-sm font-medium text-slate-700">
            Status
            <select
              className="ml-2 h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-brand-500"
              value={status}
              onChange={(e) => setStatus(e.target.value as DesignStatus)}
            >
              <option value="all">All</option>
              <option value="new">New</option>
              <option value="reviewed">Reviewed</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="printed">Printed</option>
            </select>
          </label>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-3 py-3">Design</th>
                <th className="px-3 py-3">Customer</th>
                <th className="px-3 py-3">Product</th>
                <th className="px-3 py-3">Prints</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Total</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((d) => {
                const prints = d.sides.filter((s) => s.hasPrint).length
                const layers = Object.values(d.layersByView).reduce((n, v) => n + v.length, 0)
                return (
                  <tr key={d.id} className="hover:bg-slate-50/60">
                    <td className="px-3 py-3">
                      <div className="font-medium text-slate-900">{d.id}</div>
                      <div className="text-xs text-slate-500">{formatDateTime(d.createdAt)}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium">{d.customerName}</div>
                      <div className="text-xs text-slate-500">{d.customerEmail}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium">{d.productId}</div>
                      <div className="text-xs text-slate-500">{d.gsm}gsm</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge tone={prints > 0 ? 'brand' : 'slate'}>{prints} prints</Badge>
                        <Badge tone="slate">{layers} layers</Badge>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={toneByStatus[d.status]}>{d.status}</Badge>
                    </td>
                    <td className="px-3 py-3 text-right font-medium">{formatCurrencyRs(d.totalRs)}</td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => notify.info(`Preview (static): ${d.id}`)}
                        >
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => notify.success(`Approved (static): ${d.id}`)}
                          disabled={d.status === 'approved' || d.status === 'printed'}
                        >
                          Approve
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {rows.length === 0 ? (
                <tr>
                  <td className="px-3 py-10 text-center text-sm text-slate-500" colSpan={7}>
                    No designs match your filters.
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

