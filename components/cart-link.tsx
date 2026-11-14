"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

export default function CartLink() {
  const { count, hydrated } = useCart();
  const label = hydrated && count > 0 ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart";

  return (
    <Link
      href="/cart"
      aria-label={label}
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-cream"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
        <path d="M6 8h12l-1 12H7L6 8Z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </svg>
      {hydrated && count > 0 && (
        <span aria-hidden="true" className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-medium text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
