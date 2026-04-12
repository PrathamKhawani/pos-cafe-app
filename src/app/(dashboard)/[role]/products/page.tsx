'use client';
import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import useSWR, { mutate } from 'swr';
import ConfirmModal from '@/frontend/components/shared/ConfirmModal';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface Category { id: string; name: string; color: string; }
interface Variant { attribute: string; value: string; extraPrice: number; }
interface Product {
  id: string; name: string; category: Category; price: number; tax: number;
  uom?: string; priceTaxIncluded: boolean; imageUrl?: string;
  description?: string; isAvailable: boolean; isVegetarian: boolean; variants: Array<Variant & { id: string }>;
}

const EMPTY_FORM = { name: '', categoryId: '', price: '', tax: '0', uom: 'Unit', priceTaxIncluded: true, description: '', imageUrl: '', isVegetarian: true };

export default function ProductsPage() {
  const [showModal, setShowModal] = useState(false);
  const [editProd,  setEditProd]  = useState<Product | null>(null);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [variants,  setVariants]  = useState<Variant[]>([]);
  const [search,    setSearch]    = useState('');
  const [activeCat, setActiveCat] = useState('ALL');
  const [loading,   setLoading]   = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string }>({ isOpen: false, id: '' });
  const [vegFilter, setVegFilter] = useState<'ALL' | 'VEG' | 'NON_VEG'>('ALL');

  // SWR Managed Data
  const { data: productsData } = useSWR<Product[]>('/api/products', fetcher);
  const { data: categoriesData } = useSWR<Category[]>('/api/categories', fetcher);

  const products = useMemo(() => Array.isArray(productsData) ? productsData : [], [productsData]);
  const categories = useMemo(() => Array.isArray(categoriesData) ? categoriesData : [], [categoriesData]);

  function openNew() {
    setEditProd(null);
    setForm({ ...EMPTY_FORM, categoryId: categories[0]?.id || '' });
    setVariants([]);
    setShowModal(true);
  }
  function openEdit(p: Product) {
    setEditProd(p);
    setForm({ name: p.name, categoryId: p.category?.id || '', price: String(p.price), tax: String(p.tax), uom: p.uom || 'Unit', priceTaxIncluded: p.priceTaxIncluded !== false, description: p.description || '', imageUrl: p.imageUrl || '', isVegetarian: p.isVegetarian !== false });
    setVariants(p.variants.map(v => ({ attribute: v.attribute, value: v.value, extraPrice: v.extraPrice })));
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      const res = editProd
        ? await fetch(`/api/products/${editProd.id}`, { method: 'PUT',  headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, variants, price: parseFloat(form.price), tax: parseFloat(form.tax) }) })
        : await fetch('/api/products',                 { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, variants, price: parseFloat(form.price), tax: parseFloat(form.tax) }) });
      if (!res.ok) throw new Error('Failed');
      toast.success(editProd ? 'Product updated' : 'Product created');
      setShowModal(false); 
      mutate('/api/products'); 
    } catch { toast.error('Failed to save product'); }
    finally { setLoading(false); }
  }

  async function executeDelete() {
    try {
      const res = await fetch(`/api/products/${confirmDelete.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Product deleted'); 
      mutate('/api/products');
    } catch { toast.error('Delete failed'); }
    finally { setConfirmDelete({ isOpen: false, id: '' }); }
  }

  async function toggleAvailability(p: Product) {
    try {
      await fetch(`/api/products/${p.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isAvailable: !p.isAvailable }) });
      mutate('/api/products');
    } catch { toast.error('Failed to update'); }
  }

  const filtered = useMemo(() => products.filter(p => {
    const matchCat    = activeCat === 'ALL' || p.category?.id === activeCat;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchVeg    = vegFilter === 'ALL' || (vegFilter === 'VEG' ? p.isVegetarian : !p.isVegetarian);
    return matchCat && matchSearch && matchVeg;
  }), [products, activeCat, search, vegFilter]);

  return (
    <div className="page-content py-5 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">{products.length} items · {filtered.length} shown</p>
        </div>
        <button className="btn-primary" onClick={openNew}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input className="input pl-9" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Veg Filter */}
        <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200 shadow-sm">
          <button onClick={() => setVegFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${vegFilter === 'ALL' ? 'bg-white text-primary-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
            All
          </button>
          <button onClick={() => setVegFilter('VEG')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${vegFilter === 'VEG' ? 'bg-white text-green-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Veg
          </button>
          <button onClick={() => setVegFilter('NON_VEG')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${vegFilter === 'NON_VEG' ? 'bg-white text-red-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Non-Veg
          </button>
        </div>

        {/* Category pills */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveCat('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${activeCat === 'ALL' ? 'bg-primary-500 text-white border-primary-600' : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'}`}>
            All
          </button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCat(cat.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
              style={activeCat === cat.id
                ? { background: cat.color, color: '#fff', borderColor: cat.color }
                : { background: '#fff', color: '#6B6459', borderColor: '#E5DDD3' }}>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filtered.map((p) => (
          <div key={p.id}
            className={`card-hover overflow-hidden flex flex-col ${!p.isAvailable ? 'opacity-60' : ''}`}>
            {/* Image */}
            <div className="relative h-32 bg-neutral-100 overflow-hidden flex-shrink-0">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.name}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-300">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </div>
              )}
              {/* Category */}
              <div className="absolute top-2 left-2">
                <span className="px-1.5 py-0.5 rounded text-2xs font-bold text-white"
                      style={{ background: (p.category?.color || '#7C5C3E') + 'dd' }}>
                  {p.category?.name}
                </span>
              </div>
              {/* Availability toggle */}
              <button onClick={() => toggleAvailability(p)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs shadow"
                style={{ background: p.isAvailable ? '#2D7A4F' : '#C0392B' }}>
                {p.isAvailable ? '✓' : '✕'}
              </button>
            </div>

            {/* Content */}
            <div className="p-3 flex flex-col flex-1">
              <div className="flex items-start justify-between gap-1 mb-1">
                <h3 className="font-semibold text-neutral-800 text-sm leading-tight line-clamp-2">
                  <span className={`flex-shrink-0 inline-flex items-center justify-center w-3 h-3 rounded-sm border ${p.isVegetarian ? 'border-green-600 bg-green-100' : 'border-red-600 bg-red-100'} mr-1.5 align-middle relative top-[-1px]`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${p.isVegetarian ? 'bg-green-600' : 'bg-red-600'}`}></span>
                  </span>
                  {p.name}
                </h3>
                <span className="text-sm font-bold text-primary-600 whitespace-nowrap">₹{p.price}</span>
              </div>
              {p.tax > 0 && <span className="text-2xs text-neutral-400">+{p.tax}% tax</span>}
              {p.variants.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {p.variants.slice(0, 2).map((v, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-neutral-100 text-2xs text-neutral-500">
                      {v.value}{v.extraPrice > 0 ? ` +₹${v.extraPrice}` : ''}
                    </span>
                  ))}
                  {p.variants.length > 2 && <span className="px-1.5 py-0.5 rounded bg-neutral-100 text-2xs text-neutral-400">+{p.variants.length - 2}</span>}
                </div>
              )}
              <div className="mt-auto pt-2.5 flex gap-1.5 border-t border-neutral-100">
                <button className="flex-1 btn-secondary py-1 text-xs" onClick={() => openEdit(p)}>Edit</button>
                <button className="btn-icon w-7 h-7 text-danger border-danger/20 hover:bg-danger hover:text-white hover:border-danger"
                        onClick={() => setConfirmDelete({ isOpen: true, id: p.id })}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-neutral-400 border-2 border-dashed border-neutral-200 rounded-xl">
            <svg className="w-10 h-10 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-sm font-medium">No products found</p>
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal-box max-w-2xl animate-scale-in !max-h-[95vh] !py-2">
            {/* Header */}
            <div className="modal-header !py-2 !px-4">
              <h2 className="modal-title text-sm">{editProd ? 'Edit Product' : 'Add Product'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body !py-2 !px-4">
                {/* Image preview strip */}
                {form.imageUrl && (
                  <div className="w-full h-16 rounded-lg overflow-hidden bg-neutral-100 mb-2">
                    <img src={form.imageUrl} alt="preview" className="w-full h-full object-cover"
                         onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}

                {/* Row 1: Name + Category */}
                <div className="grid grid-cols-3 gap-2 mb-1.5">
                  <div className="col-span-2">
                    <label className="label text-xs mb-0.5">Product Name *</label>
                    <input className="input" placeholder="e.g. Cappuccino Large"
                           value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div>
                    <label className="label text-xs mb-0.5">Category *</label>
                    <select className="select" value={form.categoryId}
                            onChange={e => setForm({ ...form, categoryId: e.target.value })} required>
                      <option value="">Select</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Row 2: Price + Tax + UOM */}
                <div className="grid grid-cols-3 gap-2 mb-1.5">
                  <div>
                    <label className="label text-xs mb-0.5">Price (₹) *</label>
                    <input className="input" type="number" placeholder="0" step="1"
                           value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
                  </div>
                  <div>
                    <label className="label text-xs mb-0.5">Tax (%)</label>
                    <input className="input" type="number" placeholder="0" step="0.1"
                           value={form.tax} onChange={e => setForm({ ...form, tax: e.target.value })} />
                  </div>
                  <div>
                    <label className="label text-xs mb-0.5">Unit</label>
                    <select className="select" value={form.uom} onChange={e => setForm({ ...form, uom: e.target.value })}>
                      <option>Unit</option>
                      <option value="KG">KG</option>
                      <option value="Liter">Liter</option>
                    </select>
                  </div>
                </div>

                {/* Row 3: Image URL + Description */}
                <div className="grid grid-cols-2 gap-2 mb-1.5">
                  <div>
                    <label className="label text-xs mb-0.5">Image URL</label>
                    <input className="input" placeholder="https://..." value={form.imageUrl}
                           onChange={e => setForm({ ...form, imageUrl: e.target.value })} />
                  </div>
                  <div>
                    <label className="label text-xs mb-0.5">Description</label>
                    <textarea className="textarea py-1" rows={1} placeholder="Short description..."
                              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                  </div>
                </div>

                {/* Tax Included toggle */}
                <div className="flex items-center gap-2 mb-1.5 p-1 bg-neutral-50 rounded-lg border border-neutral-200">
                  <button type="button"
                    className={`toggle-track ${form.priceTaxIncluded ? 'on' : ''}`}
                    onClick={() => setForm({ ...form, priceTaxIncluded: !form.priceTaxIncluded })}>
                    <span className="toggle-thumb" />
                  </button>
                  <span className="text-sm text-neutral-700 w-32">Price includes tax</span>
                  
                  {/* Veg/Non-Veg toggle */}
                  <div className="ml-auto flex items-center gap-2 border-l border-neutral-200 pl-4 py-1">
                    <span className={`text-xs font-bold ${form.isVegetarian ? 'text-green-600' : 'text-neutral-400'}`}>Veg</span>
                    <button type="button"
                      className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors ${form.isVegetarian ? 'bg-green-500' : 'bg-red-500'}`}
                      onClick={() => setForm({ ...form, isVegetarian: !form.isVegetarian })}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isVegetarian ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                    </button>
                    <span className={`text-xs font-bold ${!form.isVegetarian ? 'text-red-500' : 'text-neutral-400'}`}>Non-Veg</span>
                  </div>
                </div>

                <div className="border border-neutral-200 rounded-lg overflow-hidden mb-1.5">
                  <div className="flex items-center justify-between px-3 py-1 bg-neutral-50 border-b border-neutral-200">
                    <span className="text-[10px] font-semibold text-neutral-600">Variants / Options</span>
                    <button type="button" className="btn-secondary py-1 px-2.5 text-xs"
                      onClick={() => setVariants([...variants, { attribute: 'Size', value: '', extraPrice: 0 }])}>
                      + Add Variant
                    </button>
                  </div>
                  <div className="p-2 space-y-1">
                    {variants.map((v, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input className="input flex-1 py-1.5 text-xs" placeholder="Attribute (e.g. Size)"
                               value={v.attribute} onChange={e => setVariants(variants.map((vv, ii) => ii === i ? { ...vv, attribute: e.target.value } : vv))} />
                        <input className="input flex-1 py-1.5 text-xs" placeholder="Value (e.g. Large)"
                               value={v.value} onChange={e => setVariants(variants.map((vv, ii) => ii === i ? { ...vv, value: e.target.value } : vv))} />
                        <input className="input w-20 py-1.5 text-xs" type="number" placeholder="₹0"
                               value={v.extraPrice} onChange={e => setVariants(variants.map((vv, ii) => ii === i ? { ...vv, extraPrice: parseFloat(e.target.value.toString()) || 0 } : vv))} />
                        <button type="button" className="btn-icon text-danger border-danger/20"
                          onClick={() => setVariants(variants.filter((_, ii) => ii !== i))}>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    {variants.length === 0 && (
                      <p className="text-center text-xs text-neutral-400 py-3">No variants — click "Add Variant" to create options</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer !py-2 !px-4">
                <button type="button" className="btn-secondary !py-1 text-xs" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary !py-1 text-xs">
                  {loading ? 'Saving...' : editProd ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={confirmDelete.isOpen} title="Delete Product?"
        message="This permanently removes the product and all its variants."
        onConfirm={executeDelete} onCancel={() => setConfirmDelete({ isOpen: false, id: '' })}
        confirmText="Delete" type="danger" />
    </div>
  );
}
