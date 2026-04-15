'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/frontend/components/Header';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  async function fetchCustomers() {
    try {
      setLoading(true);
      const res = await fetch(`/api/customers?search=${search}`);
      const data = await res.json();
      setCustomers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function viewCustomer(customer: any) {
    setSelectedCustomer(customer);
    setOrdersLoading(true);
    try {
      const res = await fetch(`/api/orders?customerId=${customer.id}`);
      const data = await res.json();
      setCustomerOrders(data.orders || []);
    } catch (e) {
      console.error(e);
    } finally {
      setOrdersLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#F8F9FA]">
      <Header title="Customers" />

      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto">
          {/* Search & Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex items-center gap-4">
              <div className="relative flex-1 group">
                <input 
                  type="text" 
                  placeholder="Search by name or phone..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 text-sm font-bold py-3 pl-10 pr-4 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all placeholder:text-slate-300"
                />
                <svg className="w-5 h-5 text-slate-300 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </div>
            </div>
            <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-indigo-200 flex flex-col justify-center">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Total Records</div>
              <div className="text-3xl font-black">{customers.length} Guests</div>
            </div>
          </div>

          {/* Customer List */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50 bg-slate-50/50">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer Name</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Phone Number</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Orders</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Last Visit</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-300 font-bold uppercase tracking-widest animate-pulse">Loading Records...</td></tr>
                  ) : customers.length === 0 ? (
                    <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-300 font-bold uppercase tracking-widest">No customers found</td></tr>
                  ) : customers.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 font-black flex items-center justify-center text-sm shadow-sm">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-black text-slate-800 tracking-tight">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-bold text-slate-500 tracking-tight">{c.phone}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-600 uppercase tracking-wider">{c._count?.orders || 0} Orders</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-bold text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button 
                          onClick={() => viewCustomer(c)}
                          className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                        >
                          View History
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Detail Overlay */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setSelectedCustomer(null)} />
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white text-2xl font-black flex items-center justify-center shadow-lg shadow-indigo-200">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selectedCustomer.name}</h3>
                  <p className="text-sm font-bold text-slate-400 tracking-wide">{selectedCustomer.phone}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="w-12 h-12 rounded-2xl bg-white text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center shadow-sm"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Purchase History</h4>
              {ordersLoading ? (
                <div className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest animate-pulse">Fetching history...</div>
              ) : customerOrders.length === 0 ? (
                <div className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest">No orders recorded for this guest</div>
              ) : (
                <div className="space-y-4">
                  {customerOrders.map(order => (
                    <div key={order.id} className="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-between group">
                      <div className="flex items-center gap-8">
                        <div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Order ID</div>
                          <div className="text-sm font-black text-slate-800">{order.identifier || order.id.slice(0, 8)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Date</div>
                          <div className="text-sm font-bold text-slate-600">{new Date(order.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Items</div>
                          <div className="text-sm font-bold text-slate-600 truncate max-w-[200px]">
                            {order.items.map((it: any) => `${it.quantity}x ${it.product.name}`).join(', ')}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-slate-900 tracking-tighter">₹{order.total.toFixed(0)}</div>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${order.status === 'PAID' ? 'text-green-500' : 'text-amber-500'}`}>{order.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
