'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

/* ─── Types ─────────────────────────────────────────── */
interface ProductVariant {
  id: string; attribute: string; value: string; extraPrice: number;
}
interface Product {
  id: string; name: string; price: number; tax: number; description?: string;
  imageUrl?: string; isAvailable: boolean; isVegetarian: boolean;
  category: { id: string; name: string; color: string };
  variants: ProductVariant[];
}
interface Category { id: string; name: string; color: string; }
interface TableInfo { id: string; number: string; floor: { name: string }; }
interface Config { selfOrderEnabled: boolean; selfOrderMode: string; }

export interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  variantName?: string;
  price: number;
  tax: number;
  quantity: number;
  imageUrl?: string;
  note?: string;
  isVegetarian: boolean;
}

interface SelfOrderContext {
  products: Product[];
  categories: Category[];
  table: TableInfo | null;
  config: Config | null;
  token: string;
  loading: boolean;
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, variantId: string | undefined, delta: number) => void;
  updateNote: (productId: string, variantId: string | undefined, note: string) => void;
  clearCart: () => void;
  cartCount: number;
  subtotal: number;
  totalTax: number;
  grandTotal: number;
  lastOrderId: string | null;
  setLastOrderId: (id: string | null) => void;
}

const Ctx = createContext<SelfOrderContext | null>(null);
export const useSelfOrder = () => useContext(Ctx)!;

export function SelfOrderProvider({ children, token }: { children: React.ReactNode; token: string }) {
  const [state, setState] = useState<{ products: Product[]; categories: Category[]; table: TableInfo | null; config: Config | null }>({
    products: [], categories: [], table: null, config: null,
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastOrderId, setLastOrderIdState] = useState<string | null>(null);
  
  // Persistence for lastOrderId
  useEffect(() => {
    const saved = localStorage.getItem('lastOrderId');
    if (saved) setLastOrderIdState(saved);
  }, []);

  const setLastOrderId = useCallback((id: string | null) => {
    setLastOrderIdState(id);
    if (id) localStorage.setItem('lastOrderId', id);
    else localStorage.removeItem('lastOrderId');
  }, []);

  useEffect(() => {
    fetch(`/api/self-order/${token}`).then(r => r.json()).then(data => {
      if (!data.error) {
        setState({ products: data.products, categories: data.categories, table: data.table, config: data.config });
      }
    }).finally(() => setLoading(false));
  }, [token]);

  const addToCart = useCallback((item: CartItem) => {
    setCart(prev => {
      const exists = prev.find(i => i.productId === item.productId && i.variantId === item.variantId);
      if (exists) return prev.map(i =>
        i.productId === item.productId && i.variantId === item.variantId
          ? { ...i, quantity: i.quantity + item.quantity }
          : i
      );
      return [...prev, item];
    });
  }, []);

  const removeFromCart = useCallback((productId: string, variantId?: string) => {
    setCart(prev => prev.filter(i => !(i.productId === productId && i.variantId === variantId)));
  }, []);

  const updateQuantity = useCallback((productId: string, variantId: string | undefined, delta: number) => {
    setCart(prev => prev.map(i =>
      i.productId === productId && i.variantId === variantId
        ? { ...i, quantity: Math.max(0, i.quantity + delta) }
        : i
    ).filter(i => i.quantity > 0));
  }, []);

  const updateNote = useCallback((productId: string, variantId: string | undefined, note: string) => {
    setCart(prev => prev.map(i =>
      i.productId === productId && i.variantId === variantId
        ? { ...i, note }
        : i
    ));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalTax = cart.reduce((s, i) => s + i.price * i.quantity * ((i.tax || 0) / 100), 0);
  const grandTotal = subtotal + totalTax;

  return (
    <Ctx.Provider value={{
      ...state, token, loading, cart, addToCart, removeFromCart,
      updateQuantity, updateNote, clearCart,
      cartCount, subtotal, totalTax, grandTotal,
      lastOrderId, setLastOrderId,
    }}>
      {children}
    </Ctx.Provider>
  );
}
