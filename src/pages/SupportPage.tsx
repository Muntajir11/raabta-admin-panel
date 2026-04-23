import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { formatDateTime } from '../lib/format'
import { notify } from '../lib/notify'
import { apiRequest } from '../lib/api'

type TicketStatus = 'open' | 'resolved'

type TicketRow = {
  id: string
  name: string
  email: string
  phone: string
  status: TicketStatus
  createdAt: string
  resolvedAt?: string | null
}

type TicketDetail = TicketRow & {
  message: string
  meta?: { ip?: string; userAgent?: string } | null
}

const statusTones: Record<TicketStatus, Parameters<typeof Badge>[0]['tone']> = {
  open: 'amber',
  resolved: 'green',
}

export function SupportPage() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<TicketStatus | 'all'>('all')
  const [rows, setRows] = useState<TicketRow[]>([])
  const [loading, setLoading] = useState(true)

  const [activeId, setActiveId] = useState<string | null>(null)
  const [active, setActive] = useState<TicketDetail | null>(null)
  const [updating, setUpdating] = useState(false)

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((r) => {
      return (
        r.name.toLowerCase().includes(needle) ||
        r.email.toLowerCase().includes(needle) ||
        r.phone.toLowerCase().includes(needle)
      )
    })
  }, [q, rows])

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (status !== 'all') params.set('status', status)
      const qs = params.toString()
      const data = await apiRequest<{ items: TicketRow[] }>(`/api/admin/support/tickets${qs ? `?${qs}` : ''}`)
      setRows(data.items)
    } catch (e) {
      notify.error(e instanceof Error ? e.message : 'Failed to load support tickets')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [status])

  const fetchOne = useCallback(async (ticketId: string) => {
    try {
      const data = await apiRequest<{ ticket: TicketDetail }>(`/api/admin/support/tickets/${ticketId}`)
      setActive(data.ticket)
    } catch (e) {
      notify.error(e instanceof Error ? e.message : 'Failed to load ticket')
      setActive(null)
    }
  }, [])

  useEffect(() => {
    void fetchList()
  }, [fetchList])

  useEffect(() => {
    if (!activeId) {
      setActive(null)
      return
    }
    void fetchOne(activeId)
  }, [activeId, fetchOne])

  const toggleResolved = async () => {
    if (!active) return
    const nextStatus: TicketStatus = active.status === 'resolved' ? 'open' : 'resolved'
    setUpdating(true)
    try {
      const data = await apiRequest<{ ticket: TicketRow }>(`/api/admin/support/tickets/${active.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      })
      const updated = data.ticket
      setRows((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)))
      setActive((prev) => (prev ? { ...prev, ...updated, status: updated.status } : prev))
      notify.success(nextStatus === 'resolved' ? 'Marked as resolved' : 'Reopened')
    } catch (e) {
      notify.error(e instanceof Error ? e.message : 'Failed to update ticket')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Support"
        description="Customer queries submitted from the Contact Us form."
        actions={
          <Button variant="secondary" onClick={() => void fetchList()} disabled={loading}>
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.9fr]">
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-[240px] flex-1">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name/email/phone…" />
            </div>
            <label className="text-sm font-medium text-slate-700">
              Status
              <select
                className="ml-2 h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-brand-500"
                value={status}
                onChange={(e) => setStatus(e.target.value as TicketStatus | 'all')}
              >
                <option value="all">All</option>
                <option value="open">Open</option>
                <option value="resolved">Resolved</option>
              </select>
            </label>
          </div>

          <div className="mt-4 overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="px-3 py-2 font-semibold">Customer</th>
                  <th className="px-3 py-2 font-semibold">Email</th>
                  <th className="px-3 py-2 font-semibold">Phone</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-3 py-4 text-slate-600" colSpan={5}>
                      Loading…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td className="px-3 py-4 text-slate-600" colSpan={5}>
                      No tickets found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr
                      key={r.id}
                      className={`border-b border-slate-100 hover:bg-slate-50 ${activeId === r.id ? 'bg-slate-50' : ''}`}
                    >
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          className="font-semibold text-slate-900 hover:underline"
                          onClick={() => setActiveId(r.id)}
                        >
                          {r.name}
                        </button>
                      </td>
                      <td className="px-3 py-2 text-slate-700">{r.email}</td>
                      <td className="px-3 py-2 text-slate-700">{r.phone}</td>
                      <td className="px-3 py-2">
                        <Badge tone={statusTones[r.status]}>{r.status}</Badge>
                      </td>
                      <td className="px-3 py-2 text-slate-700">{formatDateTime(r.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-4">
          {!active ? (
            <div className="text-sm text-slate-600">Select a ticket to view details.</div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-base font-semibold text-slate-900">{active.name}</div>
                  <div className="mt-0.5 text-sm text-slate-600">{active.email}</div>
                  <div className="text-sm text-slate-600">{active.phone}</div>
                </div>
                <Badge tone={statusTones[active.status]} className="capitalize">
                  {active.status}
                </Badge>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800">
                <div className="font-semibold text-slate-900">Message</div>
                <div className="mt-1 whitespace-pre-wrap">{active.message}</div>
              </div>

              <div className="text-xs text-slate-600">
                Created: <span className="font-medium text-slate-700">{formatDateTime(active.createdAt)}</span>
                {active.resolvedAt ? (
                  <>
                    {' '}
                    • Resolved:{' '}
                    <span className="font-medium text-slate-700">{formatDateTime(active.resolvedAt)}</span>
                  </>
                ) : null}
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button variant="secondary" onClick={toggleResolved} disabled={updating}>
                  {active.status === 'resolved' ? 'Mark as open' : 'Mark as resolved'}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

