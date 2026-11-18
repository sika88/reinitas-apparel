"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { slugify } from "@/lib/slug";
import { isOwnStorageUrl } from "@/lib/storage";

type Result = { ok: true } | { ok: false; error: string };

const schema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  categoryId: z.string().uuid(),
  price: z.number().int().min(0).max(10_000_000), // pesewas
  description: z.string().trim().max(3000),
  images: z.array(z.string().max(600)).max(8),
  active: z.boolean(),
  featured: z.boolean(),
  size: z.string().trim().max(12).regex(/^[A-Za-z0-9 ./-]*$/).nullable(),
  stock: z.number().int().min(0).max(100000),
  stockChanged: z.boolean(), // only write stock when the admin changed it, so a sale isn't overwritten
});

export async function saveProduct(input: unknown): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const { supabase } = await requireAdmin();

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the form: a name, a price and the quantity in stock are required." };
  }
  const d = parsed.data;
  if (!d.images.every(isOwnStorageUrl)) return { ok: false, error: "One of the images is invalid. Please upload it again." };

  const { data: cat } = await supabase.from("categories").select("size_type").eq("id", d.categoryId).maybeSingle();
  if (!cat) return { ok: false, error: "Choose a category." };

  const size = cat.size_type === "none" ? "One size" : (d.size ?? "").trim();
  if (!size) return { ok: false, error: "Choose the size this product is posted under." };

  const fields = {
    category_id: d.categoryId,
    name: d.name,
    description: d.description,
    price_pesewas: d.price,
    images: d.images,
    active: d.active,
    featured: d.featured,
  };

  let productId = d.id;
  const creating = !productId;

  if (productId) {
    const { error } = await supabase.from("products").update(fields).eq("id", productId);
    if (error) return { ok: false, error: error.message };
  } else {
    const base = size === "One size" ? slugify(d.name) : `${slugify(d.name)}-${slugify(size)}`;
    const { data: taken } = await supabase.from("products").select("id").eq("slug", base).maybeSingle();
    const slug = taken ? `${base}-${Math.random().toString(36).slice(2, 6)}` : base;
    const { data, error } = await supabase.from("products").insert({ ...fields, slug }).select("id").single();
    if (error || !data) return { ok: false, error: error?.message ?? "Could not create the product." };
    productId = data.id as string;
  }

  const { data: existing } = await supabase.from("product_variants").select("id,size").eq("product_id", productId);
  const rows = existing ?? [];

  if (rows.length > 1) {
    return {
      ok: false,
      error: "This product still has several sizes in one listing. Run the size-split SQL first, then reload this page.",
    };
  }

  if (rows.length === 1) {
    const patch: { size: string; stock?: number } = { size };
    if (d.stockChanged) patch.stock = d.stock;
    const { error } = await supabase.from("product_variants").update(patch).eq("id", rows[0].id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("product_variants").insert({ product_id: productId, size, stock: d.stock });
    if (error) {
      if (creating) await supabase.from("products").delete().eq("id", productId); // don't leave an empty listing behind
      return { ok: false, error: error.message };
    }
  }

  revalidatePath("/admin/products");
  return { ok: true, id: productId };
}

export async function setProductActive(productId: string, active: boolean) {
  const { supabase } = await requireAdmin();
  z.string().uuid().parse(productId);
  await supabase.from("products").update({ active }).eq("id", productId);
  revalidatePath("/admin/products");
}

export async function deleteProduct(productId: string) {
  const { supabase } = await requireAdmin();
  z.string().uuid().parse(productId);
  // Past orders keep their own copy of the name, size and price
  await supabase.from("products").delete().eq("id", productId);
  revalidatePath("/admin/products");
}

export async function setProductDiscount(productId: string, percent: number | null): Promise<Result> {
  const { supabase } = await requireAdmin();
  if (!z.string().uuid().safeParse(productId).success) return { ok: false, error: "Invalid product." };
  const p = z.number().int().min(1).max(90).nullable().safeParse(percent);
  if (!p.success) return { ok: false, error: "Enter a discount between 1% and 90%, or leave it empty." };

  const { error } = await supabase.from("products").update({ discount_percent: p.data }).eq("id", productId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/products");
  return { ok: true };
}
