import Image from "next/image";
import Link from "next/link";
import PriceTag from "@/components/price-tag";
import { sortSizes } from "@/lib/format";
import type { Product } from "@/lib/types";

export default function ProductCard({ product: p }: { product: Product }) {
  const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
  const availableSizes = sortSizes(p.variants)
    .filter((v) => v.stock > 0)
    .map((v) => v.size);
  const showSizes = p.category?.size_type !== "none" && availableSizes.length > 0;
  const low = totalStock > 0 && totalStock <= 3;

  return (
    <Link href={`/product/${p.slug}`} className="group block rounded-2xl">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-cream">
        {p.images[0] ? (
          <Image
            src={p.images[0]}
            alt={p.name}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-7xl text-accent/25">
            {p.name.charAt(0)}
          </div>
        )}
        {p.images[1] && (
          <Image
            src={p.images[1]}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-cover opacity-0 transition duration-500 group-hover:opacity-100"
          />
        )}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {p.pricing.onSale && totalStock > 0 && (
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-white">−{p.pricing.percent}%</span>
          )}
          {totalStock === 0 && (
            <span className="rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background">Sold out</span>
          )}
          {low && <span className="rounded-full bg-gold px-3 py-1 text-xs font-medium text-accent-dark">Few left</span>}
        </div>
      </div>

      <div className="mt-3.5 space-y-1">
        {p.category && <p className="eyebrow">{p.category.name}</p>}
        <h3 className="font-display text-xl font-medium leading-snug transition group-hover:text-accent">{p.name}</h3>
        <PriceTag pricing={p.pricing} />
        {showSizes && <p className="text-xs text-muted">Sizes {availableSizes.join(" · ")}</p>}
      </div>
    </Link>
  );
}
