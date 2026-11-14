"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { placeOrder } from "./actions";

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
    return <div className="container-page py-14 text-sm text-muted">Loading…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="font-display text-5xl font-medium">Nothing to check out</h1>
        <Link href="/shop" className="btn-primary mt-8">
          Back to the shop
        </Link>
      </div>
    );
  }

  const label = (text: string, optional = false) => (
    <span className="mb-1.5 block text-sm font-medium">
      {text} {optional && <span className="font-normal text-muted">(optional)</span>}
    </span>
  );

  return (
    <div className="container-page py-10 sm:py-14">
      <h1 className="font-display text-5xl font-medium">Checkout</h1>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_380px]">
        <form onSubmit={onSubmit} className="space-y-12">
          <section aria-labelledby="contact-heading" className="space-y-4">
            <h2 id="contact-heading" className="font-display text-3xl font-medium">
              <span className="text-gold">1</span> Your details
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                {label("Full name")}
                <input name="name" required minLength={2} maxLength={100} autoComplete="name" className="field" />
              </label>
              <label className="block">
                {label("Phone number")}
                <input name="phone" required type="tel" autoComplete="tel" placeholder="0241234567" className="field" />
              </label>
            </div>
            <label className="block">
              {label("Email", method === "pay_on_delivery")}
              <input name="email" type="email" required={method === "paystack"} autoComplete="email" className="field" />
            </label>
          </section>

          <section aria-labelledby="delivery-heading" className="space-y-4">
            <h2 id="delivery-heading" className="font-display text-3xl font-medium">
              <span className="text-gold">2</span> Delivery
            </h2>
            <label className="block">
              {label("Delivery address")}
              <input name="address" required minLength={5} maxLength={300} autoComplete="street-address" className="field" />
            </label>
            <label className="block">
              {label("City or town")}
              <input name="city" required minLength={2} maxLength={100} autoComplete="address-level2" className="field" />
            </label>
            <label className="block">
              {label("Notes for us", true)}
              <textarea name="notes" rows={3} maxLength={500} className="field" />
            </label>
          </section>

          <fieldset className="space-y-3">
            <legend className="mb-4 font-display text-3xl font-medium">
              <span className="text-gold">3</span> Payment
            </legend>
            {(
              [
                ["paystack", "Pay online", "Mobile Money or card, securely through Paystack"],
                ["pay_on_delivery", "Pay on delivery", "Pay when your order arrives"],
              ] as const
            ).map(([value, title, hint]) => (
              <label
                key={value}
                className={`flex cursor-pointer items-start gap-3.5 rounded-2xl border p-4 transition ${
                  method === value ? "border-accent bg-accent/5" : "border-border bg-surface hover:border-accent/50"
                }`}
              >
                <input
                  type="radio"
                  name="method"
                  value={value}
                  checked={method === value}
                  onChange={() => setMethod(value)}
                  className="mt-1 h-4 w-4 accent-[var(--accent)]"
                />
                <span>
                  <span className="block text-sm font-medium">{title}</span>
                  <span className="text-sm text-muted">{hint}</span>
                </span>
              </label>
            ))}
            <p className="flex items-center gap-2 pt-1 text-xs text-muted">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              Online payments are handled by Paystack. We never see your card or Mobile Money details.
            </p>
          </fieldset>

          {error && (
            <p role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button type="submit" disabled={pending} className="btn-primary w-full sm:w-auto sm:px-10">
            {pending ? "Please wait…" : method === "paystack" ? `Pay ${formatPrice(subtotal)}` : "Place order"}
          </button>
        </form>

        <aside className="h-fit rounded-2xl border border-border bg-surface p-6 lg:sticky lg:top-28">
          <h2 className="font-display text-2xl font-medium">Order summary</h2>
          <ul className="mt-5 space-y-3.5 text-sm">
            {items.map((i) => (
              <li key={i.variantId} className="flex justify-between gap-4">
                <span>
                  {i.name}
                  {i.size !== "One size" && <span className="text-muted"> · {i.size}</span>}
                  <span className="text-muted"> × {i.quantity}</span>
                </span>
                <span>{formatPrice(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex justify-between border-t border-border pt-5 text-lg font-medium">
            <span>Total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <p className="mt-3 text-xs text-muted">Delivery costs, if any, are confirmed with you after you order.</p>
          <Link href="/cart" className="mt-4 block text-sm text-accent underline underline-offset-4">
            Edit cart
          </Link>
        </aside>
      </div>
    </div>
  );
}
