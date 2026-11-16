export type ActiveSale = {
  id: string;
  name: string;
  percent_off: number;
  scope: "all" | "categories";
  category_ids: string[];
  ends_at: string | null;
  banner_text: string;
};

export type Pricing = {
  price: number; // pesewas the customer pays
  original: number; // regular price in pesewas
  percent: number;
  onSale: boolean;
  label: string | null;
  endsAt: string | null;
};

export function discountedPrice(original: number, percent: number) {
  return Math.round((original * (100 - percent)) / 100);
}

// The customer gets the bigger of the product's own discount and any live sale that applies.
// Keep this identical to public.current_discount_percent in the database.
export function priceFor(
  p: { price_pesewas: number; discount_percent: number | null; category_id: string | null },
  sales: ActiveSale[],
): Pricing {
  const own = p.discount_percent ?? 0;
  let best = 0;
  let bestSale: ActiveSale | null = null;
  for (const s of sales) {
    const applies = s.scope === "all" || (p.category_id !== null && s.category_ids.includes(p.category_id));
    if (applies && s.percent_off > best) {
      best = s.percent_off;
      bestSale = s;
    }
  }
  const percent = Math.max(own, best);
  const saleWins = bestSale !== null && best >= own;
  return {
    price: percent > 0 ? discountedPrice(p.price_pesewas, percent) : p.price_pesewas,
    original: p.price_pesewas,
    percent,
    onSale: percent > 0,
    label: percent === 0 ? null : saleWins ? bestSale!.name : "Special price",
    endsAt: saleWins ? bestSale!.ends_at : null,
  };
}
