"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

export default function CartLink() {
  const { count, hydrated } = useCart();
  return (
    <Link href="/cart" className="text-sm text-muted transition hover:text-foreground">
      Cart
      {hydrated && count > 0 && (
        <span className="ml-1.5 rounded-full bg-accent px-1.5 py-0.5 text-[11px] font-medium text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
