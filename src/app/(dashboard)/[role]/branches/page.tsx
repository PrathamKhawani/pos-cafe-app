'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Branch {
  id: string;
  name: string;
  type: 'SEATING' | 'TAKEAWAY' | 'MIXED';
  imageUrl?: string;
}

const TYPE_CONFIG = {
  SEATING:  { label: 'Seating',         color: '#2563EB', bg: '#EFF4FF'   },
  TAKEAWAY: { label: 'Takeaway',        color: '#2D7A4F', bg: '#EBF7F1'   },
};

export default function AdminBranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showAdd,  setShowAdd]  = useState(false);
  const [form,     setForm]     = useState({ name: '', type: 'SEATING', imageUrl: '' });

  async function load() {
    try {
      const res = await fetch('/api/branches');
      const data = await res.json();
      if (Array.isArray(data)) setBranches(data);
    } catch { toast.error('Failed to load branches'); }
    finally  { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/branches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      toast.success('Branch created'); setForm({ name: '', type: 'SEATING', imageUrl: '' }); setShowAdd(false); load();
    } catch { toast.error('Error creating branch'); }
  }

  async function deleteBranch(id: string) {
    if (!confirm('Delete this branch? All floors and tables will be removed.')) return;
    try {
      const res = await fetch(`/api/branches/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Branch deleted'); load();
    } catch { toast.error('Error deleting branch'); }
  }

  return (
    <div className="page-content py-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Branches</h1>
          <p className="page-subtitle">{branches.length} branches configured</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Branch
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-neutral-400">
          <div className="w-5 h-5 border-2 border-neutral-300 border-t-primary-500 rounded-full animate-spin mr-3" />
          Loading branches...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map(branch => {
            const cfg = TYPE_CONFIG[branch.type] || TYPE_CONFIG.MIXED;
            return (
              <div key={branch.id} className="card overflow-hidden card-hover">
                {/* Cover Image */}
                {branch.imageUrl && (
                  <div className="h-32 overflow-hidden">
                    <img src={branch.imageUrl} alt={branch.name}
                         className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-neutral-800">{branch.name}</h3>
                      <p className="text-xs text-neutral-400 mt-0.5 font-mono truncate">{branch.id}</p>
                    </div>
                    <span className="badge text-xs px-2 py-0.5 rounded-md font-semibold flex-shrink-0"
                          style={{ background: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-end pt-2 border-t border-neutral-100">
                    <button onClick={() => deleteBranch(branch.id)}
                      className="text-xs text-danger hover:underline font-medium">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {branches.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-neutral-400 border-2 border-dashed border-neutral-200 rounded-xl">
              <svg className="w-10 h-10 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-sm font-medium">No branches configured</p>
              <p className="text-xs mt-1">Click "Add Branch" to get started</p>
            </div>
          )}
        </div>
      )}

      {/* Add Branch Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div className="modal-box max-w-md animate-scale-in">
            <div className="modal-header">
              <h2 className="modal-title">Add New Branch</h2>
              <button className="btn-icon" onClick={() => setShowAdd(false)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-3">
                <div>
                  <label className="label">Branch Name *</label>
                  <input className="input" placeholder="e.g. Downtown Cafe, Main Branch"
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Operation Type *</label>
                  <select className="select" value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value as any })}>
                    <option value="SEATING">Seating (Floors & Tables)</option>
                    <option value="TAKEAWAY">Takeaway Only</option>
                  </select>
                </div>
                <div>
                  <label className="label">Cover Image URL</label>
                  <input className="input" placeholder="https://images.unsplash.com/..."
                    value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} />
                </div>

                {/* Type Preview */}
                {form.type && (
                  <div className="p-2.5 rounded-lg border border-neutral-200"
                    style={{ background: TYPE_CONFIG[form.type as keyof typeof TYPE_CONFIG]?.bg }}>
                    <p className="text-xs font-medium" style={{ color: TYPE_CONFIG[form.type as keyof typeof TYPE_CONFIG]?.color }}>
                      {form.type === 'SEATING'  && 'This branch handles both floors/tables and parcel/takeaway.'}
                      {form.type === 'TAKEAWAY' && 'This branch handles direct takeaway orders only.'}
                    </p>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Branch</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
