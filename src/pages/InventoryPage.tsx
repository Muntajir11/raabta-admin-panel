import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { formatDateTime } from '../lib/format'
import { notify } from '../lib/notify'
import { apiRequest } from '../lib/api'

type InventoryVariantRow = {
  sku: string
  productId: string
  size: string
  color: string
  gsm: number
  baseQty: number
  adjustmentsQty: number
  onHand: number
  reserved: number
  available: number
  reorderPoint: number
  low: boolean
  updatedAt: string
}

type InventoryProductRow = {
  productId: string
  name: string
  category: string
  updatedAt: string
  totalVariants: number
  totalOnHand: number
  totalReserved: number
  totalAvailable: number
  lowVariantsCount: number
  variants: InventoryVariantRow[]
}

type AdjustReason = 'manual' | 'received' | 'damage' | 'correction' | 'order' | 'refund' | 'cancel'

export function InventoryPage() {
  const [q, setQ] = useState('')
  const [lowOnly, setLowOnly] = useState(false)
  const [rows, setRows] = useState<InventoryProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const [adjustOpen, setAdjustOpen] = useState(false)
  const [adjusting, setAdjusting] = useState(false)
  const [adjustTarget, setAdjustTarget] = useState<InventoryVariantRow | null>(null)
  const [delta, setDelta] = useState<number>(0)
  const [reason, setReason] = useState<AdjustReason>('manual')
  const [note, setNote] = useState('')

  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyItems, setHistoryItems] = useState<
    Array<{ id: string; createdAt: string; delta: number; reason: string; note: string }>
  >([])

  const fetchList = useCallback(async (search: string, low: boolean) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set('q', search.trim())
      if (low) params.set('lowOnly', 'true')
      const qs = params.toString()
      const data = await apiRequest<{ items: InventoryProductRow[] }>(
        `/api/admin/inventory/products${qs ? `?${qs}` : ''}`
      )
      setRows(data.items)
    } catch (e) {
      notify.error(e instanceof Error ? e.message : 'Failed to load inventory')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchList('', false)
  }, [fetchList])

  const visibleRows = useMemo(() => rows, [rows])

  useEffect(() => {
    void fetchList(q, lowOnly)
  }, [fetchList, lowOnly])

  useEffect(() => {
    if (q.trim() !== '') return
    void fetchList('', lowOnly)
  }, [fetchList, lowOnly, q])

  const openAdjust = (v: InventoryVariantRow) => {
    setAdjustTarget(v)
    setDelta(0)
    setReason('manual')
    setNote('')
    setAdjustOpen(true)
  }

  const submitAdjust = async () => {
    if (!adjustTarget) return
    if (!Number.isFinite(delta) || delta === 0) {
      notify.error('Enter a non-zero delta')
      return
    }
    setAdjusting(true)
    try {
      await apiRequest('/api/admin/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify({
          productId: adjustTarget.productId,
          size: adjustTarget.size,
          color: adjustTarget.color,
          gsm: adjustTarget.gsm,
          delta,
          reason,
          note,
        }),
      })
      notify.success('Stock updated')
      setAdjustOpen(false)
      await fetchList(q, lowOnly)
    } catch (e) {
      notify.error(e instanceof Error ? e.message : 'Adjust failed')
    } finally {
      setAdjusting(false)
    }
  }

  const openHistory = async (v: InventoryVariantRow) => {
    setHistoryOpen(true)
    setHistoryItems([])
    setHistoryLoading(true)
    try {
      const params = new URLSearchParams({
        productId: v.productId,
        size: v.size,
        color: v.color,
        gsm: String(v.gsm),
        limit: '80',
      })
      const data = await apiRequest<{ items: Array<{ id: string; createdAt: string; delta: number; reason: string; note: string }> }>(
        `/api/admin/inventory/history?${params.toString()}`
      )
      setHistoryItems(data.items)
    } catch (e) {
      notify.error(e instanceof Error ? e.message : 'Failed to load history')
      setHistoryOpen(false)
    } finally {
      setHistoryLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Stock overview by product, with variant-level adjustments and history."
        actions={null}
      />

      {adjustOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="text-sm font-semibold text-slate-900">Adjust stock</div>
              <Button variant="ghost" size="sm" onClick={() => setAdjustOpen(false)} disabled={adjusting}>
                Close
              </Button>
            </div>
            <div className="p-4">
              {!adjustTarget ? (
                <div className="py-10 text-center text-sm text-slate-500">No variant selected.</div>
              ) : (
                <>
                  <div className="mb-3 text-sm text-slate-700">
                    <div className="font-medium text-slate-900">{adjustTarget.productId}</div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <Badge tone="slate">{adjustTarget.size}</Badge>
                      <Badge tone="slate">{adjustTarget.color}</Badge>
                      <Badge tone="brand">{adjustTarget.gsm}gsm</Badge>
                    </div>
                    <div className="mt-2 text-xs text-slate-600">
                      Before: <span className="font-medium">{adjustTarget.onHand}</span> → After:{' '}
                      <span className="font-medium">{Math.max(0, adjustTarget.onHand + delta)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="text-sm font-medium text-slate-700">
                      Delta (+/-)
                      <input
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-brand-500"
                        type="number"
                        value={delta}
                        onChange={(e) => setDelta(Number(e.target.value))}
                        disabled={adjusting}
                      />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Reason
                      <select
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-brand-500"
                        value={reason}
                        onChange={(e) => setReason(e.target.value as AdjustReason)}
                        disabled={adjusting}
                      >
                        <option value="manual">Manual</option>
                        <option value="received">Received</option>
                        <option value="damage">Damage</option>
                        <option value="correction">Correction</option>
                        <option value="cancel">Cancel</option>
                        <option value="refund">Refund</option>
                        <option value="order">Order</option>
                      </select>
                    </label>
                    <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                      Note (optional)
                      <input
                        className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-brand-500"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        disabled={adjusting}
                        maxLength={500}
                      />
                    </label>
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setAdjustOpen(false)} disabled={adjusting}>
                      Cancel
                    </Button>
                    <Button onClick={() => void submitAdjust()} disabled={adjusting}>
                      {adjusting ? 'Saving…' : 'Save'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {historyOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="text-sm font-semibold text-slate-900">Stock history</div>
              <Button variant="ghost" size="sm" onClick={() => setHistoryOpen(false)} disabled={historyLoading}>
                Close
              </Button>
            </div>
            <div className="p-4">
              {historyLoading ? (
                <div className="py-10 text-center text-sm text-slate-500">Loading…</div>
              ) : historyItems.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-500">No adjustments yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                      <tr>
                        <th className="px-3 py-3">When</th>
                        <th className="px-3 py-3 text-right">Delta</th>
                        <th className="px-3 py-3">Reason</th>
                        <th className="px-3 py-3">Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {historyItems.map((h) => (
                        <tr key={h.id}>
                          <td className="px-3 py-3 whitespace-nowrap">{formatDateTime(h.createdAt)}</td>
                          <td className="px-3 py-3 text-right font-medium">{h.delta}</td>
                          <td className="px-3 py-3">{h.reason}</td>
                          <td className="px-3 py-3">{h.note || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[240px] flex-1">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search product id/name/category…" />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={lowOnly}
              onChange={(e) => setLowOnly(e.target.checked)}
              disabled={loading}
            />
            Low stock only
          </label>
          <Button variant="ghost" onClick={() => setQ('')} disabled={loading}>
            Clear
          </Button>
          <Button variant="secondary" onClick={() => void fetchList(q, lowOnly)} disabled={loading}>
            Search
          </Button>
          {lowOnly ? (
            <span className="text-xs font-medium text-rose-600">Showing low stock only</span>
          ) : null}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-3 py-3">Product</th>
                <th className="px-3 py-3 text-right">Variants</th>
                <th className="px-3 py-3 text-right">On hand</th>
                <th className="px-3 py-3 text-right">Reserved</th>
                <th className="px-3 py-3 text-right">Available</th>
                <th className="px-3 py-3 text-right">Low</th>
                <th className="px-3 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td className="px-3 py-10 text-center text-sm text-slate-500" colSpan={7}>
                    Loading…
                  </td>
                </tr>
              ) : visibleRows.map((p) => {
                const isOpen = Boolean(expanded[p.productId])
                return (
                  <>
                    <tr key={p.productId} className="hover:bg-slate-50/60">
                      <td className="px-3 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium text-slate-900">{p.productId}</div>
                            <div className="text-xs text-slate-500">
                              {p.name} · {p.category}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              setExpanded((prev) => ({ ...prev, [p.productId]: !Boolean(prev[p.productId]) }))
                            }
                          >
                            {isOpen ? 'Hide' : 'View'}
                          </Button>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">{p.totalVariants}</td>
                      <td className="px-3 py-3 text-right">{p.totalOnHand}</td>
                      <td className="px-3 py-3 text-right">{p.totalReserved}</td>
                      <td className="px-3 py-3 text-right font-medium">{p.totalAvailable}</td>
                      <td className="px-3 py-3 text-right">
                        {p.lowVariantsCount > 0 ? <Badge tone="rose">{p.lowVariantsCount}</Badge> : <Badge tone="green">0</Badge>}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">{formatDateTime(p.updatedAt)}</td>
                    </tr>
                    {isOpen ? (
                      <tr key={`${p.productId}-variants`}>
                        <td className="px-3 pb-5 pt-2" colSpan={7}>
                          <div className="overflow-x-auto rounded-lg border border-slate-200">
                            {([180, 210, 240] as const).map((gsm) => {
                              const group = p.variants.filter((v) => v.gsm === gsm)
                              if (group.length === 0) return null
                              return (
                                <div key={`${p.productId}-gsm-${gsm}`} className="border-b border-slate-200 last:border-b-0">
                                  <div className="flex items-center justify-between bg-slate-50 px-3 py-2">
                                    <div className="text-xs font-semibold text-slate-700">{gsm} GSM</div>
                                    <div className="text-xs text-slate-500">
                                      Variants: {group.length} · Low: {group.filter((v) => v.low).length}
                                    </div>
                                  </div>
                                  <table className="w-full min-w-[980px] text-left text-sm">
                                    <thead className="bg-white text-xs font-semibold text-slate-600">
                                      <tr>
                                        <th className="px-3 py-3">Variant</th>
                                        <th className="px-3 py-3 text-right">Base</th>
                                        <th className="px-3 py-3 text-right">Adj</th>
                                        <th className="px-3 py-3 text-right">On hand</th>
                                        <th className="px-3 py-3 text-right">Reserved</th>
                                        <th className="px-3 py-3 text-right">Available</th>
                                        <th className="px-3 py-3 text-right">Reorder</th>
                                        <th className="px-3 py-3">Updated</th>
                                        <th className="px-3 py-3 text-right">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {group.map((v) => (
                                        <tr key={v.sku} className="hover:bg-slate-50/60">
                                          <td className="px-3 py-3">
                                            <div className="flex flex-wrap gap-2">
                                              <Badge tone="slate">{v.size}</Badge>
                                              <Badge tone="slate">{v.color}</Badge>
                                              {v.low ? <Badge tone="rose">Low</Badge> : <Badge tone="green">OK</Badge>}
                                            </div>
                                            <div className="mt-1 text-xs text-slate-500">{v.sku}</div>
                                          </td>
                                          <td className="px-3 py-3 text-right">{v.baseQty}</td>
                                          <td className="px-3 py-3 text-right">{v.adjustmentsQty}</td>
                                          <td className="px-3 py-3 text-right font-medium">{v.onHand}</td>
                                          <td className="px-3 py-3 text-right">{v.reserved}</td>
                                          <td className="px-3 py-3 text-right font-medium">{v.available}</td>
                                          <td className="px-3 py-3 text-right">{v.reorderPoint}</td>
                                          <td className="px-3 py-3 whitespace-nowrap">{formatDateTime(v.updatedAt)}</td>
                                          <td className="px-3 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                              <Button size="sm" variant="secondary" onClick={() => openAdjust(v)}>
                                                Adjust
                                              </Button>
                                              <Button size="sm" variant="ghost" onClick={() => void openHistory(v)}>
                                                History
                                              </Button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )
                            })}
                            {p.variants.length === 0 ? (
                              <div className="px-3 py-10 text-center text-sm text-slate-500">No variants on this product yet.</div>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </>
                )
              })}
              {!loading && visibleRows.length === 0 ? (
                <tr>
                  <td className="px-3 py-10 text-center text-sm text-slate-500" colSpan={7}>
                    No inventory rows match your search.
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

