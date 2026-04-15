'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useCartStore } from '@/stores/useCartStore';
import Link from 'next/link';
import { useDragScroll } from '@/hooks/useDragScroll';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  id: string; name: string; price: number; tax: number; uom?: string; description?: string; isVegetarian: boolean;
  imageUrl?: string;
  category: { id: string; name: string; color: string };
  variants: Array<{ id: string; attribute: string; value: string; extraPrice: number }>;
}
interface Category { id: string; name: string; color: string; }
interface POSConfig { cashEnabled: boolean; digitalEnabled: boolean; razorpayTerminalId?: string; }


export default function OrderPage() {
  const router = useRouter();
  const params = useParams();
  const tableId = params.tableId as string;
  const role = params.role as string;

  const { items, addItem, removeItem, updateQty, updateNote, clearCart, subtotal, totalTax, total, setTable, setSession, setOrderId, sessionId } = useCartStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [config, setConfig] = useState<POSConfig | null>(null);
  const [activeCat, setActiveCat] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [vegFilter, setVegFilter] = useState<'all' | 'veg' | 'nonveg'>('all');
  const [tableInfo, setTableInfo] = useState<{ number: string } | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [payMethod, setPayMethod] = useState<'CASH' | 'DIGITAL'>('CASH');
  const [showQR, setShowQR] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderIdState] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, { id: string; price: number; value: string }>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Customer State
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string, name: string, phone: string } | null>(null);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');

  // Search Customers
  useEffect(() => {
    if (customerSearch.length >= 3) {
      const delay = setTimeout(async () => {
        const res = await fetch(`/api/customers?search=${customerSearch}`);
        if (res.ok) setCustomerResults(await res.json());
      }, 300);
      return () => clearTimeout(delay);
    } else {
      setCustomerResults([]);
    }
  }, [customerSearch]);

  const createCustomer = async () => {
    if (!newName.trim()) return toast.error('Full Name is required');
    if (!customerSearch.trim() || customerSearch.length < 10) return toast.error('Valid 10-digit Phone is required');
    
    try {
      setLoading(true);
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, phone: customerSearch })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedCustomer(data);
        setShowCustomerSearch(false);
        setIsAddingNew(false);
        setNewName('');
        setCustomerSearch('');
        toast.success('Customer added');
      }
    } catch { toast.error('Failed to create customer'); } finally { setLoading(false); }
  };

  const menuDrag = useDragScroll();
  const cartDrag = useDragScroll();

  useEffect(() => {
    setTable(tableId);
    async function load() {
      try {
        const [prRes, caRes, cfRes, sessionRes, tableRes] = await Promise.all([
          fetch('/api/products').catch(() => null), fetch('/api/categories').catch(() => null),
          fetch('/api/pos-config').catch(() => null), fetch('/api/sessions').catch(() => null),
          fetch('/api/tables').catch(() => null)
        ]);

        if (prRes && prRes.ok) setProducts(await prRes.json());
        if (caRes && caRes.ok) setCategories(await caRes.json());
        if (cfRes && cfRes.ok) setConfig(await cfRes.json());
        
        if (sessionRes && sessionRes.ok) {
           const sessionList = await sessionRes.json();
           const open = Array.isArray(sessionList) ? sessionList.find((s: any) => !s.closedAt) : null;
           if (open) setSession(open.id);
        }
        
        if (tableRes && tableRes.ok && tableId !== 'takeaway') {
           const tableList = await tableRes.json();
           const t = Array.isArray(tableList) ? tableList.find((tt: any) => tt.id === tableId) : null;
           if (t) setTableInfo(t);
        }
      } catch (e) {
        console.error('Failed to load POS data');
      }
    }
    load();
  }, [tableId, setTable, setSession]);

  // Sync Cart with Customer Display
  useEffect(() => {
    async function sync() {
      try {
        const { io } = await import('socket.io-client');
        const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
        socket.emit('ORDER_UPDATE', { tableId: tableId, items, total: total() });
        setTimeout(() => socket.disconnect(), 1000);
      } catch {}
    }
    sync();
  }, [items, total, tableId]);

  const filtered = Array.isArray(products) ? products.filter(p =>
    (activeCat === 'all' || p?.category?.id === activeCat) &&
    (p?.name?.toLowerCase().includes(search.toLowerCase())) &&
    (vegFilter === 'all' || (vegFilter === 'veg' ? p.isVegetarian : !p.isVegetarian))
  ) : [];

  const handleProductClick = (product: Product) => {
    // If we just finished a drag-scroll, don't trigger a click
    if (menuDrag.isDragging.current) return;
    
    if (product.variants && product.variants.length > 0) {
      setSelectedProduct(product);
      setSelectedVariants({});
    } else {
      addItem({ productId: product.id, name: product.name, price: product.price, tax: product.tax, quantity: 1 });
      toast.success('Added to cart');
    }
  };

  const confirmVariant = () => {
    if (!selectedProduct) return;
    const extra = Object.values(selectedVariants).reduce((s, v) => s + v.price, 0);
    const variantNames = Object.values(selectedVariants).map(v => v.value).join(', ');
    
    addItem({ 
      productId: selectedProduct.id, 
      variantId: Object.values(selectedVariants)[0]?.id,
      name: `${selectedProduct.name}${variantNames ? ` (${variantNames})` : ''}`, 
      price: selectedProduct.price + extra, 
      tax: selectedProduct.tax, 
      quantity: 1 
    });
    
    setSelectedProduct(null);
    toast.success('Item added');
  };

  async function sendToKitchen() {
    if (items.length === 0) { toast.error('Cart is empty'); return; }
    if (!selectedCustomer) { toast.error('Please select or add a guest first'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tableId: tableId === 'takeaway' ? undefined : tableId, 
          sessionId, 
          customerId: selectedCustomer?.id,
          items: items.map(i => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity, price: i.price, tax: i.tax, note: i.note })) 
        })
      });
      const order = await res.json();
      
      setOrderIdState(order.id);
      setOrderId(order.id);

      toast.success(`Order ${order.identifier || ''} created.`);
      setShowPayment(true);
    } catch { toast.error('Failed to create order'); } finally { setLoading(false); }
  }

  async function handlePay() {
    if (!orderId) { toast.error('Send to kitchen first'); return; }
    if (payMethod === 'CASH') { confirmPay(); return; }

    setLoading(true);

    if (config?.razorpayTerminalId) {
      try {
        const res = await fetch('/api/razorpay/terminal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, amount: total(), terminalId: config.razorpayTerminalId })
        });
        const data = await res.json();
        if (data.success) {
          toast.success('Payment request sent to Terminal');
          const { io } = await import('socket.io-client');
          const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
          socket.emit('PAYMENT_REQUEST', { tableId: tableId, orderId, total: total(), method: 'TERMINAL' });
          return;
        }
      } catch (err) {
        console.error('Terminal error:', err);
      }
    }

    try {
      const res = await fetch('/api/razorpay/order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, amount: total() })
      });
      const data = await res.json();
      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      
      if (!razorpayKey || razorpayKey.includes('placeholder')) {
        toast.error('Razorpay test mode active (requires valid keys)');
        setTimeout(confirmPay, 1000);
        return;
      }

      const options = {
        key: razorpayKey, amount: data.amount, currency: data.currency,
        name: "Cafe POS", description: `Order #${orderId.slice(-6)}`, order_id: data.id,
        handler: async function (response: any) {
          const verifyRes = await fetch('/api/razorpay/verify', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature, internalOrderId: orderId, method: payMethod, amount: total()
            })
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            finishPaymentFlow();
            // Notify kitchen after payment verification
            try {
              const { io } = await import('socket.io-client');
              const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
              socket.emit('NEW_ORDER');
              socket.emit('ORDER_UPDATE', { orderId: orderId, status: 'SENT' });
              setTimeout(() => socket.disconnect(), 1000);
            } catch (err) {
              console.error('Socket notification error:', err);
            }
          } else { 
            toast.error('Payment verification failed'); 
          }
        },
        prefill: { name: "", email: "", contact: "" },
        theme: { color: "#7C5C3E" },
        modal: {
          backdropclose: false,
          escape: false,
          confirm_close: true
        }
      };
      new (window as any).Razorpay(options).open();
    } catch (err) { toast.error('Payment integration error'); } finally { setLoading(false); }
  }

  async function confirmPay() {
    if (!orderId) return;
    setLoading(true);
    try {
      await fetch(`/api/orders/${orderId}/pay`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: payMethod, amount: total() })
      });
      try {
        const { io } = await import('socket.io-client');
        const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
        socket.emit('PAYMENT_DONE'); 
        socket.emit('NEW_ORDER');
        socket.emit('ORDER_UPDATE', { orderId: orderId, status: 'SENT' });
        setTimeout(() => socket.disconnect(), 1000);
      } catch {}
      finishPaymentFlow();
    } catch { toast.error('Payment error'); } finally { setLoading(false); }
  }
  
  function finishPaymentFlow() {
      setShowQR(false); 
      setShowPayment(false); 
      setShowThankYou(true);
      clearCart();
      setTimeout(() => { 
        setShowThankYou(false); 
        setOrderIdState(null); 
        router.push(`/${role}/pos/floor`); 
      }, 2500);
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-60px)] bg-[#F5F3EF] overflow-hidden animate-fade-in font-sans relative">
      {/* Left: Menu Area */}
      <div className={`flex-1 flex flex-col border-r border-neutral-200 z-10 w-full min-w-0 ${isCartOpen ? 'hidden lg:flex' : 'flex'}`}>
        
        {/* Top Bar Navigation */}
        <div className="bg-white px-6 py-4 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push(tableId === 'takeaway' ? `/${role}/pos/takeaway` : `/${role}/pos/floor`)} className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200 flex items-center justify-center transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div>
              <h2 className="text-xl font-bold text-neutral-800 leading-tight">
                {tableId === 'takeaway' ? 'Express Takeaway' : `Table ${tableInfo?.number || tableId}`}
              </h2>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mt-0.5">Order Terminal</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200 shadow-sm shrink-0">
              <button onClick={() => setVegFilter('all')}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${vegFilter === 'all' ? 'bg-white text-primary-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
                All
              </button>
              <button onClick={() => setVegFilter('veg')}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${vegFilter === 'veg' ? 'bg-white text-green-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Veg
              </button>
              <button onClick={() => setVegFilter('nonveg')}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${vegFilter === 'nonveg' ? 'bg-white text-red-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Non-Veg
              </button>
            </div>

            <div className="relative w-full max-w-xs shrink-0 hidden md:block">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </span>
              <input className="input !pl-9 !py-2 !h-10 text-sm" placeholder="Search menu..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex gap-2 px-6 py-3 overflow-x-auto bg-white border-b border-neutral-200 no-scrollbar shrink-0 shadow-sm">
          <button onClick={() => setActiveCat('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap uppercase tracking-wider ${activeCat === 'all' ? 'bg-primary-600 text-white shadow-sm' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}>All Items</button>
          
          {categories.map(c => (
            <button key={c.id} onClick={() => setActiveCat(c.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap uppercase tracking-wider ${activeCat === c.id ? 'text-white shadow-sm ring-1 ring-black/10' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
              style={activeCat === c.id ? { background: c.color } : {}}>
              {c.name}
            </button>
          ))}
        </div>

        <div 
          ref={menuDrag.ref}
          onMouseDown={menuDrag.onMouseDown}
          className="flex-1 overflow-y-auto min-h-0 w-full p-4 md:p-6 bg-[#F5F3EF] custom-scrollbar scroll-smooth cursor-grab active:cursor-grabbing"
          data-lenis-prevent
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 pb-24">
            {filtered.map((product) => (
              <div 
                key={product.id} 
                className="group relative bg-white rounded-3xl border border-neutral-200 shadow-sm hover:shadow-xl hover:border-primary-200 transition-all duration-300 overflow-hidden flex flex-col h-full"
              >
                <div className="aspect-[4/3] w-full bg-neutral-100 relative overflow-hidden shrink-0">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-neutral-300">
                       <svg className="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                       <span className="text-[10px] font-bold uppercase tracking-widest">No Image</span>
                    </div>
                  )}
                  {product.tax > 0 && (
                    <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[10px] font-black text-primary-700 shadow-sm border border-primary-100">
                      +{product.tax}% TAX
                    </div>
                  )}
                </div>

                <div className="p-4 flex flex-col flex-1">
                   <div className="font-bold text-neutral-800 text-sm md:text-base leading-tight mb-2 line-clamp-2 min-h-[2.5rem]">
                      <span className={`flex-shrink-0 inline-flex items-center justify-center w-3 h-3 rounded-sm border ${product.isVegetarian ? 'border-green-600 bg-white' : 'border-red-600 bg-white'} mr-2 align-middle relative top-[-1px]`}>
                         <span className={`w-1.5 h-1.5 rounded-full ${product.isVegetarian ? 'bg-green-600' : 'bg-red-600'}`}></span>
                      </span>
                      {product.name}
                   </div>
                   <div className="mt-auto flex items-center justify-between gap-2">
                      <div className="text-lg font-black text-primary-600">
                         ₹{product.price}
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleProductClick(product); }}
                        className="h-10 w-10 rounded-2xl bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 active:scale-95 transition-all shadow-md shadow-primary-500/20"
                      >
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                      </button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating View Cart Button (Mobile Only) */}
        {!isCartOpen && (
          <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-[280px] px-4">
            <button 
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-primary-600 text-white rounded-2xl py-4 flex items-center justify-between px-6 shadow-2xl shadow-primary-500/40 animate-in fade-in slide-in-from-bottom-4 duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  {items.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-white text-primary-600 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center border border-primary-100">
                      {items.length}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest">View Current Order</span>
              </div>
              <span className="text-sm font-black">₹{total().toFixed(0)}</span>
            </button>
          </div>
        )}
      </div>

      {/* Right: Cart Area */}
      <div className={`
        ${isCartOpen ? 'flex fixed inset-0 z-[60]' : 'hidden lg:flex'} 
        w-full lg:max-w-[360px] xl:max-w-[420px] lg:relative
        flex flex-col bg-white border-l border-neutral-200 shadow-[-10px_0_30px_rgba(0,0,0,0.03)] shrink-0
      `}>
        <div className="p-4 md:p-6 border-b border-neutral-100 bg-white shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsCartOpen(false)} className="lg:hidden w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div>
              <h2 className="text-xl font-black text-neutral-800 tracking-tight leading-none md:leading-normal">Current Order</h2>
              <div className="flex items-center gap-2 mt-1">
                 <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                 <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em]">{items.reduce((a, b) => a + b.quantity, 0)} Items</p>
              </div>
            </div>
          </div>
          {items.length > 0 && (
            <button onClick={clearCart} className="h-10 px-4 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 flex items-center gap-2 transition-all font-bold text-xs uppercase tracking-wider">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Clear
            </button>
          )}
        </div>

        {/* Customer Section - Two Sections */}
        <div className="px-6 py-5 bg-neutral-50/50 border-b border-neutral-100 space-y-4">
          {!selectedCustomer ? (
            <div className="space-y-4">
              {/* Section 1: Search & Phone */}
              <div className="bg-white rounded-[1.5rem] p-4 border border-neutral-100 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                   <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                     <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Section 1: Contact (Required)</span>
                </div>
                <div className="relative">
                  <input 
                    type="tel" 
                    placeholder="Search phone or enter new..." 
                    value={customerSearch}
                    onChange={e => { setCustomerSearch(e.target.value); setIsAddingNew(false); }}
                    className="w-full bg-neutral-50 border border-transparent rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:bg-white focus:border-emerald-200 transition-all"
                  />
                  
                  {/* Search Results Dropdown */}
                  {(customerResults.length > 0 || customerSearch.length >= 3) && !isAddingNew && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-neutral-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      {customerResults.map(c => (
                        <button 
                          key={c.id} 
                          onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); setCustomerResults([]); }}
                          className="w-full text-left px-5 py-3 hover:bg-neutral-50 flex items-center justify-between border-b border-neutral-50 last:border-none"
                        >
                          <div>
                            <div className="text-xs font-black text-neutral-800">{c.name}</div>
                            <div className="text-[10px] font-bold text-neutral-400">{c.phone}</div>
                          </div>
                          <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                        </button>
                      ))}
                      {customerSearch.length >= 10 && !isAddingNew && (
                        <button 
                          onClick={() => setIsAddingNew(true)}
                          className="w-full px-5 py-4 bg-primary-600 text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
                          Create New Patient/Guest
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Identity (Visible when adding new) */}
              <AnimatePresence>
                {isAddingNew && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-white rounded-[1.5rem] p-4 border border-primary-100 shadow-sm relative overflow-hidden"
                  >
                    <div className="flex items-center gap-2 mb-3">
                       <div className="w-6 h-6 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                         <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-widest text-primary-400">Section 2: Guest Name (Required)</span>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Enter Full Name" 
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      className="w-full bg-neutral-50 border border-transparent rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:bg-white focus:border-primary-200 transition-all mb-3"
                      autoFocus
                    />
                    <button 
                      onClick={createCustomer} 
                      className="w-full py-3 bg-primary-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
                    >
                      Save Guest Profile
                    </button>
                    <button 
                      onClick={() => setIsAddingNew(false)}
                      className="w-full mt-2 py-2 text-[10px] font-bold text-neutral-400 uppercase tracking-widest hover:text-neutral-600"
                    >
                      Cancel
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="bg-primary-600 text-white rounded-[1.5rem] px-5 py-3 flex items-center justify-between shadow-lg shadow-primary-500/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-xs font-black">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider opacity-80 leading-none mb-1">Guest</div>
                  <div className="text-sm font-black tracking-tight leading-none">{selectedCustomer.name}</div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
                title="Remove Guest"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          )}
        </div>

        <div 
          ref={cartDrag.ref}
          onMouseDown={cartDrag.onMouseDown}
          className="flex-1 overflow-y-auto min-h-0 px-4 py-6 space-y-4 bg-[#F9F8F6] custom-scrollbar scroll-smooth cursor-grab active:cursor-grabbing"
          data-lenis-prevent
        >
          {items.map(item => (
            <div 
              key={`${item.productId}-${item.variantId}`} 
              onClick={(e) => cartDrag.isDragging.current && e.stopPropagation()}
              className="flex flex-col gap-4 p-5 rounded-[2rem] bg-white border border-neutral-100 shadow-sm hover:shadow-md transition-all duration-300"
            >
               <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                     <div className="text-base font-black text-neutral-800 leading-tight mb-1">{item.name}</div>
                     <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.2em]">Unit Price: ₹{item.price}</div>
                  </div>
                  <div className="text-lg font-black text-primary-700">₹{(item.price * item.quantity).toFixed(0)}</div>
               </div>

               <div className="flex items-center justify-between pt-4 border-t border-neutral-50">
                  <div className="flex items-center bg-neutral-50 rounded-2xl border border-neutral-100 p-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); updateQty(item.productId, item.variantId || undefined, -1); }}
                        className="w-10 h-10 flex items-center justify-center text-neutral-400 hover:bg-white hover:text-red-500 hover:shadow-sm transition-all rounded-xl border-none"
                      >
                         <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                      </button>
                      <span className="w-12 text-center text-base font-black text-neutral-800">{item.quantity}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); updateQty(item.productId, item.variantId || undefined, 1); }}
                        className="w-10 h-10 flex items-center justify-center text-neutral-400 hover:bg-white hover:text-primary-600 hover:shadow-sm transition-all rounded-xl border-none"
                      >
                         <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                      </button>
                  </div>
                  
                  <button onClick={() => removeItem(item.productId, item.variantId)} className="w-12 h-12 flex items-center justify-center text-neutral-200 hover:text-red-500 transition-colors">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
               </div>
               
               <div className="pt-2 border-t border-neutral-50 mt-1">
                 <input 
                   type="text" 
                   onMouseDown={(e) => e.stopPropagation()} /* Prevents drag when interacting with input */
                   placeholder="Add special instructions..." 
                   className="w-full text-[11px] font-semibold bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2 outline-none focus:border-primary-300 text-neutral-700 placeholder:text-neutral-400 focus:bg-white transition-colors"
                   value={item.note || ''}
                   onChange={(e) => updateNote(item.productId, item.variantId || undefined, e.target.value)}
                 />
               </div>
            </div>
          ))}
        </div>

        <div className="bg-white border-t border-neutral-200 p-6 md:p-8 shrink-0 shadow-[0_-20px_50px_rgba(0,0,0,0.05)] z-10">
          <div className="space-y-4 mb-8 px-1">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-300">Net Amount</span>
              <span className="text-base font-black text-neutral-700">₹{subtotal().toFixed(0)}</span>
            </div>
            <div className="flex justify-between items-center text-primary-600">
              <span className="text-xs font-bold uppercase tracking-widest opacity-60">Estimated Tax</span>
              <span className="text-base font-black">₹{totalTax().toFixed(0)}</span>
            </div>
            <div className="h-px bg-neutral-100 my-2" />
            <div className="flex justify-between items-end pt-1">
              <div>
                 <span className="text-xs font-black uppercase tracking-[0.2em] text-neutral-800">Grand Total</span>
                 <p className="text-[10px] font-bold text-neutral-400 leading-tight">Secure Transaction</p>
              </div>
              <span className="text-4xl font-black text-primary-600 leading-none tracking-tighter">₹{total().toFixed(0)}</span>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={sendToKitchen} 
              disabled={loading || items.length === 0} 
              className="flex-1 btn-primary py-5 rounded-2xl text-xs font-black shadow-xl shadow-primary-500/20 tracking-[0.2em] uppercase border-none outline-none active:scale-95 transition-all"
            >
              {loading ? 'Processing...' : 'Place Order'}
            </button>
            <button 
              onClick={() => orderId && setShowPayment(true)} 
              disabled={!orderId}
              className={`flex-1 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border flex items-center justify-center ${orderId ? 'bg-white border-primary-200 text-primary-700 hover:bg-primary-50 active:scale-95 shadow-sm' : 'bg-neutral-50 border-neutral-100 text-neutral-200 cursor-not-allowed'}`}
            >
              Pay
            </button>
            {orderId && (
              <button 
                onClick={async () => {
                  if (!confirm('Cancel this order?')) return;
                  setLoading(true);
                  try {
                    await fetch(`/api/orders/${orderId}`, { 
                      method: 'PUT', 
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: 'CANCELLED' })
                    });
                    try {
                      const { io } = await import('socket.io-client');
                      const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
                      socket.emit('ORDER_UPDATE', { orderId, status: 'CANCELLED' });
                      setTimeout(() => socket.disconnect(), 1000);
                    } catch {}
                    toast.success('Order cancelled');
                    clearCart();
                    router.push(`/${role}/pos/floor`);
                  } catch {
                    toast.error('Failed to cancel');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-14 items-center justify-center flex bg-rose-50 text-rose-500 rounded-2xl border border-rose-100 hover:bg-rose-100 transition-all active:scale-95"
                title="Cancel Order"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Payment Overlay */}
      {showPayment && !showThankYou && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative overflow-hidden animate-slide-up">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-neutral-100">
               <h2 className="text-xl font-bold text-neutral-800">Checkout</h2>
               <button onClick={() => setShowPayment(false)} className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 flex items-center justify-center font-bold">×</button>
            </div>
            
            <div className="text-center mb-6">
               <div className="text-sm font-semibold text-neutral-500 uppercase tracking-widest mb-1">Ticket Total</div>
               <div className="text-4xl font-black text-primary-600">₹{total().toFixed(0)}</div>
            </div>
            
            <div className="space-y-3 mb-6">
              {[
                { id: 'CASH', label: 'Cash Payment', icon: '💵', enabled: config?.cashEnabled },
                { id: 'DIGITAL', label: 'Online Payment', icon: '💳', enabled: config?.digitalEnabled },
              ].filter(m => m.enabled).map((m) => (
                <button 
                  key={m.id}
                  onClick={() => setPayMethod(m.id as any)} 
                  className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${payMethod === m.id ? 'border-primary-500 bg-primary-50 text-primary-800' : 'border-neutral-200 bg-white hover:border-neutral-300 text-neutral-700'}`}
                >
                  <span className="text-2xl">{m.icon}</span>
                  <span className="font-bold text-sm tracking-wide">{m.label}</span>
                  {payMethod === m.id && <div className="ml-auto w-5 h-5 bg-primary-600 rounded-full flex justify-center items-center text-white text-xs">✓</div>}
                </button>
              ))}
            </div>

            <button onClick={handlePay} disabled={loading} className="btn-primary w-full py-4 text-base tracking-wide">
              {loading ? 'Processing...' : `Confirm ${payMethod} Payment`}
            </button>
          </div>
        </div>
      )}

      {/* Success Animation */}
      {showThankYou && (
        <div className="fixed inset-0 bg-white z-[110] flex items-center justify-center animate-fade-in">
          <div className="text-center">
            <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-4xl mb-6 mx-auto">✓</div>
            <h2 className="text-3xl font-black text-neutral-800 mb-2">Payment Successful</h2>
            <p className="text-neutral-500 font-semibold mb-8">Returning to floor layout...</p>
          </div>
        </div>
      )}

      {/* Variant Selection Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-[100] flex flex-col justify-end md:items-center md:justify-center p-0 md:p-6 animate-fade-in">
          <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl relative animate-slide-up h-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-100 shrink-0">
               <div>
                  <h2 className="text-2xl font-bold text-neutral-800">{selectedProduct.name}</h2>
                  <p className="text-sm font-semibold text-neutral-500">Select options</p>
               </div>
               <button onClick={() => setSelectedProduct(null)} className="w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-200 flex justify-center items-center text-xl text-neutral-600 font-bold border-none outline-none">&times;</button>
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto mb-6 custom-scrollbar pr-2">
              {Array.from(new Set(selectedProduct.variants.map(v => v.attribute))).map(attr => (
                <div key={attr} className="space-y-3">
                  <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">{attr}</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.variants.filter(v => v.attribute === attr).map(v => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariants({ ...selectedVariants, [attr]: { id: v.id, price: v.extraPrice, value: v.value } })}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${selectedVariants[attr]?.id === v.id ? 'border-primary-600 bg-primary-50 text-primary-800' : 'border-neutral-200 text-neutral-600 hover:border-neutral-300 bg-white'}`}
                      >
                        {v.value} {v.extraPrice > 0 && <span className="opacity-60 ml-1">(+₹{v.extraPrice})</span>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={confirmVariant} className="btn-primary w-full py-4 text-base shrink-0 border-none outline-none shadow-md">
              Add to Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
