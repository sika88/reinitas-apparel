"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const { items, hydrated, subtotal, setQuantity, remove } = useCart();

  if (!hydrated) {
    return <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-muted">Loading your cart…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-display text-3xl">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted">Find something you love and it will show up here.</p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
        >
          Browse the shop
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl">Your cart</h1>

      <ul className="mt-6 divide-y divide-border rounded-2xl border border-border bg-surface">
        {items.map((i) => (
          <li key={i.variantId} className="flex gap-4 p-4">
            <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-background">
              {i.image ? (
                <Image src={i.image} alt={i.name} fill sizes="80px" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center font-display text-2xl text-accent/30">
                  {i.name.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              <Link href={`/product/${i.slug}`} className="truncate text-sm font-medium hover:text-accent">
                {i.name}
              </Link>
              {i.size !== "One size" && <p className="text-xs text-muted">Size {i.size}</p>}
              <p className="mt-1 text-sm text-muted">{formatPrice(i.price)}</p>

              <div className="mt-auto flex items-center gap-3 pt-2">
                <div className="flex items-center rounded-lg border border-border">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity(i.variantId, i.quantity - 1)}
                    className="px-3 py-1 text-sm transition hover:text-accent"
                  >
                    −
                  </button>
                  <span className="min-w-6 text-center text-sm">{i.quantity}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => setQuantity(i.variantId, i.quantity + 1)}
                    disabled={i.quantity >= Math.min(i.maxStock, 10)}
                    className="px-3 py-1 text-sm transition hover:text-accent disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => remove(i.variantId)}
                  className="text-xs text-muted transition hover:text-red-500"
                >
                  Remove
                </button>
              </div>
            </div>

            <p className="text-sm font-medium">{formatPrice(i.price * i.quantity)}</p>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-sm text-muted">Subtotal</span>
        <span className="text-xl font-medium">{formatPrice(subtotal)}</span>
      </div>
      <p className="mt-1 text-xs text-muted">Prices and stock are confirmed again at checkout.</p>

      <Link
        href="/checkout"
        className="mt-6 block rounded-full bg-accent px-6 py-3 text-center text-sm font-medium text-white transition hover:opacity-90"
      >
        Continue to checkout
      </Link>
    </div>
  );
}
