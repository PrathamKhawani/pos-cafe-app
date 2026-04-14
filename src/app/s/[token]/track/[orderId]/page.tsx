'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';

interface OrderItem {
  id: string; quantity: number; isPrepared: boolean;
  product: { name: string; imageUrl?: string; isVegetarian: boolean };
  variant?: { attribute: string; value: string } | null;
}
interface Order {
  id: string; status: string; total: number; createdAt: string;
  items: OrderItem[];
  table?: { number: string; floor?: { name: string } } | null;
}

const STATUS_FLOW = ['SENT', 'PREPARING', 'READY', 'DELIVERED'];
const STATUS_META: Record<string, { label: string; icon: string; description: string; color: string }> = {
  SENT: { label: 'Order Placed', icon: '📋', description: 'Your order has been received', color: '#111827' },
  PREPARING: { label: 'Preparing', icon: '👨‍🍳', description: 'Our chefs are working on your order', color: '#374151' },
  READY: { label: 'Ready', icon: '✅', description: 'Your order is ready for pickup!', color: '#000000' },
  DELIVERED: { label: 'Delivered', icon: '🎉', description: 'Enjoy your meal!', color: '#000000' },
  PAID: { label: 'Completed', icon: '💳', description: 'Payment received.', color: '#000000' },
};

