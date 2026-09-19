import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartLine = {
  productId: number;
  slug: string;
  name: string;
  brandName: string;
  image: string;
  unitPrice: number;
  listPrice?: number;
  discountPercent?: number;
  stock: number;
  quantity: number;
};

type CartState = {
  items: CartLine[];
  add: (line: Omit<CartLine, "quantity">, qty?: number) => void;
  setQty: (productId: number, quantity: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (line, qty = 1) => {
        const items = [...get().items];
        const idx = items.findIndex((i) => i.productId === line.productId);
        const addBy = Math.max(1, qty);
        if (idx >= 0) {
          const next = Math.min(items[idx].stock, items[idx].quantity + addBy);
          items[idx] = { ...items[idx], ...line, quantity: next };
        } else {
          items.push({ ...line, quantity: Math.min(line.stock, addBy) });
        }
        set({ items });
      },
      setQty: (productId, quantity) => {
        set({
          items: get()
            .items.map((i) =>
              i.productId === productId
                ? { ...i, quantity: Math.max(1, Math.min(i.stock, quantity)) }
                : i,
            )
            .filter((i) => i.quantity > 0),
        });
      },
      remove: (productId) => set({ items: get().items.filter((i) => i.productId !== productId) }),
      clear: () => set({ items: [] }),
    }),
    { name: "meridian.cart" },
  ),
);

export function cartCount(items: CartLine[]): number {
  return items.reduce((n, i) => n + i.quantity, 0);
}

export function cartTotal(items: CartLine[]): number {
  return items.reduce((n, i) => n + i.unitPrice * i.quantity, 0);
}

type WishState = {
  ids: number[];
  toggle: (id: number) => void;
  has: (id: number) => boolean;
};

export const useWishlist = create<WishState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) => {
        const ids = get().ids.includes(id) ? get().ids.filter((x) => x !== id) : [...get().ids, id];
        set({ ids });
      },
      has: (id) => get().ids.includes(id),
    }),
    { name: "meridian.wishlist" },
  ),
);
