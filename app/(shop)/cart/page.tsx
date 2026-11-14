"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const { items, hydrated, subtotal, setQuantity, remove } = useCart();

  if (!hydrated) {
    return <div className="container-page py-14 text-sm text-muted">Loading your cart…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="font-display text-5xl font-medium">Your cart is empty</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm text-muted">Find something you love and it will show up here.</p>
        <Link href="/shop" className="btn-primary mt-8">
          Browse the shop
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-10 sm:py-14">
      <h1 className="font-display text-5xl font-medium">Your cart</h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
          {items.map((i) => (
            <li key={i.variantId} className="flex gap-4 p-4 sm:p-5">
              <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-cream">
                {i.image ? (
                  <Image src={i.image} alt={i.name} fill sizes="96px" className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center font-display text-3xl text-accent/25">
                    {i.name.charAt(0)}
                  </div>
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/product/${i.slug}`} className="block truncate font-display text-xl font-medium transition hover:text-accent">
                      {i.name}
                    </Link>
                    {i.size !== "One size" && <p className="text-sm text-muted">Size {i.size}</p>}
                    <p className="mt-1 text-sm text-muted">{formatPrice(i.price)} each</p>
                  </div>
                  <p className="text-sm font-medium">{formatPrice(i.price * i.quantity)}</p>
                </div>

                <div className="mt-auto flex items-center gap-4 pt-3">
                  <div className="flex items-center rounded-full border border-border">
                    <button
                      type="button"
                      aria-label={`Decrease quantity of ${i.name}`}
                      onClick={() => setQuantity(i.variantId, i.quantity - 1)}
                      disabled={i.quantity <= 1}
                      className="h-10 w-10 text-lg transition hover:text-accent disabled:opacity-30"
                    >
                      −
                    </button>
                    <span aria-live="polite" className="min-w-8 text-center text-sm">
                      {i.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label={`Increase quantity of ${i.name}`}
                      onClick={() => setQuantity(i.variantId, i.quantity + 1)}
                      disabled={i.quantity >= Math.min(i.maxStock, 10)}
                      className="h-10 w-10 text-lg transition hover:text-accent disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(i.variantId)}
                    className="text-sm text-muted underline underline-offset-2 transition hover:text-red-600"
                  >
                    Remove<span className="sr-only"> {i.name}</span>
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-2xl border border-border bg-surface p-6 lg:sticky lg:top-28">
          <h2 className="font-display text-2xl font-medium">Summary</h2>
          <div className="mt-5 flex items-center justify-between">
            <span className="text-sm text-muted">Subtotal</span>
            <span aria-live="polite" className="text-xl font-medium">
              {formatPrice(subtotal)}
            </span>
          </div>
          <p className="mt-2 text-xs text-muted">
            Delivery costs, if any, are confirmed with you after you order. Prices and stock are checked again at checkout.
          </p>
          <Link href="/checkout" className="btn-primary mt-6 w-full">
            Continue to checkout
          </Link>
          <Link href="/shop" className="mt-4 block text-center text-sm text-accent underline underline-offset-4">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
