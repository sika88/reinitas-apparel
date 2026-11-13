import Image from "next/image";
import Link from "next/link";
import { formatPrice, sortSizes } from "@/lib/format";
import type { Product } from "@/lib/types";

export default function ProductCard({ product: p }: { product: Product }) {
  const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
  const availableSizes = sortSizes(p.variants)
    .filter((v) => v.stock > 0)
    .map((v) => v.size);
  const showSizes = p.category?.size_type !== "none" && availableSizes.length > 0;

  return (
    <Link href={`/product/${p.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-border bg-surface">
        {p.images[0] ? (
          <Image
            src={p.images[0]}
            alt={p.name}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-6xl text-accent/30">
            {p.name.charAt(0)}
          </div>
        )}
        {totalStock === 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-foreground px-2.5 py-1 text-xs text-background">
            Sold out
          </span>
        )}
      </div>
      <div className="mt-3 space-y-0.5">
        <h3 className="text-sm font-medium">{p.name}</h3>
        <p className="text-sm text-muted">{formatPrice(p.price_pesewas)}</p>
        {showSizes && <p className="text-xs text-muted">Sizes: {availableSizes.join(" · ")}</p>}
      </div>
    </Link>
  );
}
