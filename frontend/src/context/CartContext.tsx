import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { storage } from "@/src/utils/storage";

export type CartItem = {
  product_id: string;
  name: string;
  price: number;
  image_url: string;
  qty: number;
};

type CartState = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (product_id: string, qty: number) => void;
  remove: (product_id: string) => void;
  clear: () => void;
  qtyOf: (product_id: string) => number;
};

const CartContext = createContext<CartState>({} as CartState);
const CART_KEY = "ryppl_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      const raw = await storage.getItem<string>(CART_KEY, "");
      if (raw) {
        try {
          setItems(JSON.parse(raw));
        } catch {}
      }
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (hydrated) storage.setItem(CART_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const add = useCallback((item: Omit<CartItem, "qty">, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((i) => i.product_id === item.product_id);
      if (found) {
        return prev.map((i) =>
          i.product_id === item.product_id ? { ...i, qty: i.qty + qty } : i,
        );
      }
      return [...prev, { ...item, qty }];
    });
  }, []);

  const setQty = useCallback((product_id: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.product_id !== product_id)
        : prev.map((i) => (i.product_id === product_id ? { ...i, qty } : i)),
    );
  }, []);

  const remove = useCallback((product_id: string) => {
    setItems((prev) => prev.filter((i) => i.product_id !== product_id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const qtyOf = useCallback(
    (product_id: string) =>
      items.find((i) => i.product_id === product_id)?.qty ?? 0,
    [items],
  );

  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((s, i) => s + i.price * i.qty, 0),
    [items],
  );

  return (
    <CartContext.Provider
      value={{ items, count, subtotal, add, setQty, remove, clear, qtyOf }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
