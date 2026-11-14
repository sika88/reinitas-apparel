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
}: {
  product: ProductInfo;
  sizeType: SizeType;
  variants: Variant[];
  whatsapp: string;
}) {
  const labelId = useId();
  const { add } = useCart();
  const sorted = sortSizes(variants);
  const needsSize = sizeType !== "none";
  const [size, setSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const selected = sorted.find((v) => v.size === size);
  const variant = needsSize ? selected : sorted[0];
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
    const sizePart = needsSize && size ? ` (size ${size})` : "";
    const text = `Hello! I'd like to ask about "${product.name}"${sizePart}.\n${window.location.href}`;
    window.open(waLink(whatsapp, text), "_blank", "noopener");
  }

  const label = soldOut
    ? "Sold out"
    : needsSize && !selected
      ? "Select a size"
      : "Add to cart";

  return (
    <div className="space-y-6">
      {needsSize && (
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
                    active
                      ? "border-accent bg-accent text-white"
                      : "border-border bg-surface hover:border-accent"
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
