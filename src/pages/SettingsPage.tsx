import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { notify } from '../lib/notify'
import { apiRequest } from '../lib/api'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  )
}

type StoreSettings = {
  storeProfile: { supportEmail: string; phone: string; address: string }
  shipping: {
    defaultFeeInr: number
    freeShippingThresholdInr: number
    dispatchSlaDays: number
    originPincode: string
    defaultItemWeightGrams: number
    defaultItemDimsCm: { length: number; width: number; height: number }
    fallbackFeeInr: number
  }
  payments: { codEnabled: boolean; onlinePayments: 'coming_soon' | 'enabled' | 'disabled' }
  updatedAt?: string
}

function toInt(input: string): number {
  const s = String(input ?? '').trim()
  const n = Number(s)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.floor(n))
}

function toFloat(input: string): number {
  const s = String(input ?? '').trim()
  const n = Number(s)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, n)
}

export function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<StoreSettings | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const next = await apiRequest<StoreSettings>('/api/admin/settings')
      setData(next)
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Failed to load settings')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const canSave = useMemo(() => {
    if (!data) return false
    if (!data.storeProfile.supportEmail.trim()) return false
    if (!/^\d{6}$/.test(String(data.shipping.originPincode || '').trim())) return false
    return true
  }, [data])

  const save = useCallback(async () => {
    if (!data) return
    if (!canSave) {
      notify.error('Please fill all required fields')
      return
    }
    setSaving(true)
    try {
      const payload = {
        storeProfile: {
          supportEmail: data.storeProfile.supportEmail.trim(),
          phone: data.storeProfile.phone.trim(),
          address: data.storeProfile.address.trim(),
        },
        shipping: {
          dispatchSlaDays: Math.max(
            0,
            Math.min(60, Math.floor(Number(data.shipping.dispatchSlaDays) || 0))
          ),
          originPincode: String(data.shipping.originPincode || '').trim(),
          defaultItemWeightGrams: Math.max(
            1,
            Math.floor(Number(data.shipping.defaultItemWeightGrams) || 0)
          ),
          defaultItemDimsCm: {
            length: Math.max(0.1, Number(data.shipping.defaultItemDimsCm?.length) || 0),
            width: Math.max(0.1, Number(data.shipping.defaultItemDimsCm?.width) || 0),
            height: Math.max(0.1, Number(data.shipping.defaultItemDimsCm?.height) || 0),
          },
          fallbackFeeInr: Math.max(0, Math.floor(Number(data.shipping.fallbackFeeInr) || 0)),
        },
        payments: {
          codEnabled: !!data.payments.codEnabled,
          onlinePayments: data.payments.onlinePayments,
        },
      }
      const updated = await apiRequest<StoreSettings>('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      setData(updated)
      notify.success('Settings saved')
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }, [canSave, data])

  return (
    <div>
      <PageHeader
        title="Settings"
        description={loading ? 'Loading settings…' : 'Update store settings used across the admin panel.'}
        actions={
          <Button onClick={save} disabled={!data || saving || loading || !canSave}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        }
      />

      {data ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Store profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Support email">
              <Input
                value={data.storeProfile.supportEmail}
                onChange={(e) =>
                  setData((prev) =>
                    prev
                      ? {
                          ...prev,
                          storeProfile: { ...prev.storeProfile, supportEmail: e.target.value },
                        }
                      : prev
                  )
                }
              />
            </Field>
            <Field label="WhatsApp / Phone">
              <Input
                value={data.storeProfile.phone}
                onChange={(e) =>
                  setData((prev) =>
                    prev
                      ? { ...prev, storeProfile: { ...prev.storeProfile, phone: e.target.value } }
                      : prev
                  )
                }
              />
            </Field>
            <Field label="Address">
              <Input
                value={data.storeProfile.address}
                onChange={(e) =>
                  setData((prev) =>
                    prev
                      ? { ...prev, storeProfile: { ...prev.storeProfile, address: e.target.value } }
                      : prev
                  )
                }
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shipping</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Origin / warehouse pincode (6 digits)">
              <Input
                value={String(data.shipping.originPincode || '')}
                inputMode="numeric"
                onChange={(e) =>
                  setData((prev) =>
                    prev
                      ? {
                          ...prev,
                          shipping: { ...prev.shipping, originPincode: e.target.value },
                        }
                      : prev
                  )
                }
              />
            </Field>
            <Field label="Default item weight (grams)">
              <Input
                value={String(data.shipping.defaultItemWeightGrams)}
                inputMode="numeric"
                onChange={(e) =>
                  setData((prev) =>
                    prev
                      ? {
                          ...prev,
                          shipping: {
                            ...prev.shipping,
                            defaultItemWeightGrams: Math.max(1, toInt(e.target.value)),
                          },
                        }
                      : prev
                  )
                }
              />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Box length (cm)">
                <Input
                  value={String(data.shipping.defaultItemDimsCm?.length ?? '')}
                  inputMode="decimal"
                  onChange={(e) =>
                    setData((prev) =>
                      prev
                        ? {
                            ...prev,
                            shipping: {
                              ...prev.shipping,
                              defaultItemDimsCm: {
                                ...prev.shipping.defaultItemDimsCm,
                                length: Math.max(0.1, toFloat(e.target.value)),
                              },
                            },
                          }
                        : prev
                    )
                  }
                />
              </Field>
              <Field label="Box width (cm)">
                <Input
                  value={String(data.shipping.defaultItemDimsCm?.width ?? '')}
                  inputMode="decimal"
                  onChange={(e) =>
                    setData((prev) =>
                      prev
                        ? {
                            ...prev,
                            shipping: {
                              ...prev.shipping,
                              defaultItemDimsCm: {
                                ...prev.shipping.defaultItemDimsCm,
                                width: Math.max(0.1, toFloat(e.target.value)),
                              },
                            },
                          }
                        : prev
                    )
                  }
                />
              </Field>
              <Field label="Box height (cm)">
                <Input
                  value={String(data.shipping.defaultItemDimsCm?.height ?? '')}
                  inputMode="decimal"
                  onChange={(e) =>
                    setData((prev) =>
                      prev
                        ? {
                            ...prev,
                            shipping: {
                              ...prev.shipping,
                              defaultItemDimsCm: {
                                ...prev.shipping.defaultItemDimsCm,
                                height: Math.max(0.1, toFloat(e.target.value)),
                              },
                            },
                          }
                        : prev
                    )
                  }
                />
              </Field>
            </div>
            <Field label="Fallback shipping fee (INR)">
              <Input
                value={String(data.shipping.fallbackFeeInr)}
                inputMode="numeric"
                onChange={(e) =>
                  setData((prev) =>
                    prev
                      ? {
                          ...prev,
                          shipping: { ...prev.shipping, fallbackFeeInr: toInt(e.target.value) },
                        }
                      : prev
                  )
                }
              />
            </Field>
            <div className="text-xs text-slate-600">Used only if Delhivery is unreachable.</div>
            <Field label="Dispatch SLA (days)">
              <Input
                value={String(data.shipping.dispatchSlaDays)}
                inputMode="numeric"
                onChange={(e) =>
                  setData((prev) =>
                    prev
                      ? {
                          ...prev,
                          shipping: { ...prev.shipping, dispatchSlaDays: toInt(e.target.value) },
                        }
                      : prev
                  )
                }
              />
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
              <select
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-brand-500"
                value={data.payments.codEnabled ? 'yes' : 'no'}
                onChange={(e) =>
                  setData((prev) =>
                    prev
                      ? {
                          ...prev,
                          payments: { ...prev.payments, codEnabled: e.target.value === 'yes' },
                        }
                      : prev
                  )
                }
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </Field>
            <Field label="Online payments">
              <select
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-brand-500"
                value={data.payments.onlinePayments}
                onChange={(e) =>
                  setData((prev) =>
                    prev
                      ? {
                          ...prev,
                          payments: {
                            ...prev.payments,
                            onlinePayments: e.target.value as StoreSettings['payments']['onlinePayments'],
                          },
                        }
                      : prev
                  )
                }
              >
                <option value="coming_soon">Coming soon</option>
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </select>
            </Field>
          </CardContent>
        </Card>
      </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          <div className="font-medium text-slate-900">Settings unavailable</div>
          <div className="mt-1">
            {loading ? 'Loading…' : 'Could not load settings. Please refresh or try again later.'}
          </div>
          <div className="mt-4">
            <Button variant="secondary" onClick={load} disabled={loading}>
              Retry
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

