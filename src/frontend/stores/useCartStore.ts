'use client';
import { create } from 'zustand';

export interface CartItem {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  tax: number; // Percentage
  quantity: number;
  note?: string;
}

interface CartStore {
  items: CartItem[];
  tableId: string | null;
  sessionId: string | null;
  orderId: string | null;
  setTable: (tableId: string) => void;
  setSession: (sessionId: string) => void;
  setOrderId: (id: string) => void;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQty: (productId: string, variantId: string | undefined, delta: number) => void;
  clearCart: () => void;
  subtotal: () => number;
  totalTax: () => number;
  total: () => number; // Grand total
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  tableId: null,
  sessionId: null,
  orderId: null,
  setTable: (tableId) => set({ tableId }),
  setSession: (sessionId) => set({ sessionId }),
  setOrderId: (orderId) => set({ orderId }),
  addItem: (item) => {
    const items = get().items;
    const exists = items.find(
      (i) => i.productId === item.productId && i.variantId === item.variantId
    );
    if (exists) {
      set({ items: items.map((i) =>
        i.productId === item.productId && i.variantId === item.variantId
          ? { ...i, quantity: i.quantity + item.quantity }
          : i
      )});
    } else {
      set({ items: [...items, item] });
    }
  },
  removeItem: (productId, variantId) => {
    set({ items: get().items.filter((i) => !(i.productId === productId && i.variantId === variantId)) });
  },
  updateQty: (productId, variantId, delta) => {
    const items = get().items.map((i) =>
      i.productId === productId && i.variantId === variantId
        ? { ...i, quantity: Math.max(0, i.quantity + delta) }
        : i
    ).filter((i) => i.quantity > 0);
    set({ items });
  },
  clearCart: () => set({ items: [], orderId: null }),
  subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  totalTax: () => get().items.reduce((sum, i) => sum + (i.price * i.quantity * (i.tax / 100)), 0),
  total: () => {
    const sub = get().subtotal();
    const tax = get().totalTax();
    return sub + tax;
  },
}));
