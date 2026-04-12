'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Floor  { id: string; name: string; branch?: { id: string; name: string }; tables: Table[]; }
interface Table  { id: string; number: string; seats: number; isActive: boolean; tableType?: string; qrTokens?: Array<{ token: string }>; }
interface Branch { id: string; name: string; type: string; }

export default function FloorsPage() {
  const [floors,           setFloors]           = useState<Floor[]>([]);
  const [branches,         setBranches]         = useState<Branch[]>([]);
  const [floorForm,        setFloorForm]        = useState({ name: '', branchId: '' });
  const [tableForm,        setTableForm]        = useState({ floorId: '', number: '', seats: '4', tableType: 'Table', imageUrl: '' });
  const [qrMap,            setQrMap]            = useState<Record<string, string>>({});
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  async function load() {
    // Use ?all=1 so the API returns floors across ALL branches (not filtered by cookie)
    const [fRes, bRes] = await Promise.all([
      fetch('/api/floors?all=1'),
      fetch('/api/branches'),
    ]);
    const fData = await fRes.json();
    const bData = await bRes.json();
    setFloors(Array.isArray(fData) ? fData : []);
    const branchesData = Array.isArray(bData) ? bData : [];
    setBranches(branchesData);
    setSelectedBranchId(prev => {
      if (!prev && branchesData.length > 0) return branchesData[0].id;
      return prev;
    });
  }

  useEffect(() => { load(); }, []);

  // Auto-sync the Add Floor form branch AND reset the table floor selection when tab changes
  useEffect(() => {
    if (selectedBranchId) {
      setFloorForm(prev => ({ ...prev, branchId: selectedBranchId }));
      setTableForm(prev => ({ ...prev, floorId: '' }));
    }
  }, [selectedBranchId]);

  async function createFloor(e: React.FormEvent) {
    e.preventDefault();
    if (!floorForm.branchId) { toast.error('Select a branch first'); return; }
    await fetch('/api/floors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(floorForm),
    });
    setFloorForm({ name: '', branchId: selectedBranchId });
    toast.success('Floor created');
    load();
  }

  async function deleteFloor(id: string) {
    if (!confirm('Delete this floor and all its tables?')) return;
    await fetch(`/api/floors/${id}`, { method: 'DELETE' });
    toast.success('Floor deleted');
    load();
  }

  async function createTable(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/tables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tableForm),
    });
    setTableForm({ ...tableForm, number: '', tableType: 'Table', imageUrl: '' });
    toast.success('Table added');
    load();
  }

  async function toggleTable(id: string, isActive: boolean) {
    await fetch(`/api/tables/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    });
    load();
  }

  async function generateQR(tableId: string) {
    const res  = await fetch('/api/qr-tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableId }),
    });
    const data = await res.json();
    const url  = `${window.location.protocol}//${window.location.host}/s/${data.token}`;
    setQrMap(prev => ({ ...prev, [tableId]: url }));
    navigator.clipboard.writeText(url);
    toast.success('QR link copied!');
  }

  async function deleteTable(id: string) {
    if (!confirm('Remove this table?')) return;
    await fetch(`/api/tables/${id}`, { method: 'DELETE' });
    toast.success('Table removed');
    load();
  }

  // Floors filtered to the currently selected branch tab
  const branchFloors = floors.filter(f => f.branch?.id === selectedBranchId);
  const activeBranch = branches.find(b => b.id === selectedBranchId);

  return (
    <div className="page-content py-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Floors &amp; Tables</h1>
          <p className="page-subtitle">
            {floors.length} floors &middot; {floors.reduce((a, f) => a + f.tables.length, 0)} tables total
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

        {/* ── Left: Creation Forms ── */}
        <div className="space-y-4">

          {/* Add Floor */}
          <div className="card p-4">
            <h3 className="text-sm font-bold text-neutral-700 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Add Floor
            </h3>
            <form onSubmit={createFloor} className="space-y-2.5">
              <div>
                <label className="label">Branch *</label>
                <select
                  className="select"
                  value={floorForm.branchId}
                  onChange={e => setFloorForm({ ...floorForm, branchId: e.target.value })}
                  required
                >
                  <option value="">Select branch</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.type})</option>
                  ))}
                </select>
                {activeBranch && floorForm.branchId === selectedBranchId && (
                  <p className="text-xs text-primary-500 font-medium mt-1">
                    ✓ Synced with &quot;{activeBranch.name}&quot; tab
                  </p>
                )}
              </div>
              <div>
                <label className="label">Floor Name *</label>
                <input
                  className="input"
                  placeholder="e.g. Ground Floor, Rooftop"
                  value={floorForm.name}
                  onChange={e => setFloorForm({ ...floorForm, name: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full">Create Floor</button>
            </form>
          </div>

          {/* Quick Setup / Auto-Generate */}
          <div className="card p-5 bg-gradient-to-br from-primary-50 to-caramel-50 border-primary-100 shadow-md">
             <div className="flex items-center gap-2.5 mb-3">
               <div className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center text-lg shadow-sm">⚡</div>
               <h3 className="text-sm font-bold text-neutral-800">Branch Blueprint</h3>
             </div>
             <p className="text-xs text-neutral-500 font-medium leading-relaxed mb-4">
               Instantly generate a dynamic multi-floor layout with 10-30 tables for <strong>{activeBranch?.name || 'the selected branch'}</strong>.
             </p>
             <button 
               onClick={async () => {
                 if (!selectedBranchId) return toast.error('Select a branch tab first');
                 if (!confirm(`Warning: This will reset all existing tables in ${activeBranch?.name}. Continue?`)) return;
                 
                 const loading = toast.loading('Architecting layout...');
                 try {
                   const res = await fetch('/api/branches/initialize-layout', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ branchId: selectedBranchId })
                   });
                   const data = await res.json();
                   if (data.success) {
                     toast.success(`Success! Created ${data.floors} floors and ${data.tables} tables.`, { id: loading });
                     load();
                   } else { throw new Error(data.error); }
                 } catch (e: any) {
                   toast.error(e.message, { id: loading });
                 }
               }}
               className="btn-primary w-full py-3 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
             >
               Auto-Generate Layout
             </button>
          </div>

          {/* Add Table */}
          <div className="card p-4">
            <h3 className="text-sm font-bold text-neutral-700 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M10 3v18M14 3v18" />
              </svg>
              Add Table
            </h3>
            <form onSubmit={createTable} className="space-y-2.5">
              <div>
                <label className="label">Floor *</label>
                <select
                  className="select"
                  value={tableForm.floorId}
                  onChange={e => setTableForm({ ...tableForm, floorId: e.target.value })}
                  required
                >
                  <option value="">
                    {branchFloors.length === 0
                      ? (activeBranch ? `No floors in ${activeBranch.name}` : 'Select a branch tab first')
                      : 'Select floor'}
                  </option>
                  {/* Only branch-specific floors shown here */}
                  {branchFloors.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
                {branchFloors.length === 0 && activeBranch && (
                  <p className="text-xs text-amber-500 font-medium mt-1">
                    Create a floor for &quot;{activeBranch.name}&quot; first
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Table ID *</label>
                  <input
                    className="input"
                    placeholder="A1, T5..."
                    value={tableForm.number}
                    onChange={e => setTableForm({ ...tableForm, number: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">Type</label>
                  <select
                    className="select"
                    value={tableForm.tableType}
                    onChange={e => setTableForm({ ...tableForm, tableType: e.target.value })}
                  >
                    <option value="Table">Table</option>
                    <option value="Booth">Booth</option>
                    <option value="Bar">Bar</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Seats</label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  max="20"
                  value={tableForm.seats}
                  onChange={e => setTableForm({ ...tableForm, seats: e.target.value })}
                />
              </div>
              <button type="submit" className="btn-secondary w-full">Add Table</button>
            </form>
          </div>
        </div>

        {/* ── Right: Branch Tabs + Floors Display ── */}
        <div className="lg:col-span-3 space-y-4">

          {/* Branch Switcher Tabs */}
          {branches.length > 0 && (
            <div className="flex bg-neutral-100 p-1.5 rounded-xl gap-1 border border-neutral-200 overflow-x-auto shadow-inner">
              {branches.map(b => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBranchId(b.id)}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg flex-1 whitespace-nowrap transition-all ${
                    selectedBranchId === b.id
                      ? 'bg-white text-primary-700 shadow-sm border border-neutral-200/50'
                      : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200/60 border border-transparent'
                  }`}
                >
                  {b.name}
                  <span className="ml-1.5 text-xs opacity-50">
                    ({floors.filter(f => f.branch?.id === b.id).length} floors)
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Empty states */}
          {branches.length === 0 ? (
            <div className="card py-20 flex flex-col items-center justify-center text-neutral-400">
              <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-sm font-medium">No branches configured</p>
              <p className="text-xs text-neutral-400 mt-1">Please create a branch first</p>
            </div>
          ) : branchFloors.length === 0 ? (
            <div className="card py-20 flex flex-col items-center justify-center text-neutral-400 border-dashed border-2 bg-neutral-50 shadow-none">
              <svg className="w-12 h-12 mb-3 text-neutral-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-sm font-medium text-neutral-500">
                No floors for {activeBranch?.name ?? 'this branch'}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Use the &quot;Add Floor&quot; form on the left to create one
              </p>
            </div>
          ) : (
            /* Floor cards */
            branchFloors.map(floor => (
              <div key={floor.id} className="card overflow-hidden">
                {/* Floor Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 border-b border-neutral-200">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm font-bold text-neutral-800">{floor.name}</span>
                    {floor.branch && (
                      <span className="text-xs text-primary-600 font-medium">{floor.branch.name}</span>
                    )}
                    <span className="badge badge-gray">{floor.tables.length} tables</span>
                  </div>
                  <button
                    onClick={() => deleteFloor(floor.id)}
                    className="text-xs text-danger hover:underline font-medium"
                  >
                    Delete Floor
                  </button>
                </div>

                {/* Tables Grid */}
                <div className="p-4">
                  {floor.tables.length === 0 ? (
                    <div className="py-8 text-center text-neutral-400 border-2 border-dashed border-neutral-200 rounded-lg">
                      <p className="text-sm">No tables on this floor</p>
                      <p className="text-xs mt-1 text-neutral-300">
                        Select &quot;{floor.name}&quot; in the Add Table form
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-6 gap-2.5">
                      {floor.tables.map(table => (
                        <div
                          key={table.id}
                          className={`group relative rounded-lg border p-2.5 text-center transition-all ${
                            table.isActive
                              ? 'bg-white border-neutral-200 hover:border-primary-300'
                              : 'bg-neutral-50 border-neutral-200 opacity-60'
                          }`}
                        >
                          <div className={`text-base font-bold ${table.isActive ? 'text-neutral-800' : 'text-neutral-500'}`}>
                            {table.number}
                          </div>
                          <div className="text-xs text-neutral-400 mt-0.5">
                            {table.seats}s &middot; {table.tableType}
                          </div>
                          <div className={`w-1.5 h-1.5 rounded-full mx-auto mt-1.5 ${table.isActive ? 'bg-green-400' : 'bg-red-400'}`} />

                          {/* Hover actions */}
                          <div className="absolute inset-0 bg-white/95 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                            <button
                              onClick={() => toggleTable(table.id, table.isActive)}
                              className={`w-full py-0.5 rounded text-xs font-semibold ${
                                table.isActive ? 'bg-neutral-100 text-neutral-600' : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {table.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => generateQR(table.id)}
                              className="w-full py-0.5 rounded text-xs font-semibold bg-primary-50 text-primary-600"
                            >
                              Copy QR
                            </button>
                            <button
                              onClick={() => deleteTable(table.id)}
                              className="w-full py-0.5 rounded text-xs font-semibold bg-red-50 text-red-500"
                            >
                              Remove
                            </button>
                          </div>

                          {/* Copied flash */}
                          {qrMap[table.id] && (
                            <div className="mt-1 px-1 py-0.5 bg-primary-50 rounded text-xs text-primary-600">
                              Copied!
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
