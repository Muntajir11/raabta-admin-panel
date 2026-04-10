import type React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { notify } from '../lib/notify'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  )
}

export function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Static settings placeholders. Later we’ll save to backend/admin API."
        actions={<Button onClick={() => notify.error('Save (static): disabled')}>Save changes</Button>}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Store profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Store name">
              <Input defaultValue="Raabta Store" />
            </Field>
            <Field label="Support email">
              <Input defaultValue="support@raabta.store" />
            </Field>
            <Field label="WhatsApp / Phone">
              <Input defaultValue="+91 xxxxx xxxxx" />
            </Field>
            <Field label="Address">
              <Input defaultValue="India" />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shipping</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Default shipping fee (INR)">
              <Input defaultValue="199" inputMode="numeric" />
            </Field>
            <Field label="Free shipping threshold (INR)">
              <Input defaultValue="1499" inputMode="numeric" />
            </Field>
            <Field label="Dispatch SLA (days)">
              <Input defaultValue="2" inputMode="numeric" />
            </Field>
            <div className="text-xs text-slate-600">
              Tip: When we go live, we’ll calculate ETA from order status + production queue.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payments</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="COD enabled">
              <select className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-brand-500">
                <option>Yes</option>
                <option>No</option>
              </select>
            </Field>
            <Field label="Online payments">
              <select className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-brand-500">
                <option>Coming soon</option>
                <option>Disabled</option>
              </select>
            </Field>
            <Field label="Refund policy URL">
              <Input placeholder="https://..." />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team & roles</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              Roles are placeholders:
              <ul className="mt-2 list-disc pl-5 text-xs text-slate-600">
                <li>Owner: everything</li>
                <li>Support: tickets, returns</li>
                <li>Production: designs queue, print status</li>
                <li>Fulfillment: packing, shipped/delivered</li>
              </ul>
            </div>
            <Button
              variant="secondary"
              onClick={() => notify.error('Invite teammate (static): disabled')}
            >
              Invite teammate
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

