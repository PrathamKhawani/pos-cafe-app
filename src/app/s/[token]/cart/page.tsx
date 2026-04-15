'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelfOrder } from '../context';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';

export default function SelfCartPage() {
  const { cart, removeFromCart, updateQuantity, updateNote, clearCart, table, token,
    cartCount, subtotal, totalTax, grandTotal, setLastOrderId } = useSelfOrder();
  const { emit } = useSocket();
  const router = useRouter();
  const [placing, setPlacing] = useState(false);
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  
  // Guest Info State
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  async function placeOrder() {
    if (cart.length === 0) { toast.error('Cart is empty'); return; }
    
    // Validate guest info if either field is filled
    if ((guestName || guestPhone) && (!guestName || guestPhone.length < 10)) {
      toast.error('Please provide full name and valid phone');
      return;
    }

    setPlacing(true);
    try {
      let customerId = null;
      
      // 0. Create/Fetch customer if info provided
      if (guestName && guestPhone) {
        const custRes = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: guestName, phone: guestPhone })
        });
        if (custRes.ok) {
          const custData = await custRes.json();
          customerId = custData.id;
        }
      }

      // 1. Create order
      const res = await fetch(`/api/self-order/${token}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          items: cart.map(i => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
            price: i.price,
            tax: i.tax || 0,
          })),
        }),
      });
      const order = await res.json();
      if (!res.ok) { toast.error(order.error || 'Error placing order'); setPlacing(false); return; }

      // 2. Create Razorpay Order
      const rzpRes = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, amount: grandTotal }),
      });
      const rzpData = await rzpRes.json();
      if (!rzpRes.ok) {
        toast.error(rzpData.error || 'Payment initialization failed');
        setPlacing(false);
        return;
      }

      // 3. Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: rzpData.amount,
        currency: rzpData.currency,
        name: "Odoo POS Cafe",
        description: `Order ${order.identifier || order.id.slice(0,8)}`,
        order_id: rzpData.id,
        handler: async function (response: any) {
          const verifyRes = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              internalOrderId: order.id,
              method: 'DIGITAL',
              amount: grandTotal,
            }),
          });

          if (verifyRes.ok) {
            emit('NEW_ORDER', { orderId: order.id, tableNumber: table?.number || 'TA' });
            clearCart();
            setLastOrderId(order.id);
            router.push(`/s/${token}/confirmation?orderId=${order.id}&identifier=${order.identifier}&total=${grandTotal.toFixed(0)}`);
          } else {
            toast.error('Payment verification failed');
            setPlacing(false);
          }
        },
        prefill: { name: guestName, contact: guestPhone },
        theme: { color: "#4f46e5" },
        retry: { enabled: true, max_count: 1 },
        modal: {
          confirm_close: true,
          backdropclose: false,
          escape: false,
          ondismiss: function () { setPlacing(false); }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch {
      toast.error('Network error');
      setPlacing(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen lg:h-screen lg:overflow-hidden bg-[#F8F9FA] text-gray-900">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-2xl border-b border-gray-100 px-4 sm:px-6 py-4 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-gray-100 text-gray-400 flex items-center justify-center hover:bg-gray-50 transition-all active:scale-95">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Your Cart</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{cartCount} item{cartCount !== 1 ? 's' : ''} in total</p>
          </div>
          {table && (
            <div className="bg-gray-900 text-white px-4 py-2 rounded-2xl shadow-lg shadow-gray-900/10 flex flex-col items-end">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter leading-none">Table</span>
              <span className="text-sm font-black tracking-tight">{table.number}</span>
            </div>
          )}
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 space-y-4 overflow-y-auto" style={{ paddingBottom: cart.length > 0 ? '280px' : '120px' }}>
        <AnimatePresence mode="popLayout">
          {cart.map(item => {
            const itemKey = `${item.productId}-${item.variantId || 'base'}`;
            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, x: 20 }}
                key={itemKey}
                className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow relative group"
              >
                <div className="p-4 sm:p-5 flex items-start gap-4">
                  {/* Image/Icon */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-2xl flex-shrink-0 flex items-center justify-center text-3xl overflow-hidden shadow-inner">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : '🍽️'}
                  </div>

                  <div className="flex-1 min-w-0 pt-1">
                    <h3 className="text-base sm:text-lg font-black text-gray-900 truncate leading-tight mb-1 flex items-center">
                       <span className={`flex-shrink-0 inline-flex items-center justify-center w-3 h-3 rounded-sm border ${item.isVegetarian ? 'border-green-600 bg-white' : 'border-red-600 bg-white'} mr-2 relative top-[1px]`}>
                         <span className={`w-1.5 h-1.5 rounded-full ${item.isVegetarian ? 'bg-green-600' : 'bg-red-600'}`}></span>
                       </span>
                       {item.name}
                    </h3>
                    {item.variantName && (
                      <span className="inline-block px-2 py-0.5 bg-gray-50 text-gray-600 rounded-lg text-[10px] font-bold uppercase tracking-wide mb-2">
                        {item.variantName}
                      </span>
                    )}
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-lg font-black text-gray-900 tracking-tight">₹{item.price}</span>
                      {item.tax > 0 && <span className="text-[10px] text-gray-400 font-bold uppercase">+{item.tax}% TAX</span>}
                    </div>
                  </div>

                  {/* Right: Quantity & Subtotal */}
                  <div className="flex flex-col items-end justify-between self-stretch">
                    <button
                      onClick={() => removeFromCart(item.productId, item.variantId)}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    
                    <div className="flex items-center gap-1.5 bg-gray-50 rounded-2xl p-1 shadow-inner border border-gray-100">
                      <button
                        onClick={() => updateQuantity(item.productId, item.variantId, -1)}
                        className="w-8 h-8 rounded-xl bg-white text-gray-600 flex items-center justify-center text-sm font-black shadow-sm hover:scale-105 active:scale-95 transition-all"
                      >−</button>
                      <span className="w-8 text-center text-sm font-black text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.variantId, 1)}
                        className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center text-sm font-black shadow-sm hover:scale-105 active:scale-95 transition-all"
                      >+</button>
                    </div>
                  </div>
                </div>

                {/* Instruction Input */}
                <div className="px-5 pb-5">
                  <div className="group/input relative flex items-center">
                    <div className="absolute left-3 text-gray-400">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </div>
                    <input 
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-9 pr-4 py-2.5 text-xs font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 placeholder:text-gray-400 outline-none transition-all"
                      placeholder="Add cooking instructions..."
                      value={item.note || ''}
                      onChange={e => updateNote(item.productId, item.variantId, e.target.value)}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {cart.length === 0 && (
          <div className="text-center py-32">
            <div className="w-24 h-24 bg-white rounded-[32px] shadow-sm flex items-center justify-center mx-auto mb-6 text-5xl border border-gray-50">🛒</div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Cart is empty</h3>
            <p className="text-sm font-medium text-gray-400 mb-8">Browse the menu to start your meal</p>
            <button
              onClick={() => router.push(`/s/${token}/menu`)}
              className="px-8 py-3.5 bg-gray-900 text-white rounded-2xl text-sm font-black shadow-xl shadow-gray-900/20 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest"
            >Explore Menu</button>
          </div>
        )}
      </div>

      {/* Checkout Footer */}
      {cart.length > 0 && (
        <div className="fixed bottom-[60px] lg:bottom-0 left-0 right-0 bg-white/90 backdrop-blur-3xl border-t border-gray-100 z-40 pb-safe">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            {/* Price Summary */}
            <div className="bg-gray-50 rounded-[32px] p-5 mb-6 space-y-2 border border-gray-100">
              <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                <span>Subtotal ({cartCount} items)</span>
                <span className="text-gray-900 tracking-tight">₹{subtotal.toFixed(0)}</span>
              </div>
              {totalTax > 0 && (
                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <span>Taxes & Charges</span>
                  <span className="text-gray-900 tracking-tight">₹{totalTax.toFixed(0)}</span>
                </div>
              )}
              <div className="h-px bg-gray-200/50 my-2" />
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-sm font-black text-gray-900 uppercase tracking-widest">Amount to Pay</span>
                <span className="text-2xl font-black text-black tracking-tighter">₹{grandTotal.toFixed(0)}</span>
              </div>
            </div>
            {/* Guest Information */}
            <div className="bg-white rounded-[32px] p-6 mb-6 border border-gray-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-indigo-100/50 transition-colors" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900 tracking-tight">Your Details</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-0.5">Optional for better service</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. John Doe"
                      value={guestName}
                      onChange={e => setGuestName(e.target.value)}
                      className="w-full bg-gray-50 border border-transparent rounded-[20px] px-5 py-3.5 text-sm font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                    <input 
                      type="tel" 
                      placeholder="e.g. 9876543210"
                      value={guestPhone}
                      onChange={e => setGuestPhone(e.target.value)}
                      className="w-full bg-gray-50 border border-transparent rounded-[20px] px-5 py-3.5 text-sm font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={placeOrder}
              disabled={placing}
              className="w-full bg-black text-white py-4 sm:py-5 rounded-[24px] text-base font-black shadow-2xl shadow-black/30 hover:bg-gray-900 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest"
            >
              {placing ? (
                <>
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing Order...
                </>
              ) : (
                <>
                  Checkout & Pay
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
