'use client';
import { useCallback, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import useSWR, { mutate } from 'swr';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface OrderItem { id: string; productId: string; quantity: number; isPrepared: boolean; note?: string; product: { name: string; isVegetarian: boolean }; }
interface Order { id: string; status: string; createdAt: string; isQrOrder: boolean; items: OrderItem[]; table?: { number: string; floor?: { name: string; branch?: { name: string } } }; payment?: any; }

const COLS = [
  { s: 'SENT', l: 'New Orders', color: '#ef4444', bg: '#fef2f2', btn: 'Start Preparing', next: 'PREPARING' },
  { s: 'PREPARING', l: 'Preparing', color: '#f59e0b', bg: '#fffbeb', btn: 'Mark Ready', next: 'READY' },
  { s: 'READY', l: 'Ready', color: '#10b981', bg: '#ecfdf5', btn: 'Delivered', next: 'DELIVERED' },
];

export default function KitchenPage() {
  const [activeTab, setActiveTab] = useState('SENT');
  const { data: sentData } = useSWR('/api/orders?status=SENT', fetcher, { refreshInterval: 3000 });
  const { role: urlRole } = useParams() as { role: string };
  const isReadOnly = urlRole === 'staff';
  const { data: preparingData } = useSWR('/api/orders?status=PREPARING', fetcher, { refreshInterval: 3000 });
  const { data: readyData } = useSWR('/api/orders?status=READY&limit=20', fetcher, { refreshInterval: 3000 });

  const orders = useMemo(() => {
    const combined = [
      ...(sentData?.orders || []),
      ...(preparingData?.orders || []),
      ...(readyData?.orders || [])
    ];
    return combined.sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [sentData, preparingData, readyData]);

  const onSocketEvent = useCallback((event: string) => {
    if (event === 'NEW_ORDER') {
      toast.success('New order received! 🛎️');
      mutate('/api/orders?status=SENT');
    } else if (event === 'UPDATE_ORDER_STATUS' || event === 'PAYMENT_DONE') {
      mutate('/api/orders?status=SENT');
      mutate('/api/orders?status=PREPARING');
      mutate('/api/orders?status=READY&limit=20');
    }
  }, []);

  const { emit } = useSocket(onSocketEvent);

  async function moveStatus(order: Order, nextStatus: string) {
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!res.ok) throw new Error();
      emit('UPDATE_ORDER_STATUS', { orderId: order.id, status: nextStatus });
      mutate('/api/orders?status=SENT');
      mutate('/api/orders?status=PREPARING');
      mutate('/api/orders?status=READY&limit=20');
    } catch {
      toast.error('Failed to update status');
    }
  }

  async function toggleItem(orderId: string, itemId: string, isP: boolean) {
    try {
      await fetch(`/api/orders/${orderId}/items`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, isPrepared: !isP })
      });
      emit('ITEM_PREPARED', { orderId, itemId, isPrepared: !isP });
      mutate('/api/orders?status=SENT');
      mutate('/api/orders?status=PREPARING');
    } catch {
      toast.error('Failed to update item');
    }
  }

  function getCount(status: string) {
    return orders.filter((o: Order) => o.status === status).length;
  }

  return (
    <div className="h-screen bg-[#f8fafc] flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="px-4 sm:px-6 py-3 bg-white border-b border-slate-200 flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-lg flex justify-center items-center text-lg">👨‍🍳</div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">Kitchen Display</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-semibold text-slate-400">Live Sync</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {COLS.map(c => (
            <span key={c.s} className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold"
                  style={{ background: c.bg, color: c.color }}>
              {getCount(c.s)}
            </span>
          ))}
        </div>
      </header>

      {/* Mobile Tabs */}
      <div className="lg:hidden flex bg-white border-b border-slate-200 shrink-0">
        {COLS.map(c => {
          const count = getCount(c.s);
          return (
            <button
              key={c.s}
              onClick={() => setActiveTab(c.s)}
              className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider relative transition-colors ${
                activeTab === c.s ? 'text-slate-800' : 'text-slate-400'
              }`}
            >
              {c.l.split(' ')[0]}
              {count > 0 && (
                <span className="ml-1 inline-flex w-5 h-5 items-center justify-center rounded-full text-[10px] text-white font-bold" style={{ background: c.color }}>
                  {count}
                </span>
              )}
              {activeTab === c.s && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full" style={{ background: c.color }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6">
        {/* Desktop: 3 columns */}
        <div className="hidden lg:grid grid-cols-3 gap-4 h-full items-start">
          {COLS.map(c => (
            <KitchenColumn key={c.s} col={c} orders={orders.filter((o: Order) => o.status === c.s)}
              onMove={moveStatus} onToggle={toggleItem} isReadOnly={isReadOnly} />
          ))}
        </div>

        {/* Mobile/Tablet: Single column based on active tab */}
        <div className="lg:hidden">
          {COLS.filter(c => c.s === activeTab).map(c => (
            <KitchenColumn key={c.s} col={c} orders={orders.filter((o: Order) => o.status === c.s)}
              onMove={moveStatus} onToggle={toggleItem} isReadOnly={isReadOnly} />
          ))}
        </div>
      </div>
    </div>
  );
}

function KitchenColumn({ col, orders, onMove, onToggle, isReadOnly }: {
  col: typeof COLS[0];
  orders: Order[];
  onMove: (order: Order, status: string) => void;
  onToggle: (orderId: string, itemId: string, isPrepared: boolean) => void;
  isReadOnly: boolean;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col max-h-full overflow-hidden">
      <div className="p-3 border-b border-slate-100 flex justify-between items-center shrink-0" style={{ background: col.bg }}>
        <span className="font-bold uppercase tracking-wider text-xs" style={{ color: col.color }}>
          {col.l} ({orders.length})
        </span>
      </div>
      <div className="p-3 flex-1 overflow-y-auto space-y-3">
        {orders.map((o: Order) => (
          <div key={o.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-semibold">{o.table?.floor ? (o.table.floor.branch?.name ? `${o.table.floor.branch.name} - ${o.table.floor.name}` : o.table.floor.name) : 'Takeaway'}</span>
                  {o.isQrOrder && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 text-indigo-600 uppercase tracking-tight">QR</span>
                  )}
                  {o.payment && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-600 uppercase tracking-tight">Paid</span>
                  )}
                </div>
                <div className="text-sm sm:text-base font-bold text-slate-800">
                  {o.table ? `Table ${o.table.number}` : 'Takeaway Order'}
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {new Date(o.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="p-3 space-y-1.5">
              {o.items.map((item: OrderItem) => (
                <div key={item.id} onClick={() => !isReadOnly && onToggle(o.id, item.id, item.isPrepared)}
                     className={`p-2 rounded-lg border transition-colors ${
                       isReadOnly ? 'cursor-default' : 'cursor-pointer'
                     } ${
                       item.isPrepared ? 'bg-slate-50 border-transparent opacity-50' : 'bg-white border-slate-100 hover:border-slate-300'
                     }`}>
                  <div className="flex items-start gap-2.5">
                    <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border text-xs ${
                      item.isPrepared ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300'
                    }`}>{item.isPrepared && '✓'}</div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                        <span className={`flex-shrink-0 inline-flex items-center justify-center w-3 h-3 rounded-sm border ${item.product?.isVegetarian ? 'border-green-600 bg-white' : 'border-red-600 bg-white'} align-middle`}>
                           <span className={`w-1.5 h-1.5 rounded-full ${item.product?.isVegetarian ? 'bg-green-600' : 'bg-red-600'}`}></span>
                        </span>
                        <span className="text-indigo-600 bg-indigo-50 px-1 rounded text-xs ml-0.5">{item.quantity}×</span>
                        <span className={item.isPrepared ? 'line-through text-slate-400' : 'text-slate-800'}>{item.product?.name}</span>
                      </div>
                      {item.note && <div className="text-[10px] font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded mt-1 inline-block">📝 {item.note}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {!isReadOnly && (
              <button onClick={() => onMove(o, col.next)}
                className="w-full py-2.5 text-white font-bold text-xs sm:text-sm hover:opacity-90 transition-opacity shrink-0"
                style={{ background: col.color }}>
                {col.btn}
              </button>
            )}
          </div>
        ))}
        {orders.length === 0 && (
          <div className="py-16 text-center text-slate-300 font-semibold text-sm">
            <div className="text-3xl mb-2">🍽️</div>
            No orders
          </div>
        )}
      </div>
    </div>
  );
}