export default function TrackPage({ params }: { params: { token: string; orderId: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${params.orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [params.orderId]);

  // Socket.IO real-time updates
  const onSocketEvent = useCallback((event: string, data: any) => {
    if (event === 'ORDER_STATUS_CHANGED' && data.orderId === params.orderId) {
      loadOrder(); // Reload full order data when status changes
    }
    if (event === 'UPDATE_ORDER_STATUS' && data.orderId === params.orderId) {
      loadOrder();
    }
    if (event === 'ITEM_PREPARED' && data.orderId === params.orderId) {
      loadOrder();
    }
  }, [params.orderId, loadOrder]);

  const { emit } = useSocket(onSocketEvent);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  // Join order room for targeted updates when socket is ready
  useEffect(() => {
    if (emit && params.orderId) {
      emit('JOIN_ORDER', params.orderId);
    }
  }, [emit, params.orderId]);

  // Fallback polling every 10s (in case socket connection drops)
  useEffect(() => {
    const interval = setInterval(loadOrder, 10000);
    return () => clearInterval(interval);
  }, [loadOrder]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold text-gray-400">Loading order...</p>
      </div>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">🔍</div>
        <p className="text-sm font-semibold text-gray-500">Order not found</p>
        <button onClick={() => router.push(`/s/${params.token}/menu`)} className="mt-4 text-sm font-semibold text-black hover:underline">Back to Menu</button>
      </div>
    </div>
  );

  const currentIndex = STATUS_FLOW.indexOf(order.status);
  const isPaid = order.status === 'PAID';
  const currentMeta = STATUS_META[order.status] || STATUS_META.SENT;
  const preparedCount = order.items.filter(i => i.isPrepared).length;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 pb-24">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-gray-100 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(`/s/${params.token}/menu`)} className="w-9 h-9 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-base font-bold">Order Tracking</h1>
            <p className="text-[11px] text-gray-400 font-medium">#{order.id.slice(-6).toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-semibold text-gray-400">Live</span>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-5 space-y-5 max-w-lg mx-auto">
        {/* Current Status Hero */}
        <motion.div
          key={order.status}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 text-center relative overflow-hidden"
        >
          {/* Estimated Time Badge */}
          {(order.status !== 'DELIVERED' && order.status !== 'CANCELLED') && (
            <div className="absolute top-4 right-4 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
              <svg className="w-3.5 h-3.5 text-black animate-spin-slow" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-[10px] font-extrabold text-black uppercase tracking-widest">
                ETA: {
                  (() => {
                    const unpreparedCount = order.items.filter(i => !i.isPrepared).reduce((sum, i) => sum + i.quantity, 0);
                    const baseTime = ['SENT', 'PAID', 'PENDING'].includes(order.status) ? 12 : (order.status === 'PREPARING' ? 6 : 2);
                    return baseTime + (unpreparedCount * 2);
                  })()
                } MIN
              </span>
            </div>
          )}

          <motion.div
            key={order.status + '-icon'}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 12 }}
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg"
            style={{ background: currentMeta.color + '15', boxShadow: `0 8px 24px ${currentMeta.color}20` }}
          >
            {currentMeta.icon}
          </motion.div>
          <h2 className="text-lg font-extrabold text-gray-900 mb-1">{currentMeta.label}</h2>
          <p className="text-sm text-gray-500">{currentMeta.description}</p>
        </motion.div>

        {/* Progress Stepper */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="relative">
            {STATUS_FLOW.map((statusItem, idx) => {
              const meta = STATUS_META[statusItem];
              
              // Robust status mapping
              let displayIndex = STATUS_FLOW.indexOf(order.status);
              if (displayIndex === -1) {
                // If status is PAID or unknown, but not DELIVERED or CANCELLED, treat it as SENT or moving towards PREPARING
                if (order.status === 'PAID') displayIndex = 0;
                else displayIndex = 0; 
              }

              const isDone = displayIndex >= idx;
              // If status is DELIVERED, nothing should be 'current/in-progress'
              const isCurrent = order.status === 'DELIVERED' ? false : (displayIndex === idx);
              const isPast = displayIndex > idx;
              const isLast = idx === STATUS_FLOW.length - 1;

              return (
                <div key={statusItem} className="flex items-start gap-4 relative">
                  {/* Timeline dot + line */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <motion.div
                      animate={{
                        scale: isCurrent ? [1, 1.15, 1] : 1,
                        boxShadow: isCurrent ? [`0 0 0 0px ${meta.color}30`, `0 0 0 8px ${meta.color}15`, `0 0 0 0px ${meta.color}30`] : 'none'
                      }}
                      transition={{ duration: 2, repeat: isCurrent ? Infinity : 0 }}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg z-10 border-2 transition-all duration-500 ${
                        isDone
                          ? 'text-white border-transparent shadow-md'
                          : 'bg-gray-50 border-gray-100 text-gray-300'
                      }`}
                      style={isDone ? { background: meta.color } : {}}
                    >
                      {isDone ? (isCurrent ? meta.icon : '✓') : meta.icon}
                    </motion.div>
                    {!isLast && (
                      <div className="w-0.5 h-8 my-1 rounded-full overflow-hidden bg-gray-100 relative">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ 
                            height: isPast ? '100%' : (isCurrent ? '100%' : '0%'),
                            opacity: isCurrent ? [0.4, 1, 0.4] : 1
                          }}
                          transition={{ 
                            duration: isCurrent ? 2 : 0.6, 
                            repeat: isCurrent ? Infinity : 0,
                            delay: isPast ? 0.2 : 0 
                          }}
                          className="absolute top-0 left-0 w-full rounded-full"
                          style={{ background: meta.color }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Label */}
                  <div className={`pt-2 pb-4 ${!isDone && !isCurrent ? 'opacity-40' : ''}`}>
                    <p className={`text-sm font-bold ${isDone ? 'text-gray-900' : 'text-gray-400'}`}>{meta.label}</p>
                    <p className="text-[11px] text-gray-400">{meta.description}</p>
                    {isCurrent && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="flex gap-0.5">
                          <span className="w-1 h-1 bg-black rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                          <span className="w-1 h-1 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <span className="w-1 h-1 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                        <span className="text-[10px] font-semibold text-gray-900 ml-1">In progress</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Items List */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order Items</h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-gray-50 text-gray-500">
              {preparedCount}/{order.items.length} ready
            </span>
          </div>
          <div className="space-y-2.5">
            {order.items.map(item => (
              <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                item.isPrepared ? 'bg-emerald-50/50' : 'bg-gray-50/50'
              }`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  item.isPrepared
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-400'
                }`}>
                  {item.isPrepared ? '✓' : item.quantity}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${item.isPrepared ? 'text-gray-400 line-through' : 'text-gray-900'} flex items-center`}>
                    <span className={`flex-shrink-0 inline-flex items-center justify-center w-3 h-3 rounded-sm border ${item.product.isVegetarian ? 'border-green-600 bg-white' : 'border-red-600 bg-white'} mr-1.5`}>
                       <span className={`w-1.5 h-1.5 rounded-full ${item.product.isVegetarian ? 'bg-green-600' : 'bg-red-600'}`}></span>
                    </span>
                    {item.quantity > 1 && !item.isPrepared && <span className="text-black font-black mr-1">{item.quantity}×</span>}
                    {item.product.name}
                  </p>
                  {item.variant && (
                    <p className="text-[10px] text-gray-400">{item.variant.attribute}: {item.variant.value}</p>
                  )}
                </div>
                {item.isPrepared && (
                  <span className="text-[10px] font-semibold text-emerald-500 flex-shrink-0">Ready</span>
                )}
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex justify-between items-baseline mt-4 pt-3 border-t border-gray-100">
            <span className="text-xs font-semibold text-gray-400">Total</span>
            <span className="text-lg font-extrabold text-gray-900">₹{order.total.toFixed(0)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => router.push(`/s/${params.token}/invoice/${params.orderId}`)}
            className="flex-1 bg-white text-gray-700 py-3 rounded-2xl text-sm font-semibold border border-gray-200 flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View Invoice
          </button>
          <button
            onClick={() => router.push(`/s/${params.token}/menu`)}
            className="flex-1 bg-white text-gray-700 py-3 rounded-2xl text-sm font-semibold border border-gray-200 flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
          >
            Order More
          </button>
        </div>

        {/* Real-time indicator */}
        <div className="text-center pt-2">
          <div className="flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <p className="text-[10px] font-semibold text-gray-300">Real-time updates via live connection</p>
          </div>
        </div>
      </div>
    </div>
  );
}
