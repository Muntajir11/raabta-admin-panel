import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { formatCurrencyRs, formatDateTime } from '../lib/format'
import { notify } from '../lib/notify'
import { apiRequest } from '../lib/api'

type DesignStatus = 'new' | 'reviewed' | 'approved' | 'rejected' | 'printed' | 'all'

type DesignListRow = {
  id: string
  designId: string
  createdAt: string
  customerName: string
  customerEmail: string
  productId: string
  gsm: number
  sides: Array<{ view: string; hasPrint: boolean }>
  prints: number
  status: Exclude<DesignStatus, 'all'>
  totalRs: number
}

type DesignDetail = {
  id: string
  designId: string
  createdAt: string
  updatedAt: string
  status: Exclude<DesignStatus, 'all'>
  adminNote: string
  productId: string
  gsm: number
  size: string
  color: string
  sides: Array<{ view: string; hasPrint: boolean; printSize?: string; guidePositionId?: string }>
  designJson: string
  previewImages: Array<{ view: string; url: string }>
  pricing: { blankRs: number; totalRs: number }
  customerSnapshot: { name: string; email: string }
}

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
  const [rows, setRows] = useState<DesignListRow[]>([])
  const [loading, setLoading] = useState(true)

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [preview, setPreview] = useState<DesignDetail | null>(null)

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      if (status !== 'all') params.set('status', status)
      const qs = params.toString()
      const data = await apiRequest<{ items: DesignListRow[] } & { total: number }>(
        `/api/admin/designs${qs ? `?${qs}` : ''}`
      )
      setRows(data.items)
    } catch (e) {
      notify.error(e instanceof Error ? e.message : 'Failed to load designs')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [q, status])

  useEffect(() => {
    void fetchList()
  }, [fetchList])

  const openPreview = useCallback(async (designId: string) => {
    setPreviewOpen(true)
    setPreview(null)
    setPreviewLoading(true)
    try {
      const data = await apiRequest<DesignDetail>(`/api/admin/designs/${encodeURIComponent(designId)}`)
      setPreview(data)
    } catch (e) {
      notify.error(e instanceof Error ? e.message : 'Failed to load preview')
      setPreviewOpen(false)
    } finally {
      setPreviewLoading(false)
    }
  }, [])

  const approve = useCallback(
    async (designId: string) => {
      try {
        await apiRequest(`/api/admin/designs/${encodeURIComponent(designId)}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'approved' }),
        })
        notify.success(`Approved: ${designId}`)
        await fetchList()
        setPreview((p) => (p && p.designId === designId ? { ...p, status: 'approved' } : p))
      } catch (e) {
        notify.error(e instanceof Error ? e.message : 'Approve failed')
      }
    },
    [fetchList]
  )

  const visible = useMemo(() => rows, [rows])

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

      {previewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="text-sm font-semibold text-slate-900">Preview {preview?.designId || ''}</div>
              <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(false)}>
                Close
              </Button>
            </div>
            <div className="p-4">
              {previewLoading ? (
                <div className="py-10 text-center text-sm text-slate-500">Loading preview…</div>
              ) : !preview ? (
                <div className="py-10 text-center text-sm text-slate-500">No preview.</div>
              ) : (
                <>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-slate-700">
                      <span className="font-medium">{preview.customerSnapshot.name || '—'}</span>{' '}
                      <span className="text-slate-500">{preview.customerSnapshot.email || ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={toneByStatus[preview.status]}>{preview.status}</Badge>
                      <Button
                        size="sm"
                        onClick={() => void approve(preview.designId)}
                        disabled={preview.status === 'approved' || preview.status === 'printed'}
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {preview.previewImages?.length ? (
                      preview.previewImages.map((img, idx) => (
                        <div key={`${img.view}-${idx}`} className="rounded-lg border border-slate-200 p-2">
                          <div className="mb-1 text-xs font-medium text-slate-600">{img.view}</div>
                          <img
                            src={img.url}
                            alt={`${preview.designId} ${img.view}`}
                            className="h-auto w-full rounded-md"
                            loading="lazy"
                          />
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 py-10 text-center text-sm text-slate-500">
                        No preview images yet (will be uploaded after checkout).
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}

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
          <Button variant="secondary" onClick={() => void fetchList()} disabled={loading}>
            Search
          </Button>
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
              {loading ? (
                <tr>
                  <td className="px-3 py-10 text-center text-sm text-slate-500" colSpan={7}>
                    Loading…
                  </td>
                </tr>
              ) : (
                visible.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/60">
                    <td className="px-3 py-3">
                      <div className="font-medium text-slate-900">{d.designId}</div>
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
                        <Badge tone={d.prints > 0 ? 'brand' : 'slate'}>{d.prints} prints</Badge>
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
                          onClick={() => void openPreview(d.designId)}
                        >
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => void approve(d.designId)}
                          disabled={d.status === 'approved' || d.status === 'printed'}
                        >
                          Approve
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              {!loading && visible.length === 0 ? (
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

