'use client';
import { useState, useEffect, useCallback } from 'react';
import { Line, Bar, Pie, Doughnut } from '@/frontend/components/shared/ChartRegistry';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
const TT = { padding: 12, backgroundColor: '#1e293b', titleFont: { size: 13, weight: 'bold' as const }, bodyFont: { size: 12 }, cornerRadius: 8 };

interface ReportData {
  totalOrders: number; totalRevenue: number; avgOrderValue: number;
  prevTotalOrders: number; prevTotalRevenue: number;
  branchBreakdown: { name: string; revenue: number; orders: number }[];
  topProducts: { name: string; qty: number; revenue: number }[];
  topCategories: { name: string; revenue: number; orders?: number }[];
  dailySales: Record<string, number>;
  hourlyDistribution: Record<string, { orders: number; revenue: number }>;
  paymentBreakdown: { method: string; count: number; total: number }[];
}

function Empty({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2">
      <span className="text-4xl">{icon}</span>
      <span className="text-xs font-bold">{label}</span>
    </div>
  );
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [period, setPeriod] = useState('monthly');
  const [branch, setBranch] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/branches', { cache: 'no-store' }).then(r => r.ok ? r.json() : []).then(setBranches).catch(console.error);
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/reports?period=${period}&branchId=${branch}`);
      if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
      setData(await res.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [period, branch]);

  useEffect(() => { load(); }, [load]);

  const growth = (cur: number, prev: number) => prev === 0 ? (cur > 0 ? 100 : 0) : ((cur - prev) / prev * 100);
  const fmt = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

  if (!data && loading) return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-400">Loading analytics...</p>
        </div>
      </main>
    </div>
  );

  // Chart datasets
  const lineData = {
    labels: data ? Object.keys(data.dailySales).map(d => { const p = d.split('-'); return `${p[2]}/${p[1]}`; }) : [],
    datasets: [{ label: 'Revenue', data: data ? Object.values(data.dailySales) : [], borderColor: '#6366F1', backgroundColor: 'rgba(99,102,241,0.08)', fill: true, tension: 0.4, pointRadius: 3, pointBorderWidth: 2, borderWidth: 2.5 }]
  };
  const branchData = {
    labels: data?.branchBreakdown.map(b => b.name) || [],
    datasets: [{ label: 'Revenue', data: data?.branchBreakdown.map(b => b.revenue) || [], backgroundColor: COLORS, borderRadius: 8 }]
  };
  const pieData = {
    labels: data?.topCategories.map(c => c.name) || [],
    datasets: [{ data: data?.topCategories.map(c => c.revenue) || [], backgroundColor: COLORS, borderWidth: 2, borderColor: '#fff' }]
  };
  const hourlyData = {
    labels: Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`),
    datasets: [{ label: 'Orders', data: Array.from({ length: 24 }, (_, i) => data?.hourlyDistribution[`${String(i).padStart(2,'0')}:00`]?.orders || 0), backgroundColor: 'rgba(245,158,11,0.8)', borderRadius: 4 }]
  };
  const pmData = {
    labels: data?.paymentBreakdown.map(p => p.method) || [],
    datasets: [{ data: data?.paymentBreakdown.map(p => p.total) || [], backgroundColor: ['#10B981','#6366F1','#F59E0B','#EF4444'], borderWidth: 3, borderColor: '#fff' }]
  };

  return (
    <div className="min-h-screen">
      <main className="min-w-0">
        <div className="p-6 md:p-8 max-w-[1400px] mx-auto pb-24">

          {/* Sticky Header */}
          <div className="sticky top-0 z-20 bg-[#F8FAFC]/95 backdrop-blur-sm -mx-6 px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Business Analytics</h1>
              <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
                {loading ? 'Refreshing data...' : `${branches.find(b => b.id === branch)?.name || 'All Branches'} · ${period}`}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative">
                <select value={branch} onChange={e => setBranch(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-bold py-2.5 pl-4 pr-9 rounded-xl shadow-sm hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 cursor-pointer transition-all">
                  <option value="all">🌐 All Branches</option>
                  {branches.map(b => <option key={b.id} value={b.id}>📍 {b.name}</option>)}
                </select>
                <svg className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
              </div>
              <div className="bg-white rounded-xl p-1 border border-slate-200 flex shadow-sm">
                {['today','weekly','monthly','yearly'].map(p => (
                  <button key={p} onClick={() => setPeriod(p)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${period === p ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>
                    {p === 'today' ? 'Daily' : p[0].toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
              <button onClick={load} disabled={loading} className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm hover:border-indigo-300 transition-all disabled:opacity-50">
                <svg className={`w-4 h-4 text-slate-500 ${loading?'animate-spin':''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium flex items-center gap-3"><span>⚠️ {error}</span><button onClick={load} className="ml-auto text-xs font-bold underline">Retry</button></div>}

          <div className={`space-y-6 transition-opacity duration-200 ${loading ? 'opacity-60 pointer-events-none' : ''}`}>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Revenue', value: `₹${fmt(data?.totalRevenue||0)}`, gr: growth(data?.totalRevenue||0, data?.prevTotalRevenue||0), icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: '#6366F1', bg: '#EEF2FF' },
                { label: 'Total Orders', value: data?.totalOrders || 0, gr: growth(data?.totalOrders||0, data?.prevTotalOrders||0), icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', color: '#F59E0B', bg: '#FFFBEB' },
                { label: 'Avg Ticket', value: `₹${(data?.avgOrderValue||0).toFixed(0)}`, icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: '#10B981', bg: '#ECFDF5' },
                { label: 'Top Products', value: data?.topProducts?.length || 0, icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', color: '#8B5CF6', bg: '#F5F3FF' },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ background: s.bg }}>
                      <svg className="w-5 h-5" fill="none" stroke={s.color} strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={s.icon}/></svg>
                    </div>
                    {s.gr !== undefined && (
                      <div className={`text-[10px] font-bold px-2 py-1 rounded-full ${s.gr >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {s.gr >= 0 ? '↑' : '↓'} {Math.abs(s.gr).toFixed(1)}%
                      </div>
                    )}
                  </div>
                  <div className="text-2xl font-black text-slate-800">{s.value}</div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Revenue + Category Mix */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <div className="flex justify-between items-start mb-5">
                  <div><h3 className="font-bold text-slate-800">Revenue Trend</h3><p className="text-xs text-slate-400">Daily revenue over selected period</p></div>
                  <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg">₹ Revenue</span>
                </div>
                <div className="h-[280px]">
                  {data && Object.keys(data.dailySales).length > 0
                    ? <Line data={lineData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: TT }, scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' }, border: { dash: [4,4] }, ticks: { callback: (v) => `₹${fmt(Number(v))}`, font: { size: 10 } } }, x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 45 } } } }} />
                    : <Empty icon="📊" label="No revenue data for this period" />}
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-5">Category Mix</h3>
                <div className="h-[220px] flex items-center justify-center">
                  {data && data.topCategories.length > 0
                    ? <Pie data={pieData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 12, font: { size: 10, weight: 'bold' }, usePointStyle: true } } } }} />
                    : <Empty icon="🥧" label="No category data" />}
                </div>
              </div>
            </div>

            {/* Product Performance Table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">Top Products</h3>
                  <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg uppercase tracking-wider">Revenue Rank</span>
                </div>
                {data && data.topProducts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <tr><th className="px-6 py-3">#</th><th className="px-6 py-3">Product</th><th className="px-6 py-3 text-center">Qty</th><th className="px-6 py-3 text-right">Revenue</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {data.topProducts.map((p, i) => (
                          <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-6 py-4 text-[10px] font-black text-slate-400">{i+1}</td>
                            <td className="px-6 py-4 font-bold text-slate-700 text-sm">{p.name}</td>
                            <td className="px-6 py-4 text-center font-bold text-slate-500 text-sm">{p.qty}</td>
                            <td className="px-6 py-4 text-right font-black text-indigo-600 text-sm">₹{fmt(p.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <Empty icon="📦" label="No product sales" />}
              </div>

              {/* Peak Hours */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-5">Peak Order Hours</h3>
                <div className="h-[260px]">
                  {data && Object.keys(data.hourlyDistribution).length > 0
                    ? <Bar data={hourlyData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: TT }, scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } }, x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 60, callback: function(val, idx) { return idx % 3 === 0 ? this.getLabelForValue(idx) : ''; } } } } }} />
                    : <Empty icon="⏱️" label="No orders" />}
                </div>
              </div>
            </div>

            {/* DETAILED CATEGORY PERFORMANCE TABLE */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
                  <h3 className="font-bold text-slate-800">Category Detailed Breakdown</h3>
                  <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg uppercase tracking-wider">All Categories</span>
                </div>
                {data && data.topCategories.length > 0 ? (
                  <div className="flex-1 overflow-y-auto max-h-[400px]">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase tracking-widest sticky top-0 z-20 backdrop-blur-md">
                        <tr><th className="px-6 py-3">Category</th><th className="px-6 py-3 text-center">Orders</th><th className="px-6 py-3 text-right">Revenue</th><th className="px-6 py-3 text-right">Mix %</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {data.topCategories.map((c, i) => {
                          const pct = data.totalRevenue > 0 ? ((c.revenue / data.totalRevenue) * 100) : 0;
                          return (
                            <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                              <td className="px-6 py-4 font-bold text-slate-700 text-sm flex items-center gap-3">
                                <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ background: COLORS[i % COLORS.length] }} />
                                {c.name}
                              </td>
                              <td className="px-6 py-4 text-center font-bold text-slate-500 text-sm">{c.orders || 0}</td>
                              <td className="px-6 py-4 text-right font-black text-slate-800 text-sm">₹{fmt(c.revenue)}</td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2.5">
                                  <span className="text-[11px] font-black text-indigo-600 w-10">{pct.toFixed(1)}%</span>
                                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                                    <div className="h-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]" style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : <Empty icon="📂" label="No category data" />}
              </div>

              {/* Payment Mix */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col">
                <h3 className="font-bold text-slate-800 mb-6">Payment Distribution</h3>
                {data && data.paymentBreakdown.length > 0 ? (
                  <div className="flex-1 flex flex-col">
                    <div className="h-[200px] mb-8">
                      <Doughnut data={pmData} options={{ maintainAspectRatio: false, cutout: '75%', plugins: { legend: { display: false }, tooltip: { ...TT, callbacks: { label: (ctx) => ` ₹${fmt(Number(ctx.raw))}` } } } }} />
                    </div>
                    <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                      {data.paymentBreakdown.map((p, i) => {
                        const pct = data.totalRevenue > 0 ? ((p.total / data.totalRevenue) * 100) : 0;
                        const c = ['#10B981','#6366F1','#F59E0B','#EF4444'][i % 4];
                        return (
                          <div key={i}>
                            <div className="flex justify-between items-center text-xs mb-1.5 px-0.5">
                              <span className="font-bold text-slate-500 flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: c }} />{p.method}</span>
                              <span className="font-black text-slate-800">₹{fmt(p.total)} <span className="text-slate-400 font-bold ml-1">({pct.toFixed(1)}%)</span></span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%`, background: c }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : <Empty icon="💳" label="No payment data" />}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
