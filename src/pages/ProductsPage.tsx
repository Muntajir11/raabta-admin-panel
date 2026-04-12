import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { cn } from '../components/ui/cn'
import { formatCurrencyRs } from '../lib/format'
import { notify } from '../lib/notify'
import { apiRequest, getApiBaseUrl, resolveMediaUrl } from '../lib/api'
import {
  PRODUCT_SECTIONS,
  type ProductSection,
  normalizeCategoryForForm,
  displayCategoryLabel,
} from '../constants/productSections'

export type AdminProductRow = {
  productId: string
  name: string
  description: string
  brand: string
  rating: number | null
  features: string[]
  basePrice: number
  image: string
  category: string
  sizes: string[]
  colors: string[]
  gsmOptions: Array<{ gsm: number; price: number; isActive?: boolean }>
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

const defaultSizes = 'XS,S,M,L,XL,XXL,XXXL'
const defaultColors = 'Black,White'

const GSM_VALUES = [180, 210, 240] as const
type GsmChoice = (typeof GSM_VALUES)[number]

type GsmTierFormRow = { gsm: GsmChoice; price: string; isActive: boolean }

function defaultGsmRow(gsm: GsmChoice = 180): GsmTierFormRow {
  return { gsm, price: '', isActive: true }
}

function gsmOptionsToRows(opts: AdminProductRow['gsmOptions']): GsmTierFormRow[] {
  if (!opts?.length) return []
  return opts.map((o) => {
    const gsm = o.gsm === 210 || o.gsm === 240 ? o.gsm : 180
    return {
      gsm,
      price: String(o.price ?? ''),
      isActive: o.isActive !== false,
    }
  })
}

function rowsToGsmPayload(rows: GsmTierFormRow[]): AdminProductRow['gsmOptions'] | undefined {
  if (!rows.length) return undefined
  return rows.map((r) => ({
    gsm: r.gsm,
    price: Number(r.price),
    isActive: r.isActive,
  }))
}

function validateGsmRows(rows: GsmTierFormRow[]): string | null {
  if (!rows.length) return null
  for (const r of rows) {
    if (r.price.trim() === '') return 'Enter a price for each GSM tier, or remove empty rows'
    const p = Number(r.price)
    if (!Number.isFinite(p) || p < 0) return 'Enter a valid price (≥ 0) for each tier'
  }
  const gsms = rows.map((r) => r.gsm)
  if (new Set(gsms).size !== gsms.length) return 'Each GSM tier (180 / 210 / 240) must be unique'
  return null
}

type ProductFormState = {
  productId: string
  name: string
  category: ProductSection
  description: string
  brand: string
  rating: string | number | ''
  featuresText: string
  basePrice: string | number | ''
  sizes: string
  colors: string
  gsmRows: GsmTierFormRow[]
  imageUrl: string
  isActive: boolean
}

function emptyForm(): ProductFormState {
  return {
    productId: '',
    name: '',
    category: PRODUCT_SECTIONS[0],
    description: '',
    brand: 'Raabta',
    rating: '' as string | number | '',
    featuresText: '',
    basePrice: '' as string | number | '',
    sizes: defaultSizes,
    colors: defaultColors,
    gsmRows: [],
    imageUrl: '',
    isActive: true,
  }
}

function StoreStatusControl({
  isActive,
  disabled,
  onSet,
}: {
  isActive: boolean
  disabled?: boolean
  onSet: (next: boolean) => void
}) {
  return (
    <div
      className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-medium shadow-sm"
      role="group"
      aria-label="Store visibility"
    >
      <button
        type="button"
        disabled={disabled}
        className={cn(
          'rounded-md px-2.5 py-1 transition',
          isActive ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'
        )}
        onClick={() => onSet(true)}
      >
        Live
      </button>
      <button
        type="button"
        disabled={disabled}
        className={cn(
          'rounded-md px-2.5 py-1 transition',
          !isActive ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-slate-50'
        )}
        onClick={() => onSet(false)}
      >
        Hidden
      </button>
    </div>
  )
}

export function ProductsPage() {
  const [q, setQ] = useState('')
  const [section, setSection] = useState('')
  const [rows, setRows] = useState<AdminProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductFormState>(emptyForm())
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeSavingId, setActiveSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [productToDelete, setProductToDelete] = useState<AdminProductRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      if (section.trim()) params.set('section', section.trim())
      const qs = params.toString()
      const data = await apiRequest<{ items: AdminProductRow[] }>(
        `/api/admin/products${qs ? `?${qs}` : ''}`
      )
      setRows(data.items)
    } catch (e) {
      notify.error(e instanceof Error ? e.message : 'Failed to load products')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [q, section])

  useEffect(() => {
    void load()
    // Initial fetch only; use Refresh / Apply filters to reload with new search params.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => rows, [rows])

  function openCreate() {
    setEditId(null)
    setForm(emptyForm())
    setFile(null)
    setModalOpen(true)
  }

  async function openEdit(productId: string) {
    try {
      const row = await apiRequest<AdminProductRow>(`/api/admin/products/${encodeURIComponent(productId)}`)
      const category = normalizeCategoryForForm(row.category)
      setEditId(productId)
      setForm({
        productId: row.productId,
        name: row.name,
        category,
        description: row.description || '',
        brand: row.brand || 'Raabta',
        rating: row.rating ?? '',
        featuresText: (row.features || []).join('\n'),
        basePrice: row.basePrice,
        sizes: (row.sizes || []).join(','),
        colors: (row.colors || []).join(','),
        gsmRows: gsmOptionsToRows(row.gsmOptions || []),
        imageUrl: row.image?.startsWith('http') ? row.image : resolveMediaUrl(row.image),
        isActive: row.isActive,
      })
      setFile(null)
      setModalOpen(true)
    } catch (e) {
      notify.error(e instanceof Error ? e.message : 'Failed to load product')
    }
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const basePrice = Number(form.basePrice)
      if (!Number.isFinite(basePrice) || basePrice < 0) {
        notify.error('Invalid base price')
        return
      }
      const gsmErr = validateGsmRows(form.gsmRows)
      if (gsmErr) {
        notify.error(gsmErr)
        return
      }
      const gsmPayload = rowsToGsmPayload(form.gsmRows)
      const gsmOptionsJson = gsmPayload ? JSON.stringify(gsmPayload) : ''

      if (editId) {
        const body: Record<string, unknown> = {
          name: form.name.trim(),
          category: form.category,
          description: form.description,
          brand: form.brand.trim(),
          basePrice,
          sizes: form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
          colors: form.colors.split(',').map((s) => s.trim()).filter(Boolean),
          isActive: form.isActive,
        }
        if (form.rating !== '' && form.rating != null) {
          body.rating = Number(form.rating)
        } else {
          body.rating = null
        }
        body.features = form.featuresText
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean)
        if (gsmPayload) body.gsmOptions = gsmPayload
        if (file) {
          const fd = new FormData()
          fd.append('name', form.name.trim())
          fd.append('category', form.category)
          fd.append('description', form.description)
          fd.append('brand', form.brand.trim())
          fd.append('basePrice', String(basePrice))
          if (form.rating !== '' && form.rating != null) fd.append('rating', String(form.rating))
          fd.append('features', form.featuresText)
          fd.append('sizes', form.sizes)
          fd.append('colors', form.colors)
          if (gsmOptionsJson) fd.append('gsmOptionsJson', gsmOptionsJson)
          fd.append('isActive', form.isActive ? 'true' : 'false')
          fd.append('image', file)
          await apiRequest(`/api/admin/products/${encodeURIComponent(editId)}`, { method: 'PATCH', body: fd })
        } else {
          await apiRequest(`/api/admin/products/${encodeURIComponent(editId)}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
          })
        }
        notify.info('Product updated')
      } else {
        if (!file && !form.imageUrl.trim()) {
          notify.error('Add a product image file or an image URL')
          return
        }
        const fd = new FormData()
        fd.append('name', form.name.trim())
        fd.append('category', form.category)
        fd.append('basePrice', String(basePrice))
        fd.append('description', form.description)
        fd.append('brand', form.brand.trim())
        if (form.rating !== '' && form.rating != null) fd.append('rating', String(form.rating))
        fd.append('features', form.featuresText)
        fd.append('sizes', form.sizes)
        fd.append('colors', form.colors)
        if (gsmOptionsJson) fd.append('gsmOptionsJson', gsmOptionsJson)
        fd.append('isActive', form.isActive ? 'true' : 'false')
        if (file) fd.append('image', file)
        if (form.imageUrl.trim()) fd.append('imageUrl', form.imageUrl.trim())
        await apiRequest('/api/admin/products', { method: 'POST', body: fd })
        notify.info('Product created')
      }
      setModalOpen(false)
      await load()
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  function openDeleteDialog(p: AdminProductRow) {
    setProductToDelete(p)
  }

  async function confirmDeleteProduct() {
    const p = productToDelete
    if (!p) return
    setDeletingId(p.productId)
    try {
      await apiRequest(`/api/admin/products/${encodeURIComponent(p.productId)}`, { method: 'DELETE' })
      notify.info('Product deleted')
      setProductToDelete(null)
      await load()
    } catch (e) {
      notify.error(e instanceof Error ? e.message : 'Could not delete product')
    } finally {
      setDeletingId(null)
    }
  }

  async function setProductActive(productId: string, next: boolean, current: boolean) {
    if (next === current) return
    setActiveSavingId(productId)
    try {
      await apiRequest(`/api/admin/products/${encodeURIComponent(productId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: next }),
      })
      notify.info(next ? 'Product is live on the store' : 'Product hidden from the store')
      await load()
    } catch (e) {
      notify.error(e instanceof Error ? e.message : 'Could not update visibility')
    } finally {
      setActiveSavingId(null)
    }
  }

  function addGsmRow() {
    setForm((f) => {
      if (f.gsmRows.length >= 3) return f
      const used = new Set(f.gsmRows.map((r) => r.gsm))
      const nextGsm = GSM_VALUES.find((g) => !used.has(g)) ?? 180
      return { ...f, gsmRows: [...f.gsmRows, defaultGsmRow(nextGsm)] }
    })
  }

  function removeGsmRow(index: number) {
    setForm((f) => ({ ...f, gsmRows: f.gsmRows.filter((_, i) => i !== index) }))
  }

  function updateGsmRow(index: number, patch: Partial<GsmTierFormRow>) {
    setForm((f) => ({
      ...f,
      gsmRows: f.gsmRows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }))
  }

  return (
    <div>
      <PageHeader
        title="Products"
        description={`Manage catalog: sections, pricing tiers, and images. API: ${getApiBaseUrl()}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => void load()} disabled={loading}>
              Refresh
            </Button>
            <Button onClick={openCreate}>Add product</Button>
          </>
        }
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-600">Search</label>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="id / name / category" />
          </div>
          <div className="min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-slate-600">Section</label>
            <select
              className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              value={section}
              onChange={(e) => setSection(e.target.value)}
            >
              <option value="">All</option>
              {PRODUCT_SECTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              void load()
            }}
          >
            Apply filters
          </Button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-3 py-3">Product</th>
                <th className="px-3 py-3">Section</th>
                <th className="px-3 py-3">Store</th>
                <th className="px-3 py-3">Sizes</th>
                <th className="px-3 py-3">Colors</th>
                <th className="px-3 py-3">GSM tiers</th>
                <th className="px-3 py-3 text-right">Base</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td className="px-3 py-10 text-center text-slate-500" colSpan={8}>
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-3 py-10 text-center text-sm text-slate-500" colSpan={8}>
                    No products. Add one or adjust filters.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.productId} className="hover:bg-slate-50/60">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={resolveMediaUrl(p.image)}
                          alt=""
                          className="h-10 w-10 rounded-lg border border-slate-200 object-cover"
                          loading="lazy"
                        />
                        <div className="min-w-0">
                          <div className="font-medium text-slate-900">{p.name}</div>
                          <div className="text-xs text-slate-500">
                            Product Code - {p.productId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone="slate">{displayCategoryLabel(p.category)}</Badge>
                    </td>
                    <td className="px-3 py-3">
                      <StoreStatusControl
                        isActive={p.isActive}
                        disabled={activeSavingId === p.productId}
                        onSet={(next) => void setProductActive(p.productId, next, p.isActive)}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="max-w-[220px] truncate text-slate-700">{p.sizes.join(', ')}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="max-w-[220px] truncate text-slate-700">{p.colors.join(', ')}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex max-w-[220px] flex-wrap gap-2">
                        {p.gsmOptions.map((g, idx) => (
                          <Badge
                            key={`${g.gsm}-${idx}`}
                            tone={g.isActive === false ? 'rose' : 'brand'}
                            className="whitespace-nowrap"
                          >
                            {g.gsm}gsm · {formatCurrencyRs(g.price)}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-medium">{formatCurrencyRs(p.basePrice)}</td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button type="button" variant="ghost" onClick={() => void openEdit(p.productId)}>
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          disabled={deletingId === p.productId}
                          onClick={() => openDeleteDialog(p)}
                        >
                          {deletingId === p.productId ? 'Deleting…' : 'Delete'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
            <h2 className="text-lg font-semibold text-slate-900">{editId ? 'Edit product' : 'Add product'}</h2>
            <form className="mt-4 space-y-3" onSubmit={(e) => void submitForm(e)}>
              <label className="block text-xs font-medium text-slate-600">
                Title
                <Input
                  className="mt-1"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </label>
              <label className="block text-xs font-medium text-slate-600">
                Section
                <select
                  className="mt-1 flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value as ProductSection }))
                  }
                >
                  {PRODUCT_SECTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-slate-600">
                Description
                <textarea
                  className="mt-1 min-h-[88px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-medium text-slate-600">
                  Brand
                  <Input
                    className="mt-1"
                    value={form.brand}
                    onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                  />
                </label>
                <label className="block text-xs font-medium text-slate-600">
                  Rating (0–5, optional)
                  <Input
                    className="mt-1"
                    type="number"
                    step="0.1"
                    min={0}
                    max={5}
                    value={form.rating === '' ? '' : form.rating}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, rating: e.target.value === '' ? '' : Number(e.target.value) }))
                    }
                  />
                </label>
              </div>
              <label className="block text-xs font-medium text-slate-600">
                Base price (Rs.)
                <Input
                  className="mt-1"
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.basePrice}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      basePrice: e.target.value === '' ? '' : Number(e.target.value),
                    }))
                  }
                  required
                />
              </label>
              <label className="block text-xs font-medium text-slate-600">
                Features (one per line)
                <textarea
                  className="mt-1 min-h-[72px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={form.featuresText}
                  onChange={(e) => setForm((f) => ({ ...f, featuresText: e.target.value }))}
                />
              </label>
              <label className="block text-xs font-medium text-slate-600">
                Sizes (comma-separated)
                <Input
                  className="mt-1"
                  value={form.sizes}
                  onChange={(e) => setForm((f) => ({ ...f, sizes: e.target.value }))}
                />
              </label>
              <label className="block text-xs font-medium text-slate-600">
                Colors (comma-separated)
                <Input
                  className="mt-1"
                  value={form.colors}
                  onChange={(e) => setForm((f) => ({ ...f, colors: e.target.value }))}
                />
              </label>
              <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-600">GSM price tiers (optional)</span>
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-8 text-xs"
                    disabled={form.gsmRows.length >= 3}
                    onClick={addGsmRow}
                  >
                    Add tier
                  </Button>
                </div>
                {form.gsmRows.length === 0 ? (
                  <p className="text-xs text-slate-500">No tiers — backend defaults apply. Add up to three (180 / 210 / 240 gsm).</p>
                ) : (
                  <ul className="space-y-2">
                    {form.gsmRows.map((row, index) => (
                      <li
                        key={`${row.gsm}-${index}`}
                        className="flex flex-wrap items-end gap-2 rounded-md border border-slate-200 bg-white p-2"
                      >
                        <label className="text-xs text-slate-600">
                          GSM
                          <select
                            className="mt-0.5 flex h-9 min-w-[88px] rounded-lg border border-slate-200 bg-white px-2 text-sm"
                            value={row.gsm}
                            onChange={(e) =>
                              updateGsmRow(index, { gsm: Number(e.target.value) as GsmChoice })
                            }
                          >
                            {GSM_VALUES.map((g) => (
                              <option key={g} value={g} disabled={form.gsmRows.some((r, i) => i !== index && r.gsm === g)}>
                                {g}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="min-w-[100px] flex-1 text-xs text-slate-600">
                          Price (Rs.)
                          <Input
                            className="mt-0.5"
                            type="number"
                            step="0.01"
                            min={0}
                            value={row.price}
                            onChange={(e) => updateGsmRow(index, { price: e.target.value })}
                            placeholder="0"
                          />
                        </label>
                        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-700">
                          <input
                            type="checkbox"
                            checked={row.isActive}
                            onChange={(e) => updateGsmRow(index, { isActive: e.target.checked })}
                          />
                          Active
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-9 text-xs text-rose-600"
                          onClick={() => removeGsmRow(index)}
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {!editId ? (
                <label className="block text-xs font-medium text-slate-600">
                  Image URL (if not uploading a file)
                  <Input
                    className="mt-1"
                    value={form.imageUrl}
                    onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                    placeholder="https://… or leave empty and upload file"
                  />
                </label>
              ) : null}
              <label className="block text-xs font-medium text-slate-600">
                {editId ? 'Replace image (optional)' : 'Image file'}
                <Input
                  className="mt-1"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-600">Visibility on storefront</span>
                <StoreStatusControl
                  isActive={form.isActive}
                  onSet={(next) => setForm((f) => ({ ...f, isActive: next }))}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : editId ? 'Save' : 'Create'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}

      {productToDelete ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onClick={() => {
            if (!deletingId) setProductToDelete(null)
          }}
        >
          <Card
            className="w-full max-w-md p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-slate-900">Delete product?</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              <span className="font-medium text-slate-800">{productToDelete.name}</span>
              {' · '}
              Product Code - {productToDelete.productId}
            </p>
            <p className="mt-2 text-sm text-slate-500">This cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={deletingId === productToDelete.productId}
                onClick={() => setProductToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={deletingId === productToDelete.productId}
                onClick={() => void confirmDeleteProduct()}
              >
                {deletingId === productToDelete.productId ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
