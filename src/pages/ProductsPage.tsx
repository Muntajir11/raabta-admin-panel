import { useMemo, useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { formatCurrencyRs } from '../lib/format'
import { notify } from '../lib/notify'
import { products as mockProducts } from '../mocks/data'

export function ProductsPage() {
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase()
    return mockProducts.filter((p) => {
      if (!query) return true
      return (
        p.productId.toLowerCase().includes(query) ||
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      )
    })
  }, [q])

  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage catalog items, sizes, colors, and GSM pricing tiers."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => notify.info('Import (static): coming soon')}
            >
              Import
            </Button>
            <Button onClick={() => notify.error('Add product (static): disabled')}>
              Add product
            </Button>
          </>
        }
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[240px] flex-1">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by id/name/category…" />
          </div>
          <Button variant="ghost" onClick={() => setQ('')}>
            Clear
          </Button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-3 py-3">Product</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Active</th>
                <th className="px-3 py-3">Sizes</th>
                <th className="px-3 py-3">Colors</th>
                <th className="px-3 py-3">GSM tiers</th>
                <th className="px-3 py-3 text-right">Base</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((p) => (
                <tr key={p.productId} className="hover:bg-slate-50/60">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image}
                        alt=""
                        className="h-10 w-10 rounded-lg border border-slate-200 object-cover"
                        loading="lazy"
                      />
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900">{p.name}</div>
                        <div className="text-xs text-slate-500">{p.productId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone="slate">{p.category}</Badge>
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={p.isActive ? 'green' : 'rose'}>{p.isActive ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-3 py-3">
                    <div className="max-w-[220px] truncate text-slate-700">{p.sizes.join(', ')}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="max-w-[220px] truncate text-slate-700">{p.colors.join(', ')}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      {p.gsmOptions.map((g) => (
                        <Badge key={g.gsm} tone={g.isActive === false ? 'rose' : 'brand'}>
                          {g.gsm}gsm · {formatCurrencyRs(g.price)}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-medium">{formatCurrencyRs(p.basePrice)}</td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td className="px-3 py-10 text-center text-sm text-slate-500" colSpan={7}>
                    No products match your search.
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

