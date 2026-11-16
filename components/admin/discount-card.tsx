"use client";

import { useState, useTransition } from "react";
import { useToast } from "@/components/admin/toast";
import { setProductDiscount } from "@/lib/actions/products";
import { formatPrice } from "@/lib/format";
import { discountedPrice } from "@/lib/pricing";

const QUICK = [10, 20, 30, 50];

export default function DiscountCard({
  productId,
  price,
  discount,
}: {
  productId: string;
  price: number;
  discount: number | null;
}) {
  const toast = useToast();
  const [value, setValue] = useState(discount ? String(discount) : "");
  const [saved, setSaved] = useState<number | null>(discount);
  const [pending, start] = useTransition();

  const pct = value.trim() === "" ? null : Number(value);
  const valid = pct === null || (Number.isInteger(pct) && pct >= 1 && pct <= 90);
  const dirty = valid && pct !== saved;

  function save() {
    start(async () => {
      const r = await setProductDiscount(productId, pct);
      if (r.ok) {
        setSaved(pct);
        toast.success(pct ? `Discount of ${pct}% saved` : "Discount removed");
      } else toast.error(r.error);
    });
  }

  return (
    <section className="mb-6 rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <h2 className="font-display text-2xl font-medium">Discount</h2>
      <p className="mt-1 text-sm text-muted">
        Take a percentage off this product. If a sale is also running, customers get whichever discount is bigger. They don’t add up.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">Percent off</span>
          <div className="relative">
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              inputMode="numeric"
              placeholder="None"
              className="field w-32 pr-8"
            />
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted">
              %
            </span>
          </div>
        </label>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Quick discounts">
          {QUICK.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setValue(String(q))}
              className="rounded-full border border-border px-3.5 py-2 text-sm transition hover:border-accent"
            >
              {q}%
            </button>
          ))}
        </div>

        <button type="button" onClick={save} disabled={!dirty || pending} className="btn-primary sm:ml-auto">
          {pending ? "Saving…" : pct === null ? "Remove discount" : "Save discount"}
        </button>
      </div>

      <p aria-live="polite" className="mt-3 text-sm">
        {!valid ? (
          <span className="text-red-600">Enter a whole number from 1 to 90, or leave it empty.</span>
        ) : pct ? (
          <>
            Customers pay <strong>{formatPrice(discountedPrice(price, pct))}</strong> instead of{" "}
            <span className="text-muted line-through">{formatPrice(price)}</span>.
          </>
        ) : (
          <span className="text-muted">No discount on this product.</span>
        )}
      </p>
    </section>
  );
}
