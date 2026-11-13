"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react";

export type CartItem = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  size: string;
  price: number; // pesewas, for display only. The server re-prices at checkout.
  image: string | null;
  quantity: number;
  maxStock: number;
};

type State = { items: CartItem[]; hydrated: boolean };
type Action =
  | { type: "hydrate"; items: CartItem[] }
  | { type: "add"; item: CartItem }
  | { type: "setQty"; variantId: string; quantity: number }
  | { type: "remove"; variantId: string }
  | { type: "clear" };

const KEY = "reinitas-cart-v1";
const MAX_PER_LINE = 10;

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { items: action.items, hydrated: true };
    case "add": {
      const cap = Math.min(action.item.maxStock, MAX_PER_LINE);
      const existing = state.items.find((i) => i.variantId === action.item.variantId);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.variantId === existing.variantId
              ? { ...i, quantity: Math.min(i.quantity + action.item.quantity, cap), maxStock: action.item.maxStock, price: action.item.price }
              : i,
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.item, quantity: Math.min(action.item.quantity, cap) }] };
    }
    case "setQty":
      return {
        ...state,
        items: state.items.map((i) =>
          i.variantId === action.variantId
            ? { ...i, quantity: Math.max(1, Math.min(action.quantity, i.maxStock, MAX_PER_LINE)) }
            : i,
        ),
      };
    case "remove":
      return { ...state, items: state.items.filter((i) => i.variantId !== action.variantId) };
    case "clear":
      return { ...state, items: [] };
  }
}

type CartContextValue = {
  items: CartItem[];
  hydrated: boolean;
  count: number;
  subtotal: number;
  add: (item: CartItem) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [], hydrated: false });

  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
      dispatch({ type: "hydrate", items: Array.isArray(parsed) ? (parsed as CartItem[]) : [] });
    } catch {
      dispatch({ type: "hydrate", items: [] });
    }
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state.items));
    } catch {}
  }, [state.items, state.hydrated]);

  const add = useCallback((item: CartItem) => dispatch({ type: "add", item }), []);
  const setQuantity = useCallback((variantId: string, quantity: number) => dispatch({ type: "setQty", variantId, quantity }), []);
  const remove = useCallback((variantId: string) => dispatch({ type: "remove", variantId }), []);
  const clear = useCallback(() => dispatch({ type: "clear" }), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items: state.items,
      hydrated: state.hydrated,
      count: state.items.reduce((n, i) => n + i.quantity, 0),
      subtotal: state.items.reduce((n, i) => n + i.price * i.quantity, 0),
      add,
      setQuantity,
      remove,
      clear,
    }),
    [state.items, state.hydrated, add, setQuantity, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
