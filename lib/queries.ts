import { cache } from "react";
import { priceFor, type ActiveSale } from "./pricing";
import { publicClient } from "./supabase/public";
import { sortSizes } from "./format";
import type { Category, Product, SiteSettings, Variant } from "./types";

const PRODUCT_SELECT =
  "id,name,slug,description,price_pesewas,images,featured,created_at,category_id,discount_percent," +
  "category:categories(name,slug,size_type)," +
  "variants:product_variants(id,size,stock)";

type RawProduct = Omit<Product, "pricing">;

const DEFAULT_SETTINGS: SiteSettings = {
  business_name: "Reinita's Apparel",
  tagline: "",
  logo_url: null,
  hero_image_url: null,
  whatsapp_number: "",
  momo_number: "",
  momo_name: "",
  momo_network: "MTN MoMo",
};

export async function getSettings(): Promise<SiteSettings> {
  const { data } = await publicClient()
    .from("site_settings")
    .select("business_name,tagline,logo_url,hero_image_url,whatsapp_number,momo_number,momo_name,momo_network")
    .eq("id", 1)
    .maybeSingle();
  return (data as SiteSettings | null) ?? DEFAULT_SETTINGS;
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await publicClient()
    .from("categories")
    .select("id,name,slug,size_type")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []) as Category[];
}

// Row Level Security only returns sales that are live right now
export const getActiveSales = cache(async (): Promise<ActiveSale[]> => {
  const { data } = await publicClient()
    .from("sales")
    .select("id,name,percent_off,scope,category_ids,ends_at,banner_text")
    .order("percent_off", { ascending: false });
  return (data ?? []) as ActiveSale[];
});

export function toVariants(v: unknown): Variant[] {
  if (Array.isArray(v)) return v as Variant[];
  if (typeof v === "string") {
    try {
      return toVariants(JSON.parse(v));
    } catch {
      return [];
    }
  }
  if (v && typeof v === "object") return [v as Variant]; // single object -> one-item list
  return [];
}

function withPricing(list: RawProduct[], sales: ActiveSale[]): Product[] {
  return list.map((p) => {
    const item = { ...p, variants: sortSizes(toVariants(p.variants)) };
    return { ...item, pricing: priceFor(item, sales) };
  });
}

export async function getProducts(
  opts: { categorySlug?: string; limit?: number } = {},
): Promise<Product[]> {
  const sb = publicClient();
  let query = sb
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (opts.categorySlug) {
    const { data: cat } = await sb
      .from("categories")
      .select("id")
      .eq("slug", opts.categorySlug)
      .maybeSingle();
    if (!cat) return [];
    query = query.eq("category_id", cat.id);
  }
  if (opts.limit) query = query.limit(opts.limit);

  const [{ data, error }, sales] = await Promise.all([query, getActiveSales()]);
  if (error) throw new Error(error.message);
  return withPricing((data ?? []) as unknown as RawProduct[], sales);
}

// cache() lets generateMetadata and the page share one query per request
export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  const [{ data, error }, sales] = await Promise.all([
    publicClient().from("products").select(PRODUCT_SELECT).eq("slug", slug).eq("active", true).maybeSingle(),
    getActiveSales(),
  ]);
  if (error) throw new Error(error.message);
  if (!data) return null;
  return withPricing([data as unknown as RawProduct], sales)[0];
});
