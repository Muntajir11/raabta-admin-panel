import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'

export function CouponsPage() {
  return (
    <div>
      <PageHeader
        title="Coupons"
        description="Coupons are coming soon. This section will be enabled once the backend rules engine is ready."
        actions={
          <Button variant="secondary" disabled>
            Coming soon
          </Button>
        }
      />

      <Card className="p-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <div className="font-semibold text-slate-900">Coming soon</div>
          <div className="mt-1 text-slate-600">
            We’ll enable coupons once discount validation, usage limits, and order-level application are implemented on the backend.
          </div>
        </div>
      </Card>
    </div>
  )
}

