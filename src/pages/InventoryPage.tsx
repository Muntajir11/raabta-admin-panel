import { useMemo, useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { formatDateTime } from '../lib/format'
import { notify } from '../lib/notify'
import { inventory as mockInventory } from '../mocks/data'

export function InventoryPage() {
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase()
    return mockInventory
      .filter((s) => {
        if (!query) return true
        return (
          s.sku.toLowerCase().includes(query) ||
          s.productId.toLowerCase().includes(query) ||
          s.size.toLowerCase().includes(query) ||
          s.color.toLowerCase().includes(query)
        )
      })
      .slice()
      .sort((a, b) => (a.onHand - a.reserved) - (b.onHand - b.reserved))
  }, [q])

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Track stock by size, color, and GSM. Highlights low stock against reorder points."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => notify.info('Adjust stock (static): coming soon')}
            >
              Adjust stock
            </Button>
            <Button onClick={() => notify.info('Create PO (static): coming soon')}>
              Create PO
            </Button>
          </>
        }
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[240px] flex-1">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search sku/product/size/color…" />
          </div>
          <Button variant="ghost" onClick={() => setQ('')}>
            Clear
          </Button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-3 py-3">SKU</th>
                <th className="px-3 py-3">Variant</th>
                <th className="px-3 py-3 text-right">On hand</th>
                <th className="px-3 py-3 text-right">Reserved</th>
                <th className="px-3 py-3 text-right">Available</th>
                <th className="px-3 py-3 text-right">Reorder</th>
                <th className="px-3 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((s) => {
                const available = s.onHand - s.reserved
                const low = available <= s.reorderPoint
                return (
                  <tr key={s.sku} className="hover:bg-slate-50/60">
                    <td className="px-3 py-3">
                      <div className="font-medium text-slate-900">{s.sku}</div>
                      <div className="text-xs text-slate-500">{s.productId}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge tone="slate">{s.size}</Badge>
                        <Badge tone="slate">{s.color}</Badge>
                        <Badge tone="brand">{s.gsm}gsm</Badge>
                        {low ? <Badge tone="rose">Low</Badge> : <Badge tone="green">OK</Badge>}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">{s.onHand}</td>
                    <td className="px-3 py-3 text-right">{s.reserved}</td>
                    <td className="px-3 py-3 text-right font-medium">{available}</td>
                    <td className="px-3 py-3 text-right">{s.reorderPoint}</td>
                    <td className="px-3 py-3">{formatDateTime(s.updatedAt)}</td>
                  </tr>
                )
              })}
              {rows.length === 0 ? (
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

