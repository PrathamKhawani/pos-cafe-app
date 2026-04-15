'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';

interface Order {
  id: string;
  tableId: string | null;
  status: string;
  total: number;
  createdAt: string;
  branchId: string;
  table?: {
    number: string;
    floor: {
      name: string;
      branch: { name: string };
    };
  };
  items: any[];
  payment?: any;
}

export default function OrdersPage() {
  const params = useParams();
  const roleSegment = params.role as string;
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  
  // Filters
  const [branch, setBranch] = useState('all');
  const [status, setStatus] = useState('ALL');
  const [orderType, setOrderType] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetch('/api/branches').then(r => r.json()).then(setBranches).catch(console.error);
  }, []);

  const loadOrders = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        branchId: branch,
        status: status,
        orderType: orderType,
        startDate: startDate,
        endDate: endDate,
        search: search,
      });
      
      const res = await fetch(`/api/orders?${query.toString()}`);
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  }, [branch, status, orderType, startDate, endDate, search]);

  useEffect(() => {
    loadOrders(1);
  }, [loadOrders]);

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) return;
    
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      
      if (res.ok) {
        loadOrders(pagination.page);
        setSelectedOrder(null);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to cancel order');
      }
    } catch (error) {
      alert('Error cancelling order');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'PAID': return 'bg-emerald-100 text-emerald-700';
      case 'CANCELLED': return 'bg-rose-100 text-rose-700';
      case 'DRAFT': return 'bg-slate-100 text-slate-600';
      case 'SENT': return 'bg-blue-100 text-blue-700';
      case 'PREPARING': return 'bg-amber-100 text-amber-700';
      case 'READY': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-neutral-100 text-neutral-600';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Order Management</h1>
            <p className="text-sm text-slate-500 mt-1">View history, track status, and manage cancellations</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => loadOrders(pagination.page)}
              className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
              title="Refresh"
            >
              <svg className={`w-5 h-5 text-slate-500 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 items-end">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Search Order</label>
              <div className="relative group">
                <input 
                  type="text" 
                  placeholder="ID / Table..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 text-sm font-bold py-2.5 pl-10 pr-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all placeholder:text-slate-300"
                />
                <svg className="w-4 h-4 text-slate-300 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Branch</label>
              <div className="relative">
                <select 
                  value={branch}
                  onChange={e => setBranch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 text-sm font-bold py-2.5 pl-4 pr-10 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 cursor-pointer appearance-none transition-all"
                >
                  <option value="all">All Branches</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <svg className="w-4 h-4 text-slate-300 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/></svg>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Order Type</label>
              <div className="relative">
                <select 
                  value={orderType}
                  onChange={e => setOrderType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 text-sm font-bold py-2.5 pl-4 pr-10 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 cursor-pointer appearance-none transition-all"
                >
                  <option value="ALL">All Types</option>
                  <option value="DINE_IN">Dine-in</option>
                  <option value="TAKEAWAY">Takeaway</option>
                </select>
                <svg className="w-4 h-4 text-slate-300 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/></svg>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Status</label>
              <div className="relative">
                <select 
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 text-sm font-bold py-2.5 pl-4 pr-10 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 cursor-pointer appearance-none transition-all"
                >
                  <option value="ALL">All Status</option>
                  <option value="PAID">Paid</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="SENT">Sent</option>
                  <option value="PREPARING">Preparing</option>
                  <option value="READY">Ready</option>
                </select>
                <svg className="w-4 h-4 text-slate-300 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/></svg>
              </div>
            </div>

            <div className="lg:col-span-1 xl:col-span-2 grid grid-cols-2 gap-3 items-end">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Date Range</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 text-[11px] font-bold py-2.5 px-3 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all"
                />
              </div>
              <div className="space-y-1.5 relative">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1 opacity-0">To</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 text-[11px] font-bold py-2.5 px-3 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all"
                />
                
                {/* Reset Link Abs Pos to avoid grid shift */}
                <button 
                  onClick={() => { setStartDate(''); setEndDate(''); setBranch('all'); setStatus('ALL'); setOrderType('ALL'); setSearch(''); }}
                  className="absolute -bottom-6 right-1 text-[9px] font-black text-indigo-500 hover:text-indigo-600 uppercase tracking-widest transition-colors py-1"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Order ID / Date</th>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.length > 0 ? orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-800 tracking-tight">#{order.identifier || order.id.slice(0, 8)}</span>
                        <span className="text-[10px] font-bold text-slate-400 mt-0.5">{order.isQrOrder ? 'QR Order' : 'POS Session'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {order.table ? (
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700">Table {order.table.number}</span>
                          <span className="text-[10px] text-slate-400 font-medium tracking-wide">{order.table.floor.name}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          <span className="text-sm font-bold text-slate-500">Takeaway</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-slate-900">
                      ₹{order.total.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="text-[10px] font-black bg-white border border-slate-200 text-slate-500 px-3 py-1.5 rounded-lg hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl">🧾</span>
                        <p className="text-sm font-bold text-slate-400">No orders found matching your criteria</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Showing {orders.length} of {pagination.total} orders
              </span>
              <div className="flex gap-2">
                <button 
                  disabled={pagination.page === 1}
                  onClick={() => loadOrders(pagination.page - 1)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-500 disabled:opacity-30 hover:border-indigo-500 transition-all"
                >
                  Prev
                </button>
                <div className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] font-black text-indigo-600">
                  {pagination.page} / {pagination.pages}
                </div>
                <button 
                  disabled={pagination.page === pagination.pages}
                  onClick={() => loadOrders(pagination.page + 1)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-500 disabled:opacity-30 hover:border-indigo-500 transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">Order Details</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">#{selectedOrder.identifier || selectedOrder.id}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {/* Order Summary */}
              <div className="flex items-center justify-between mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Status</div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total Amount</div>
                  <div className="text-xl font-black text-slate-900">₹{selectedOrder.total}</div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4 mb-8">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Items Summary</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item: any) => (
                    <div key={item.id} className={`flex items-center justify-between p-3 border rounded-xl transition-all ${item.isCancelled ? 'bg-slate-50 border-slate-100 opacity-50 grayscale' : 'bg-white border-slate-100 shadow-sm'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${item.isCancelled ? 'bg-slate-200 text-slate-400' : 'bg-indigo-50 text-indigo-500'}`}>
                          {item.quantity}x
                        </div>
                        <div>
                          <div className={`text-sm font-bold ${item.isCancelled ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{item.product?.name || 'Product'}</div>
                          {item.variant && <div className="text-[10px] text-slate-400 font-bold">{item.variant.attribute}: {item.variant.value}</div>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`text-sm font-black ${item.isCancelled ? 'text-slate-400' : 'text-slate-900'}`}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</div>
                        {!item.isCancelled && selectedOrder.status !== 'CANCELLED' && selectedOrder.status !== 'PAID' && (
                          <button 
                            onClick={async () => {
                              if(!confirm('Cancel this item?')) return;
                              setIsUpdating(true);
                              try {
                                const res = await fetch(`/api/orders/${selectedOrder.id}/items/${item.id}/cancel`, { method: 'PATCH' });
                                if(res.ok) {
                                  const updated = await res.json();
                                  setSelectedOrder(updated);
                                  loadOrders(pagination.page);
                                  toast.success('Item cancelled');
                                }
                              } catch { toast.error('Failed to cancel item'); }
                              finally { setIsUpdating(false); }
                            }}
                            className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all"
                            title="Cancel Item"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Branch Detail */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Date & Time</div>
                  <div className="text-sm font-bold text-slate-700">{formatDate(selectedOrder.createdAt)}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Order Type</div>
                  <div className="text-sm font-bold text-slate-700">{selectedOrder.tableId ? 'Dine-in' : 'Takeaway'}</div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50/80 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="flex-1 py-3 bg-white border border-slate-200 text-slate-500 text-sm font-black rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
              >
                Close
              </button>
              {selectedOrder.status !== 'CANCELLED' && (
                <button 
                  disabled={isUpdating}
                  onClick={() => handleCancelOrder(selectedOrder.id)}
                  className="flex-1 py-3 bg-rose-600 text-white text-sm font-black rounded-2xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 active:scale-95 disabled:opacity-50"
                >
                  {isUpdating ? 'Updating...' : 'Cancel Order'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
