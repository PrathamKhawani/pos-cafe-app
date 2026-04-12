'use client';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelfOrder } from '../context';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function SelfMenuPage() {
  // ✅ All context values including totalTax and subtotal properly destructured
  const {
    products, categories, token, cart,
    addToCart, updateQuantity, updateNote, removeFromCart,
    config, loading,
    cartCount, subtotal, totalTax, grandTotal,
    lastOrderId,
  } = useSelfOrder();

  const [lastOrderPending, setLastOrderPending] = useState(false);

  // Check if last order is still pending
  useEffect(() => {
    if (lastOrderId) {
      fetch(`/api/orders/${lastOrderId}`)
        .then(r => r.json())
        .then(data => {
          // If order is not finished (delivered, cancelled) or is PAID but not delivered
          const nonPending = ['DELIVERED', 'CANCELLED'];
          if (data && !nonPending.includes(data.status)) {
            setLastOrderPending(true);
          } else {
            setLastOrderPending(false);
          }
        }).catch(() => setLastOrderPending(false));
    }
  }, [lastOrderId]);

  const router = useRouter();
  const [activeCat, setActiveCat] = useState('all');
  const [search, setSearch] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState<'ALL' | 'VEG' | 'NON_VEG'>('ALL');
  const [variantModal, setVariantModal] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const isQrOnly = config?.selfOrderMode === 'QR_MENU';

  const filtered = useMemo(() => products.filter(p =>
    (activeCat === 'all' || p.category.id === activeCat) &&
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    (dietaryFilter === 'ALL' ? true : dietaryFilter === 'VEG' ? p.isVegetarian : !p.isVegetarian)
  ), [products, activeCat, search, dietaryFilter]);

  function getCartQty(productId: string, variantId?: string) {
    const item = cart.find(i => i.productId === productId && i.variantId === variantId);
    return item?.quantity || 0;
  }

  function handleAddToCart(product: typeof products[0], variant?: typeof products[0]['variants'][0]) {
    addToCart({
      productId: product.id,
      variantId: variant?.id,
      name: product.name,
      variantName: variant ? `${variant.attribute}: ${variant.value}` : undefined,
      price: product.price + (variant?.extraPrice || 0),
      tax: product.tax || 0,
      quantity: 1,
      imageUrl: product.imageUrl || undefined,
      isVegetarian: product.isVegetarian,
    });
    setVariantModal(null);
    setSelectedVariant(null);
  }

  function openProduct(product: typeof products[0]) {
    if (product.variants.length > 0) {
      setVariantModal(product.id);
      setSelectedVariant(null);
    } else {
      handleAddToCart(product);
    }
  }

  const getCategoryIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('beverage') || n.includes('drink') || n.includes('coffee') || n.includes('tea')) return '☕';
    if (n.includes('snack') || n.includes('fries') || n.includes('appetizer')) return '🍟';
    if (n.includes('dessert') || n.includes('sweet') || n.includes('cake')) return '🍰';
    if (n.includes('pizza')) return '🍕';
    if (n.includes('burger')) return '🍔';
    if (n.includes('salad') || n.includes('healthy')) return '🥗';
    if (n.includes('breakfast') || n.includes('morning')) return '🍳';
    if (n.includes('soup')) return '🍲';
    return '🍽️';
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-lg" />
    </div>
  );

  const modalProduct = variantModal ? products.find(p => p.id === variantModal) : null;

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#F8F9FA] text-gray-900 lg:flex">

      {/* LEFT COMPONENT: MENU SECTION */}
      <div className="flex-1 flex flex-col lg:overflow-y-auto lg:min-h-0 lg:pb-12 scroll-smooth">
        {/* Modern Header */}
        <div className="bg-white/80 backdrop-blur-2xl border-b border-gray-100 sticky top-0 z-30 pt-4 pb-0 lg:pt-6">
          <div className="px-4 sm:px-8 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              {/* Back Button & Title */}
              <div className="flex items-center gap-4">
                 <button
                   onClick={() => router.push(`/s/${token}`)}
                   className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-50 hover:text-black transition-all active:scale-95"
                 >
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                   </svg>
                 </button>
                 <div>
                   <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Digital Menu</h1>
                   {isQrOnly && <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-0.5">View Only Mode</p>}
                 </div>
              </div>

              {/* Mobile Cart Icon (Hidden on Desktop) */}
              <div className="flex items-center gap-2">
                {lastOrderPending && (
                  <button 
                    onClick={() => router.push(`/s/${token}/track/${lastOrderId}`)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-all group"
                  >
                    <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
                    <span className="text-[10px] font-bold text-gray-700 uppercase tracking-tight">Track Order</span>
                    <svg className="w-3 h-3 text-gray-400 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </button>
                )}
                {!isQrOnly && cartCount > 0 && (
                  <Link href={`/s/${token}/cart`} className="relative w-10 h-10 bg-black rounded-2xl flex items-center justify-center shadow-lg shadow-black/30 active:scale-95 transition-all">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black border-2 border-white rounded-full text-[10px] font-bold text-white flex items-center justify-center">{cartCount}</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Smart Search Bar */}
            <div className="relative mb-5 group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-semibold text-gray-900 shadow-inner focus:bg-white focus:ring-4 focus:ring-gray-900/5 focus:border-gray-400 placeholder:text-gray-400 outline-none transition-all"
                placeholder="What are you craving?"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Sticky Horizontal Categories */}
            <div className="flex gap-2 pb-4 overflow-x-auto no-scrollbar scroll-smooth">
              <button
                onClick={() => setActiveCat('all')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                  activeCat === 'all'
                    ? 'bg-gray-900 text-white shadow-xl shadow-gray-900/20 px-6'
                    : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100 shadow-sm'
                }`}
              >
                All Menu
              </button>
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setActiveCat(c.id)}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 flex items-center gap-2 ${
                    activeCat === c.id
                      ? 'text-white shadow-xl px-6'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100 shadow-sm hover:scale-[1.02]'
                  }`}
                  style={activeCat === c.id ? { background: c.color, boxShadow: `0 8px 24px -4px ${c.color}60` } : {}}
                >
                  <span className="text-sm">{getCategoryIcon(c.name)}</span>
                  {c.name}
                </button>
              ))}
            </div>

            {/* Dietary Filters */}
            <div className="flex gap-2 pb-4 overflow-x-auto no-scrollbar">
              <button onClick={() => setDietaryFilter('ALL')} className={`px-4 py-1.5 rounded-xl border text-xs font-bold transition-all ${dietaryFilter === 'ALL' ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>All</button>
              <button onClick={() => setDietaryFilter('VEG')} className={`px-4 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${dietaryFilter === 'VEG' ? 'bg-green-50 text-green-700 border-green-600' : 'bg-white text-gray-500 border-gray-200 hover:bg-green-50/50'}`}>
                <span className="flex-shrink-0 inline-flex items-center justify-center w-3 h-3 rounded-sm border border-green-600 bg-white"><span className="w-1.5 h-1.5 rounded-full bg-green-600"></span></span> Veg Only
              </button>
              <button onClick={() => setDietaryFilter('NON_VEG')} className={`px-4 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${dietaryFilter === 'NON_VEG' ? 'bg-red-50 text-red-700 border-red-600' : 'bg-white text-gray-500 border-gray-200 hover:bg-red-50/50'}`}>
                <span className="flex-shrink-0 inline-flex items-center justify-center w-3 h-3 rounded-sm border border-red-600 bg-white"><span className="w-1.5 h-1.5 rounded-full bg-red-600"></span></span> Non-Veg
              </button>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="px-4 sm:px-8 py-6 max-w-5xl mx-auto w-full">
          {filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-6 text-4xl border border-gray-100">
                🍽️
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">Nothing found</h3>
              <p className="text-sm font-medium text-gray-400">Try adjusting your category or search.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              <AnimatePresence mode="popLayout">
                {filtered.map((p, idx) => {
                  const qty = getCartQty(p.id);
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: idx * 0.02, type: "spring", stiffness: 200, damping: 20 }}
                      key={p.id}
                      className="bg-white rounded-[24px] border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col"
                    >
                      {/* Image Banner */}
                      <div className="relative h-40 sm:h-48 w-full bg-gray-50 overflow-hidden" style={{ background: p.category.color + '10' }}>
                        {p.imageUrl ? (
                           <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        ) : (
                           <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-40 transition-transform duration-500 group-hover:scale-110 group-hover:opacity-80 drop-shadow-md">
                             {getCategoryIcon(p.category.name)}
                           </div>
                        )}
                        {/* Tags */}
                        <div className="absolute top-3 left-3 flex gap-2">
                           <div className="px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm" style={{ color: p.category.color }}>
                             {p.category.name}
                           </div>
                        </div>
                        {p.variants.length > 0 && (
                          <div className="absolute top-3 right-3 px-2.5 py-1 bg-gray-900/80 backdrop-blur-md text-white rounded-lg text-[10px] font-bold shadow-sm">
                            Customizable
                          </div>
                        )}
                      </div>

                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex-1">
                           <h3 className="text-lg font-black text-gray-900 leading-tight mb-1">
                             <span className={`flex-shrink-0 inline-flex items-center justify-center w-3 h-3 rounded-sm border ${p.isVegetarian ? 'border-green-600 bg-white' : 'border-red-600 bg-white'} mr-2 align-middle relative top-[-2px]`}>
                               <span className={`w-1.5 h-1.5 rounded-full ${p.isVegetarian ? 'bg-green-600' : 'bg-red-600'}`}></span>
                             </span>
                             {p.name}
                           </h3>
                           {p.description && <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-4">{p.description}</p>}
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-2">
                          <div>
                            <span className="text-xl font-black text-gray-900 tracking-tight">₹{p.price}</span>
                            {p.tax > 0 && <span className="text-[10px] text-gray-400 font-semibold block uppercase">+{p.tax}% tax</span>}
                          </div>

                          {!isQrOnly && (
                            <div className="relative">
                              {qty > 0 && p.variants.length === 0 ? (
                                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex items-center bg-gray-50 rounded-2xl p-1 shadow-inner">
                                  <button onClick={() => updateQuantity(p.id, undefined, -1)} className="w-9 h-9 rounded-xl bg-white text-gray-600 flex items-center justify-center text-lg font-bold shadow-sm hover:scale-105 active:scale-95 transition-all">−</button>
                                  <span className="w-8 text-center text-sm font-black text-gray-900">{qty}</span>
                                  <button onClick={() => updateQuantity(p.id, undefined, 1)} className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center text-lg font-bold shadow-sm hover:scale-105 active:scale-95 transition-all">+</button>
                                </motion.div>
                              ) : (
                                <button
                                  onClick={() => openProduct(p)}
                                  className="h-11 px-5 bg-gray-900 rounded-2xl text-white text-sm font-bold shadow-lg shadow-gray-900/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group-hover:bg-black group-hover:shadow-black/30"
                                >
                                  {p.variants.length > 0 ? 'Select' : 'Add'}
                                  <svg className="w-4 h-4 opacity-50 transition-opacity group-hover:opacity-100" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Floating Cart Button (Mobile Only) */}
        {!isQrOnly && cartCount > 0 && (
          <div className="lg:hidden fixed bottom-[84px] lg:bottom-6 left-0 right-0 px-4 z-40 pointer-events-none">
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="max-w-md mx-auto">
              <Link
                href={`/s/${token}/cart`}
                className="pointer-events-auto flex items-center justify-between bg-black text-white p-4 rounded-[24px] shadow-2xl shadow-black/40 hover:scale-[1.02] active:scale-95 transition-all border border-gray-800 focus:outline-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-sm font-black shadow-inner">{cartCount}</div>
                  <div className="flex flex-col">
                     <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Order</span>
                     <span className="text-sm font-black">View Cart →</span>
                  </div>
                </div>
                <span className="text-xl font-black tracking-tight">₹{grandTotal.toFixed(0)}</span>
              </Link>
            </motion.div>
          </div>
        )}
      </div>

      {/* RIGHT COMPONENT: DESKTOP CART PANEL (Hidden on Mobile) */}
      {!isQrOnly && (
        <div className="hidden lg:flex w-[400px] xl:w-[450px] flex-col bg-white border-l border-gray-100 shadow-2xl z-40 h-full">
           <div className="px-6 py-8 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Current Order</h2>
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mt-1">Table Order</p>
           </div>

           <div className="flex-1 overflow-y-auto px-6 py-6 bg-white space-y-5">
              {cart.length === 0 ? (
                <div className="text-center py-20 opacity-50">
                   <div className="text-6xl mb-4">🛒</div>
                   <h3 className="text-lg font-bold text-gray-900">Cart is empty</h3>
                   <p className="text-sm text-gray-500 mt-1">Select items to begin</p>
                </div>
              ) : (
                <AnimatePresence>
                  {cart.map(item => {
                    const itemKey = `${item.productId}-${item.variantId || 'base'}`;
                    return (
                      <motion.div layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} key={itemKey} className="group relative">
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                           {/* Mini Image */}
                           <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0">
                              {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" /> : <span className="text-xl">🍽️</span>}
                           </div>

                           <div className="flex-1 min-w-0 pr-8">
                             <h4 className="text-sm font-bold text-gray-900 leading-tight">{item.name}</h4>
                             {item.variantName && <p className="text-[10px] font-bold text-indigo-600 mt-0.5">{item.variantName}</p>}
                             <p className="text-xs font-bold text-gray-500 mt-1">₹{item.price}</p>
                           </div>

                           {/* Trash Button */}
                           <button onClick={() => removeFromCart(item.productId, item.variantId)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                           </button>
                        </div>

                        {/* Note Input & Qty Controls */}
                        <div className="flex items-center gap-3 mt-2 pl-2">
                           <div className="flex-1 relative">
                              <input
                                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400"
                                placeholder="Add instructions..."
                                value={item.note || ''}
                                onChange={e => updateNote(item.productId, item.variantId, e.target.value)}
                              />
                           </div>
                           <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-1 py-0.5 shadow-sm">
                             <button onClick={() => updateQuantity(item.productId, item.variantId, -1)} className="w-6 h-6 rounded-lg text-gray-600 hover:bg-gray-100 flex items-center justify-center text-sm font-bold transition-colors">−</button>
                             <span className="w-6 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                             <button onClick={() => updateQuantity(item.productId, item.variantId, 1)} className="w-6 h-6 rounded-lg text-black hover:bg-gray-100 flex items-center justify-center text-sm font-bold transition-colors">+</button>
                           </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
           </div>

           {/* Desktop Checkout Footer */}
           {cart.length > 0 && (
             <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-20px_40px_-20px_rgba(0,0,0,0.05)]">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm font-semibold text-gray-500">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  {totalTax > 0 && (
                    <div className="flex justify-between text-xs font-semibold text-gray-400">
                      <span>Est. Taxes</span>
                      <span>₹{totalTax.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-black text-gray-900 pt-3 border-t border-gray-100">
                    <span>Total</span>
                    <span>₹{grandTotal.toFixed(0)}</span>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/s/${token}/cart`)}
                  className="w-full flex items-center justify-center gap-3 bg-black text-white rounded-2xl py-4 font-bold text-sm shadow-xl shadow-black/30 hover:bg-gray-900 active:scale-[0.98] transition-all"
                >
                  Proceed to Checkout
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
             </div>
           )}
        </div>
      )}

      {/* Variant Selection Modal */}
      <AnimatePresence>
        {modalProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => { setVariantModal(null); setSelectedVariant(null); }}
          >
            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              transition={{ type: "spring", stiffness: 250, damping: 25 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-t-[32px] sm:rounded-[32px] w-full sm:max-w-md max-h-[90vh] overflow-auto shadow-2xl flex flex-col"
            >
              <div className="p-6">
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden" />

                <div className="flex items-start gap-5 mb-6">
                  <div className="w-20 h-20 rounded-[20px] flex items-center justify-center text-4xl flex-shrink-0 shadow-inner" style={{ background: modalProduct.category.color + '15' }}>
                    {modalProduct.imageUrl ? (
                      <img src={modalProduct.imageUrl} alt={modalProduct.name} className="w-full h-full object-cover rounded-[20px]" />
                    ) : getCategoryIcon(modalProduct.category.name)}
                  </div>
                  <div className="pt-1">
                    <h3 className="text-xl font-black text-gray-900 tracking-tight leading-tight mb-1">
                      <span className={`flex-shrink-0 inline-flex items-center justify-center w-3 h-3 rounded-sm border ${modalProduct.isVegetarian ? 'border-green-600 bg-white' : 'border-red-600 bg-white'} mr-2 align-middle relative top-[-3px]`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${modalProduct.isVegetarian ? 'bg-green-600' : 'bg-red-600'}`}></span>
                      </span>
                      {modalProduct.name}
                    </h3>
                    <p className="text-sm font-bold text-gray-500">Base Price: ₹{modalProduct.price}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-1 mb-6 border border-gray-100 flex flex-col gap-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-3 pt-2 pb-1">Customization</p>

                  {modalProduct.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v.id)}
                      className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${
                        selectedVariant === v.id
                          ? 'bg-white shadow-md border-indigo-500 ring-2 ring-indigo-500'
                          : 'bg-transparent border-transparent hover:bg-white/50'
                      } border border-transparent`}
                    >
                      <div className="text-left">
                        <p className="text-sm font-black text-gray-900">{v.attribute}: {v.value}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {v.extraPrice > 0 && <p className="text-xs font-bold text-gray-400">+₹{v.extraPrice}</p>}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedVariant === v.id ? 'border-black' : 'border-gray-300'
                        }`}>
                          {selectedVariant === v.id && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
                        </div>
                      </div>
                    </button>
                  ))}

                  {/* None option */}
                  <button
                    onClick={() => setSelectedVariant('none')}
                    className={`w-full p-4 rounded-xl flex items-center justify-between transition-all mt-1 ${
                      selectedVariant === 'none'
                        ? 'bg-white shadow-md ring-2 ring-indigo-500'
                        : 'bg-transparent hover:bg-white/50'
                    }`}
                  >
                    <p className="text-sm font-bold text-gray-900">Standard (No modification)</p>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedVariant === 'none' ? 'border-indigo-600' : 'border-gray-300'
                    }`}>
                      {selectedVariant === 'none' && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
                    </div>
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      if (!selectedVariant) return;
                      const variant = selectedVariant === 'none' ? undefined : modalProduct.variants.find(v => v.id === selectedVariant);
                      handleAddToCart(modalProduct, variant);
                    }}
                    disabled={!selectedVariant}
                    className="w-full bg-black text-white py-4 rounded-2xl text-[15px] font-black tracking-wide shadow-xl shadow-black/30 disabled:opacity-50 disabled:shadow-none hover:bg-gray-900 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    Add to Order
                    {selectedVariant && (
                      <span className="opacity-80 font-semibold">• ₹{selectedVariant !== 'none'
                        ? (modalProduct.price + (modalProduct.variants.find(v => v.id === selectedVariant)?.extraPrice || 0)).toFixed(0)
                        : modalProduct.price.toFixed(0)
                      }</span>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
