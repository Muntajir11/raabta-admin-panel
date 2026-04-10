import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { formatCurrencyRs } from '../lib/format'
import { orders, products } from '../mocks/data'

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max <= 0 ? 0 : Math.round((value / max) * 100)
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 shrink-0 text-xs font-medium text-slate-600">{label}</div>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-brand-600" style={{ width: `${pct}%` }} />
      </div>
      <div className="w-20 shrink-0 text-right text-xs font-semibold text-slate-700">{value}</div>
    </div>
  )
}

export function AnalyticsPage() {
  const delivered = orders.filter((o) => o.status === 'delivered').length
  const pending = orders.filter((o) => o.status === 'pending').length
  const inProduction = orders.filter((o) => o.status === 'in_production').length
  const revenue = orders.reduce((sum, o) => sum + o.total, 0)
  const avgOrder = orders.length ? Math.round(revenue / orders.length) : 0

  const categoryCounts = products.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1
    return acc
  }, {})
  const categoryRows = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])
  const maxCategory = categoryRows[0]?.[1] ?? 0

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Static reporting view. Later we’ll wire real events and time-series."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Revenue (mock)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatCurrencyRs(revenue)}</div>
            <div className="mt-1 text-xs text-slate-600">From all mock orders</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Average order</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatCurrencyRs(avgOrder)}</div>
            <div className="mt-1 text-xs text-slate-600">Average cart value</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Fulfillment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                Delivered: {delivered}
              </span>
              <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                In production: {inProduction}
              </span>
              <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                Pending: {pending}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Catalog</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{products.length}</div>
            <div className="mt-1 text-xs text-slate-600">Products in mock dataset</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Products by category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {categoryRows.map(([cat, count]) => (
              <Bar key={cat} label={cat} value={count} max={maxCategory} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What we’ll track next</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
              <li>Conversion rate, add-to-cart, checkout drop-off</li>
              <li>Design funnel: started → submitted → approved → printed</li>
              <li>Production SLAs, reprint rate, return reasons</li>
              <li>Top sizes/colors/GSM tiers per category</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

