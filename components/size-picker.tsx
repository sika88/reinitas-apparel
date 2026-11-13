"use client";

import { useState } from "react";
import { sortSizes, waLink } from "@/lib/format";
import type { SizeType, Variant } from "@/lib/types";

export default function SizePicker({
  productName,
  sizeType,
  variants,
  whatsapp,
}: {
  productName: string;
  sizeType: SizeType;
  variants: Variant[];
  whatsapp: string;
}) {
  const sorted = sortSizes(variants);
  const needsSize = sizeType !== "none";
  const [size, setSize] = useState<string | null>(null);
  const selected = sorted.find((v) => v.size === size);
  const soldOut = sorted.every((v) => v.stock === 0);

  function enquire() {
    const sizePart = needsSize && size ? ` (size ${size})` : "";
    const text = `Hello! I'd like to ask about "${productName}"${sizePart}.\n${window.location.href}`;
    window.open(waLink(whatsapp, text), "_blank", "noopener");
  }

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

      {soldOut && <p className="text-sm font-medium text-muted">This item is currently sold out.</p>}

      {whatsapp ? (
        <button
          type="button"
          onClick={enquire}
          className="w-full rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
        >
          Enquire on WhatsApp
        </button>
      ) : (
        <p className="text-sm text-muted">WhatsApp number not set yet.</p>
      )}
    </div>
  );
}
