'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface Order {
  id: string; total: number; status: string; createdAt: string;
  user: { name: string };
}

export default function TakeawayPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await fetch('/api/orders?status=SENT&status=PREPARING&status=READY');
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data.filter((o: any) => !o.tableId));
      }
    } catch { toast.error('Failed to sync orders'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); const i = setInterval(load, 5000); return () => clearInterval(i); }, []);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-800 tracking-tight mb-1">Takeaway & Delivery</h1>
          <p className="text-sm font-medium text-neutral-500">Manage express orders without table assignments</p>
        </div>
        <button className="btn-primary py-3 px-6 shadow-md"
          onClick={() => router.push('/pos/order/takeaway')}>
          + New Takeaway Order
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Queue */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-neutral-800 flex items-center gap-2">
            <span className="text-lg">🔥</span> Live Queue
          </h2>
          
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="card p-5 flex items-center justify-between hover:border-primary-300 transition-colors cursor-pointer group"
                   onClick={() => router.push(`/pos/order/takeaway?orderId=${order.id}`)}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-bold text-neutral-800">#{order.id.slice(-6).toUpperCase()}</span>
                    <span className={`badge ${order.status === 'READY' ? 'badge-green' : 'badge-gray'}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-500 font-medium">
                    {order.user?.name} · {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div className="text-lg font-bold text-primary-600">₹{order.total}</div>
                  <div className="w-10 h-10 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
              </div>
            ))}
            
            {orders.length === 0 && !loading && (
              <div className="py-20 flex flex-col items-center border-2 border-dashed border-neutral-200 rounded-xl bg-neutral-50">
                <span className="text-4xl text-neutral-300 mb-3">🛍️</span>
                <p className="text-sm font-semibold text-neutral-500">Queue is clear</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-neutral-800">Overview</h2>
          <div className="card p-5 bg-primary-50 border-primary-100">
             <div className="text-sm font-semibold text-primary-600 mb-1">Active Orders</div>
             <div className="text-3xl font-bold text-primary-800">{orders.length}</div>
          </div>
          <div className="card p-5 bg-neutral-50 border-neutral-200">
             <div className="text-sm font-semibold text-neutral-600 mb-1">Live Volume</div>
             <div className="text-3xl font-bold text-neutral-800">₹{orders.reduce((a, b) => a + b.total, 0)}</div>
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl hidden lg:block">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Pro Tip</p>
            <p className="text-sm text-blue-800 leading-relaxed font-medium">Takeaway orders bypass table management, reducing service latency by approximately 15%.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
