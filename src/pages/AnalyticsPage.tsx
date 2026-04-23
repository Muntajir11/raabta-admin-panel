import { Card, CardContent } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'

export function AnalyticsPage() {
  return (
    <div>
      <PageHeader title="Analytics" />
      <Card>
        <CardContent className="flex min-h-[280px] items-center justify-center py-16">
          <div className="text-center">
            <div className="text-lg font-semibold text-slate-900">Coming soon</div>
            <div className="mt-1 text-sm text-slate-600">
              Reporting and insights will show up here.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
