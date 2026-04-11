import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { formatCurrencyRs } from '../lib/format'
import { notify } from '../lib/notify'
import { apiRequest, getApiBaseUrl, resolveMediaUrl } from '../lib/api'
import { PRODUCT_SECTIONS, type ProductSection } from '../constants/productSections'

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
  gsmOptionsJson: string
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
    gsmOptionsJson: '',
    imageUrl: '',
    isActive: true,
  }
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
      const section = PRODUCT_SECTIONS.includes(row.category as ProductSection)
        ? (row.category as ProductSection)
        : PRODUCT_SECTIONS[0]
      setEditId(productId)
      setForm({
        productId: row.productId,
        name: row.name,
        category: section,
        description: row.description || '',
        brand: row.brand || 'Raabta',
        rating: row.rating ?? '',
        featuresText: (row.features || []).join('\n'),
        basePrice: row.basePrice,
        sizes: (row.sizes || []).join(','),
        colors: (row.colors || []).join(','),
        gsmOptionsJson: JSON.stringify(row.gsmOptions || [], null, 2),
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
        if (form.gsmOptionsJson.trim()) {
          body.gsmOptions = JSON.parse(form.gsmOptionsJson) as AdminProductRow['gsmOptions']
        }
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
          if (form.gsmOptionsJson.trim()) fd.append('gsmOptionsJson', form.gsmOptionsJson)
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
        fd.append('productId', form.productId.trim())
        fd.append('name', form.name.trim())
        fd.append('category', form.category)
        fd.append('basePrice', String(basePrice))
        fd.append('description', form.description)
        fd.append('brand', form.brand.trim())
        if (form.rating !== '' && form.rating != null) fd.append('rating', String(form.rating))
        fd.append('features', form.featuresText)
        fd.append('sizes', form.sizes)
        fd.append('colors', form.colors)
        if (form.gsmOptionsJson.trim()) fd.append('gsmOptionsJson', form.gsmOptionsJson)
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

  async function toggleActive(productId: string) {
    try {
      await apiRequest<AdminProductRow>(`/api/admin/products/${encodeURIComponent(productId)}/toggle-active`, {
        method: 'PATCH',
      })
      notify.info('Updated')
      await load()
    } catch (e) {
      notify.error(e instanceof Error ? e.message : 'Toggle failed')
    }
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
                <th className="px-3 py-3">Active</th>
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
                    <td className="px-3 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => void openEdit(p.productId)}>
                          Edit
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => void toggleActive(p.productId)}>
                          Toggle
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
              {!editId ? (
                <label className="block text-xs font-medium text-slate-600">
                  Product ID (SKU)
                  <Input
                    className="mt-1"
                    value={form.productId}
                    onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}
                    required
                    placeholder="e.g. RBT-042"
                  />
                </label>
              ) : null}
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
                  onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value === '' ? '' : Number(e.target.value) }))}
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
              <label className="block text-xs font-medium text-slate-600">
                GSM options (JSON array, optional — leave empty for defaults)
                <textarea
                  className="mt-1 min-h-[80px] w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
                  value={form.gsmOptionsJson}
                  onChange={(e) => setForm((f) => ({ ...f, gsmOptionsJson: e.target.value }))}
                  placeholder='[{"gsm":180,"price":788},{"gsm":210,"price":791}]'
                />
              </label>
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
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
                Active (visible on storefront)
              </label>
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
    </div>
  )
}
