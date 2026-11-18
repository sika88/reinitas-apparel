"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { useCart } from "@/lib/cart";
import { sortSizes, waLink } from "@/lib/format";
import type { SizeType, Variant } from "@/lib/types";

type ProductInfo = { id: string; slug: string; name: string; price: number; image: string | null };

export default function SizePicker({
  product,
  sizeType,
  variants,
  whatsapp,
  moreHref,
}: {
  product: ProductInfo;
  sizeType: SizeType;
  variants: Variant[];
  whatsapp: string;
  moreHref?: string;
}) {
  const labelId = useId();
  const { add } = useCart();
  const sorted = sortSizes(variants);
  const sized = sizeType !== "none";
  const single = sorted.length === 1;
  const [size, setSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  // one listing = one size, so there is nothing to choose. Older multi-size listings still get a picker.
  const selected = single ? sorted[0] : sorted.find((v) => v.size === size);
  const variant = sized ? selected : sorted[0];
  const soldOut = sorted.every((v) => v.stock === 0);
  const canAdd = Boolean(variant && variant.stock > 0);

  function addToCart() {
    if (!variant || variant.stock === 0) return;
    add({
      variantId: variant.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      size: variant.size,
      price: product.price,
      image: product.image,
      quantity: 1,
      maxStock: variant.stock,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 4000);
  }

  function enquire() {
    const sizePart = sized && variant ? ` (size ${variant.size})` : "";
    const text = `Hello! I'd like to ask about "${product.name}"${sizePart}.\n${window.location.href}`;
    window.open(waLink(whatsapp, text), "_blank", "noopener");
  }

  const label = soldOut ? "Sold out" : sized && !selected ? "Select a size" : "Add to cart";

  return (
    <div className="space-y-6">
      {sized && single && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4">
          <div>
            <p className="eyebrow">Size</p>
            <p className="font-display text-4xl font-medium leading-none">{sorted[0].size}</p>
          </div>
          <div className="text-right text-sm">
            <p className={sorted[0].stock === 0 ? "font-medium text-red-600" : sorted[0].stock <= 3 ? "font-medium text-accent" : "text-muted"}>
              {sorted[0].stock === 0 ? "Sold out in this size" : sorted[0].stock <= 3 ? `Only ${sorted[0].stock} left` : "In stock"}
            </p>
            {moreHref && (
              <Link href={moreHref} className="mt-1 inline-block text-accent underline underline-offset-4">
                See other sizes
              </Link>
            )}
          </div>
        </div>
      )}

      {sized && !single && (
        <div role="group" aria-labelledby={labelId}>
          <div className="mb-3 flex items-baseline justify-between text-sm">
            <span id={labelId} className="font-medium">
              Size
            </span>
            <span className="text-muted">{size ? `Selected: ${size}` : "Select a size"}</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {sorted.map((v) => {
              const out = v.stock === 0;
              const active = v.size === size;
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={out}
                  aria-pressed={active}
                  aria-label={out ? `${v.size}, sold out` : v.size}
                  onClick={() => setSize(v.size)}
                  className={`min-h-11 min-w-12 rounded-lg border px-3.5 text-sm transition ${
                    active ? "border-accent bg-accent text-white" : "border-border bg-surface hover:border-accent"
                  } ${out ? "cursor-not-allowed text-muted line-through opacity-50 hover:border-border" : ""}`}
                >
                  {v.size}
                </button>
              );
            })}
          </div>
          {selected && selected.stock > 0 && selected.stock <= 3 && (
            <p className="mt-3 text-sm font-medium text-accent">Only {selected.stock} left in this size</p>
          )}
        </div>
      )}

      <div className="space-y-3">
        <button type="button" onClick={addToCart} disabled={!canAdd} className="btn-primary w-full">
          {label}
        </button>

        <p role="status" aria-live="polite" className="min-h-5 text-center text-sm">
          {added && (
            <>
              Added to your cart.{" "}
              <Link href="/cart" className="font-medium text-accent underline underline-offset-2">
                View cart
              </Link>
            </>
          )}
        </p>

        {whatsapp && (
          <button type="button" onClick={enquire} className="btn-outline w-full">
            Ask about this on WhatsApp
          </button>
        )}
      </div>
    </div>
  );
}
