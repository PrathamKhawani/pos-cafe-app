'use client';
import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';

interface Branch { id: string; name: string; type: string; }
interface Table {
  id: string;
  number: string;
  floor: { id: string; name: string; branchId: string | null } | null;
  qrTokens: Array<{ token: string }>;
}

export default function QRPrintPage() {
  const [allTables, setAllTables]       = useState<Table[]>([]);
  const [branches, setBranches]         = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [qrCodes, setQrCodes]           = useState<Record<string, string>>({});
  const [generating, setGenerating]     = useState(false);
  const [floorFilter, setFloorFilter]   = useState('all');

  async function load() {
    const [tRes, bRes] = await Promise.all([
      fetch('/api/tables?all=1'),
      fetch('/api/branches'),
    ]);
    const tData = await tRes.json();
    const bData = await bRes.json();

    const tables: Table[] = Array.isArray(tData) ? tData : [];
    const branchList: Branch[] = Array.isArray(bData) ? bData : [];

    setAllTables(tables);
    setBranches(branchList);

    // Auto-select first branch
    setSelectedBranchId(prev => {
      if (!prev && branchList.length > 0) return branchList[0].id;
      return prev;
    });

    // Pre-generate QR data URLs for tables that already have tokens
    const codes: Record<string, string> = {};
    for (const table of tables) {
      if (table.qrTokens?.[0]) {
        const url = `${window.location.origin}/s/${table.qrTokens[0].token}`;
        codes[table.id] = await QRCode.toDataURL(url, {
          width: 256,
          margin: 2,
          color: { dark: '#1a1a1a', light: '#ffffff' },
        });
      }
    }
    setQrCodes(codes);
  }

  useEffect(() => { load(); }, []);

  // Reset floor filter when branch changes
  useEffect(() => { setFloorFilter('all'); }, [selectedBranchId]);

  // Tables for the selected branch
  const branchTables = allTables.filter(t => t.floor?.branchId === selectedBranchId);

  // Unique floor names within the selected branch
  const floors = Array.from(
    new Set(branchTables.map(t => t.floor?.name || 'Unassigned').filter(Boolean))
  );

  const filtered = floorFilter === 'all'
    ? branchTables
    : branchTables.filter(t => (t.floor?.name || 'Unassigned') === floorFilter);

  const tablesWithQR    = branchTables.filter(t => t.qrTokens?.length > 0).length;
  const tablesWithoutQR = branchTables.length - tablesWithQR;
  const activeBranch    = branches.find(b => b.id === selectedBranchId);

  async function generateAll() {
    setGenerating(true);
    try {
      // Generate QR tokens only for tables in the selected branch that don't have one
      const needsToken = branchTables.filter(t => !t.qrTokens?.length);
      let created = 0;
      for (const table of needsToken) {
        await fetch('/api/qr-tokens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tableId: table.id }),
        });
        created++;
      }
      toast.success(
        created > 0
          ? `Generated ${created} QR code${created > 1 ? 's' : ''} for ${activeBranch?.name}`
          : `All tables in ${activeBranch?.name} already have QR codes`
      );
      await load();
    } catch {
      toast.error('Failed to generate QR codes');
    }
    setGenerating(false);
  }

  return (
    <div className="page-content py-5 animate-fade-in">
      {/* Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">QR Codes</h1>
          <p className="page-subtitle">
            {activeBranch ? `${activeBranch.name} — ` : ''}
            {tablesWithQR} active · {tablesWithoutQR} pending
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={generateAll}
            disabled={generating || branchTables.length === 0}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {generating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Generate All QR Codes
              </>
            )}
          </button>
          <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print All
          </button>
        </div>
      </div>

      {/* Branch Switcher Tabs */}
      {branches.length > 0 && (
        <div className="no-print flex bg-neutral-100 p-1.5 rounded-xl gap-1 border border-neutral-200 overflow-x-auto shadow-inner mb-4">
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
              <span className="ml-1.5 text-xs opacity-60">
                ({allTables.filter(t => t.floor?.branchId === b.id).length})
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Floor Filter — only shown if branch has multiple floors */}
      {floors.length > 1 && (
        <div className="no-print flex gap-2 mb-5 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setFloorFilter('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              floorFilter === 'all' ? 'bg-primary-500 text-white shadow-sm' : 'bg-white border border-neutral-200 text-neutral-500 hover:bg-neutral-50'
            }`}
          >All Floors</button>
          {floors.map(f => (
            <button
              key={f}
              onClick={() => setFloorFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                floorFilter === f ? 'bg-primary-500 text-white shadow-sm' : 'bg-white border border-neutral-200 text-neutral-500 hover:bg-neutral-50'
              }`}
            >{f}</button>
          ))}
        </div>
      )}

      {/* QR Grid */}
      {filtered.length === 0 ? (
        <div className="card py-20 flex flex-col items-center justify-center text-neutral-400">
          <div className="text-4xl mb-3">📱</div>
          <p className="text-sm font-medium">No tables in {activeBranch?.name || 'this branch'}</p>
          <p className="text-xs text-neutral-300 mt-1">Create tables in the Floors &amp; Tables section</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 print:grid-cols-3 print:gap-3">
          {filtered.map(table => (
            <div key={table.id} className="card p-5 flex flex-col items-center text-center print:shadow-none print:border-slate-300">
              <div className="mb-3">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest block mb-0.5">
                  {table.floor?.name || 'Main Floor'}
                </span>
                <h2 className="text-xl font-bold text-neutral-800">Table {table.number}</h2>
              </div>
              {qrCodes[table.id] ? (
                <a href={`/s/${table.qrTokens[0]?.token}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center hover:opacity-80 transition-opacity">
                  <img src={qrCodes[table.id]} alt={`QR for Table ${table.number}`} className="w-40 h-40 sm:w-44 sm:h-44 mb-4" />
                  <div className="px-4 py-1.5 bg-primary-50 rounded-lg">
                    <span className="text-[9px] font-bold text-primary-600 uppercase tracking-widest">Scan to Order</span>
                  </div>
                </a>
              ) : (
                <div className="w-40 h-40 sm:w-44 sm:h-44 bg-neutral-50 rounded-2xl flex flex-col items-center justify-center text-neutral-300 mb-4 border-2 border-dashed border-neutral-200">
                  <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  <span className="text-[10px] font-semibold">No QR token</span>
                  <span className="text-[9px] text-neutral-300 mt-0.5">Click &quot;Generate All&quot;</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; padding: 0 !important; }
          .page-content { padding: 8px !important; max-width: none !important; }
        }
      `}</style>
    </div>
  );
}
