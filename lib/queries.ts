import { cache } from "react";
import { publicClient } from "./supabase/public";
import type { Category, Product, SiteSettings } from "./types";

const PRODUCT_SELECT =
  "id,name,slug,description,price_pesewas,images,featured,created_at," +
  "category:categories(name,slug,size_type)," +
  "variants:product_variants(id,size,stock)";

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

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Product[];
}

// cache() lets generateMetadata and the page share one query per request
export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  const { data, error } = await publicClient()
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as Product | null) ?? null;
});
