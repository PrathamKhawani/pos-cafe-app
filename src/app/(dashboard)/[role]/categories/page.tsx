'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ConfirmModal from '@/frontend/components/shared/ConfirmModal';

interface Category { id: string; name: string; color: string; order: number; }

export default function CategoriesPage() {
  const [categories,    setCategories]    = useState<Category[]>([]);
  const [editCat,       setEditCat]       = useState<Category | null>(null);
  const [loading,       setLoading]       = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string }>({ isOpen: false, id: '' });
  const [form,          setForm]          = useState({ name: '', color: '#7C5C3E' });

  const PRESET_COLORS = ['#7C5C3E','#C8883A','#2D7A4F','#2563EB','#7C3AED','#C0392B','#0891B2','#374151'];

  async function load() {
    const res  = await fetch('/api/categories');
    const data = await res.json();
    setCategories(Array.isArray(data) ? data : []);
  }
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (editCat) setForm({ name: editCat.name, color: editCat.color });
    else         setForm({ name: '', color: '#7C5C3E' });
  }, [editCat]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      if (editCat) {
        await fetch(`/api/categories/${editCat.id}`, { method: 'PUT',  headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, id: editCat.id }) });
        toast.success('Category updated'); setEditCat(null);
      } else {
        await fetch('/api/categories',                { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        toast.success('Category created');
      }
      load();
    } catch { toast.error('Save failed'); }
    finally  { setLoading(false); }
  }

  async function executeDelete() {
    try {
      const res = await fetch(`/api/categories/${confirmDelete.id}`, { method: 'DELETE' });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed'); }
      toast.success('Category deleted'); load();
    } catch (e: any) { toast.error(e.message); }
    finally { setConfirmDelete({ isOpen: false, id: '' }); }
  }

  async function reorder(id: string, currentOrder: number, direction: 'up' | 'down') {
    const idx   = categories.findIndex(c => c.id === id);
    const oIdx  = direction === 'up' ? idx - 1 : idx + 1;
    if (oIdx < 0 || oIdx >= categories.length) return;
    const other = categories[oIdx];
    await Promise.all([
      fetch(`/api/categories/${id}`,       { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: other.order }) }),
      fetch(`/api/categories/${other.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: currentOrder }) }),
    ]);
    load();
  }

  return (
    <div className="page-content py-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">{categories.length} categories registered</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Form Panel */}
        <div className="card p-4 sticky top-4 self-start">
          <h3 className="text-sm font-bold text-neutral-700 mb-4 pb-3 border-b border-neutral-100">
            {editCat ? 'Edit Category' : 'New Category'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="label">Name *</label>
              <input className="input" placeholder="e.g. Hot Beverages"
                     value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>

            <div>
              <label className="label">Color</label>
              <div className="grid grid-cols-8 gap-1.5 mt-1">
                {PRESET_COLORS.map(c => (
                  <button key={c} type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    className="h-7 rounded-md border-2 transition-transform"
                    style={{
                      background: c,
                      borderColor: form.color === c ? '#1A120B' : 'transparent',
                      transform: form.color === c ? 'scale(0.9)' : 'scale(1)',
                    }}>
                    {form.color === c && <span className="text-white text-xs">✓</span>}
                  </button>
                ))}
              </div>
              {/* Custom color picker */}
              <div className="flex items-center gap-2 mt-2">
                <input type="color" value={form.color}
                       onChange={e => setForm({ ...form, color: e.target.value })}
                       className="w-8 h-7 rounded cursor-pointer border border-neutral-200" />
                <span className="text-xs text-neutral-500 font-mono">{form.color}</span>
              </div>
            </div>

            {/* Preview */}
            <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md flex-shrink-0" style={{ background: form.color }} />
                <span className="text-sm font-medium text-neutral-700">{form.name || 'Category Name'}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? 'Saving...' : editCat ? 'Update' : 'Create Category'}
              </button>
              {editCat && (
                <button type="button" className="btn-secondary" onClick={() => setEditCat(null)}>Cancel</button>
              )}
            </div>
          </form>
        </div>

        {/* Category List */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                All Categories ({categories.length})
              </span>
            </div>

            {categories.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-neutral-400">
                <svg className="w-10 h-10 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <p className="text-sm font-medium">No categories yet</p>
                <p className="text-xs text-neutral-400 mt-1">Create your first category using the form</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {categories.map((cat, idx) => (
                  <div key={cat.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50 transition-colors group">
                    <div className="flex items-center gap-3">
                      {/* Reorder */}
                      <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => reorder(cat.id, cat.order, 'up')}
                          className="text-neutral-300 hover:text-neutral-600 leading-none text-xs">▲</button>
                        <button onClick={() => reorder(cat.id, cat.order, 'down')}
                          className="text-neutral-300 hover:text-neutral-600 leading-none text-xs">▼</button>
                      </div>
                      {/* Color swatch */}
                      <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
                           style={{ background: cat.color }}>
                        <span className="text-white text-xs font-bold opacity-60">
                          {(idx + 1).toString().padStart(2, '0')}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-neutral-800">{cat.name}</div>
                        <div className="text-2xs text-neutral-400 font-mono">{cat.color} · Order {cat.order}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button className="btn-icon" onClick={() => setEditCat(cat)}
                        title="Edit">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button className="btn-icon text-danger border-danger/20 hover:bg-danger hover:text-white hover:border-danger"
                        onClick={() => setConfirmDelete({ isOpen: true, id: cat.id })}
                        title="Delete">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal isOpen={confirmDelete.isOpen} title="Delete Category?"
        message="This will permanently delete this category. Products in this category will be unassigned."
        onConfirm={executeDelete} onCancel={() => setConfirmDelete({ isOpen: false, id: '' })}
        confirmText="Delete" type="danger" />
    </div>
  );
}
