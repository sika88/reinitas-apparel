"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { placeOrder } from "./actions";

const field =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20";

export default function CheckoutPage() {
  const { items, hydrated, subtotal } = useCart();
  const [method, setMethod] = useState<"paystack" | "pay_on_delivery">("paystack");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();

    try {
      const result = await placeOrder({
        name: get("name"),
        phone: get("phone"),
        email: get("email"),
        address: get("address"),
        city: get("city"),
        notes: get("notes"),
        method,
        items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
      });
      if (result.ok) {
        window.location.assign(result.redirectUrl); // Paystack page, or our confirmation page
        return;
      }
      setError(result.error);
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
    }
    setPending(false);
  }

  if (!hydrated) {
    return <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-muted">Loading…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-display text-3xl">Nothing to check out</h1>
        <Link href="/shop" className="mt-4 inline-block text-sm text-accent underline">
          Back to the shop
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl">Checkout</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Full name</span>
              <input name="name" required minLength={2} maxLength={100} autoComplete="name" className={field} />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Phone number</span>
              <input name="phone" required type="tel" autoComplete="tel" placeholder="0241234567" className={field} />
            </label>
          </div>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">
              Email {method === "pay_on_delivery" && <span className="font-normal text-muted">(optional)</span>}
            </span>
            <input
              name="email"
              type="email"
              required={method === "paystack"}
              autoComplete="email"
              className={field}
            />
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Delivery address</span>
            <input name="address" required minLength={5} maxLength={300} autoComplete="street-address" className={field} />
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">City / town</span>
            <input name="city" required minLength={2} maxLength={100} autoComplete="address-level2" className={field} />
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">
              Notes <span className="font-normal text-muted">(optional)</span>
            </span>
            <textarea name="notes" rows={3} maxLength={500} className={field} />
          </label>

          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-medium">Payment</legend>
            {(
              [
                ["paystack", "Pay online", "Mobile Money or card, securely through Paystack"],
                ["pay_on_delivery", "Pay on delivery", "Pay when your order arrives"],
              ] as const
            ).map(([value, title, hint]) => (
              <label
                key={value}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                  method === value ? "border-accent bg-accent/5" : "border-border bg-surface"
                }`}
              >
                <input
                  type="radio"
                  name="method"
                  checked={method === value}
                  onChange={() => setMethod(value)}
                  className="mt-1 accent-[var(--accent)]"
                />
                <span className="text-sm">
                  <span className="block font-medium">{title}</span>
                  <span className="text-muted">{hint}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {error && (
            <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Please wait…" : method === "paystack" ? `Pay ${formatPrice(subtotal)}` : "Place order"}
          </button>
        </form>

        <aside className="h-fit rounded-2xl border border-border bg-surface p-5">
          <h2 className="font-display text-xl">Order summary</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {items.map((i) => (
              <li key={i.variantId} className="flex justify-between gap-3">
                <span>
                  {i.name}
                  {i.size !== "One size" && <span className="text-muted"> · {i.size}</span>}
                  <span className="text-muted"> × {i.quantity}</span>
                </span>
                <span>{formatPrice(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-border pt-4 font-medium">
            <span>Total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <p className="mt-3 text-xs text-muted">Delivery costs, if any, are confirmed with you after you order.</p>
        </aside>
      </div>
    </div>
  );
}
