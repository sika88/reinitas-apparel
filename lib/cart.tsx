"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { refreshCartPrices } from "@/lib/actions/cart";

export type CartItem = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  size: string;
  price: number; // pesewas per item. The server re-checks it at checkout.
  original?: number; // regular price, when the item is discounted
  image: string | null;
  quantity: number;
  maxStock: number;
};

type SyncUpdate = { price: number; original: number; maxStock: number } | null;
type State = { items: CartItem[]; hydrated: boolean };
type Action =
  | { type: "hydrate"; items: CartItem[] }
  | { type: "add"; item: CartItem }
  | { type: "setQty"; variantId: string; quantity: number }
  | { type: "remove"; variantId: string }
  | { type: "sync"; updates: Record<string, SyncUpdate> }
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
    case "sync": {
      const items: CartItem[] = [];
      for (const i of state.items) {
        if (!(i.variantId in action.updates)) {
          items.push(i);
          continue;
        }
        const u = action.updates[i.variantId];
        if (!u) continue; // no longer available
        items.push({
          ...i,
          price: u.price,
          original: u.original > u.price ? u.original : undefined,
          maxStock: u.maxStock,
          quantity: Math.max(1, Math.min(i.quantity, u.maxStock, MAX_PER_LINE)),
        });
      }
      return { ...state, items };
    }
    case "clear":
      return { ...state, items: [] };
  }
}

type CartContextValue = {
  items: CartItem[];
  hydrated: boolean;
  count: number;
  subtotal: number;
  notice: string | null;
  add: (item: CartItem) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  refresh: () => Promise<void>;
  dismissNotice: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [], hydrated: false });
  const [notice, setNotice] = useState<string | null>(null);
  const itemsRef = useRef<CartItem[]>([]);
  itemsRef.current = state.items;
  const busy = useRef(false);

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
  const dismissNotice = useCallback(() => setNotice(null), []);

  // Ask the server for today's prices and stock. Sales start and end, so the cart must not go stale.
  const refresh = useCallback(async () => {
    const current = itemsRef.current;
    if (current.length === 0 || busy.current) return;
    busy.current = true;
    try {
      const rows = await refreshCartPrices(current.map((i) => i.variantId));
      const updates: Record<string, SyncUpdate> = {};
      let removed = false;
      let changed = false;
      for (const i of current) {
        const r = rows.find((x) => x.variantId === i.variantId);
        if (!r || !r.available) {
          updates[i.variantId] = null;
          removed = true;
          continue;
        }
        updates[i.variantId] = { price: r.price, original: r.original, maxStock: r.stock };
        if (r.price !== i.price || r.stock < i.quantity) changed = true;
      }
      dispatch({ type: "sync", updates });
      if (removed) setNotice("Some items in your cart are no longer available and were removed.");
      else if (changed) setNotice("Some prices or stock levels have changed. Please review your cart.");
    } catch {
      // offline or a hiccup: keep what we have, the server still checks everything at checkout
    } finally {
      busy.current = false;
    }
  }, []);

  useEffect(() => {
    if (state.hydrated) refresh();
  }, [state.hydrated, refresh]);

  const value = useMemo<CartContextValue>(
    () => ({
      items: state.items,
      hydrated: state.hydrated,
      count: state.items.reduce((n, i) => n + i.quantity, 0),
      subtotal: state.items.reduce((n, i) => n + i.price * i.quantity, 0),
      notice,
      add,
      setQuantity,
      remove,
      clear,
      refresh,
      dismissNotice,
    }),
    [state.items, state.hydrated, notice, add, setQuantity, remove, clear, refresh, dismissNotice],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
