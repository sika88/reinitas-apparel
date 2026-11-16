"use server";

import { z } from "zod";
import { priceFor } from "@/lib/pricing";
import { getActiveSales } from "@/lib/queries";
import { publicClient } from "@/lib/supabase/public";

export type CartRow = { variantId: string; available: boolean; price: number; original: number; stock: number };

type DbRow = {
  id: string;
  stock: number;
  product: { price_pesewas: number; discount_percent: number | null; category_id: string | null; active: boolean } | null;
};

// Read-only: current price and stock for the variants in someone's cart
export async function refreshCartPrices(variantIds: string[]): Promise<CartRow[]> {
  const ids = z.array(z.string().uuid()).max(20).safeParse(variantIds);
  if (!ids.success || ids.data.length === 0) return [];

  const [sales, res] = await Promise.all([
    getActiveSales(),
    publicClient()
      .from("product_variants")
      .select("id,stock,product:products(price_pesewas,discount_percent,category_id,active)")
      .in("id", ids.data),
  ]);
  const rows = (res.data ?? []) as unknown as DbRow[];

  return ids.data.map((id) => {
    const r = rows.find((x) => x.id === id);
    if (!r || !r.product || !r.product.active) {
      return { variantId: id, available: false, price: 0, original: 0, stock: 0 };
    }
    const p = priceFor(r.product, sales);
    return { variantId: id, available: r.stock > 0, price: p.price, original: p.original, stock: r.stock };
  });
}
