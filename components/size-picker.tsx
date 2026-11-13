"use client";

import Link from "next/link";
import { useState } from "react";
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
    setTimeout(() => setAdded(false), 2500);
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
      : added
        ? "Added to cart ✓"
        : "Add to cart";

  return (
    <div className="space-y-5">
      {needsSize && (
        <div>
          <div className="mb-2 flex items-baseline justify-between text-sm">
            <span className="font-medium">Size</span>
            <span className="text-muted">{size ? `Selected: ${size}` : "Select a size"}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {sorted.map((v) => {
              const out = v.stock === 0;
              const active = v.size === size;
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={out}
                  aria-pressed={active}
                  onClick={() => setSize(v.size)}
                  className={`min-w-12 rounded-lg border px-3 py-2 text-sm transition ${
                    active
                      ? "border-accent bg-accent text-white"
                      : "border-border bg-surface hover:border-accent"
                  } ${out ? "cursor-not-allowed opacity-40 line-through hover:border-border" : ""}`}
                >
                  {v.size}
                </button>
              );
            })}
          </div>
          {selected && selected.stock > 0 && selected.stock <= 3 && (
            <p className="mt-2 text-xs font-medium text-accent">Only {selected.stock} left</p>
          )}
        </div>
      )}

      <div className="space-y-3">
        <button
          type="button"
          onClick={addToCart}
          disabled={!canAdd}
          className="w-full rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {label}
        </button>

        {added && (
          <Link href="/cart" className="block text-center text-sm text-accent underline">
            View cart and checkout
          </Link>
        )}

        {whatsapp && (
          <button
            type="button"
            onClick={enquire}
            className="w-full rounded-full border border-border bg-surface px-6 py-3 text-sm font-medium transition hover:border-accent"
          >
            Ask a question on WhatsApp
          </button>
        )}
      </div>
    </div>
  );
}
