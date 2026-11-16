import { formatPrice } from "@/lib/format";
import type { Pricing } from "@/lib/pricing";

export default function PriceTag({ pricing, size = "md" }: { pricing: Pricing; size?: "md" | "lg" }) {
  const big = size === "lg";

  if (!pricing.onSale) {
    return <span className={big ? "text-3xl" : "text-sm"}>{formatPrice(pricing.price)}</span>;
  }

  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className={`font-medium text-accent ${big ? "text-3xl" : "text-sm"}`}>
        <span className="sr-only">Now </span>
        {formatPrice(pricing.price)}
      </span>
      <s className={`text-muted ${big ? "text-lg" : "text-xs"}`}>
        <span className="sr-only">Was </span>
        {formatPrice(pricing.original)}
      </s>
      <span className={`rounded-full bg-gold/30 px-2 py-0.5 font-medium text-accent-dark ${big ? "text-sm" : "text-[11px]"}`}>
        −{pricing.percent}%
      </span>
    </span>
  );
}
