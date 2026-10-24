import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
  id: string;          // deterministic key for a specific configuration
  slug: string;        // product slug (links back to the configurator)
  name: string;        // product name
  configLabel: string; // human summary, e.g. "Corner L-Shape · Denim Blue"
  configQuery: string; // query string to restore the exact configuration
  unitPrice: number;
  qty: number;
  thumbnail?: string;
  accentColor: string; // fallback visual when no thumbnail
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, "qty">, qty?: number) => void;
  removeItem: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,

      addItem: (item, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.id === item.id ? { ...i, qty: i.qty + qty } : i,
              ),
            };
          }
          return { items: [...s.items, { ...item, qty }] };
        }),

      removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

      setQty: (id, qty) =>
        set((s) => ({
          items: qty <= 0
            ? s.items.filter((i) => i.id !== id)
            : s.items.map((i) => (i.id === id ? { ...i, qty } : i)),
        })),

      clear: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: "luxmeble-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }), // never persist drawer open state
    },
  ),
);

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.qty, 0);
export const cartSubtotal = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
