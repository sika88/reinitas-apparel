"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { slugify } from "@/lib/slug";
import { isOwnStorageUrl } from "@/lib/storage";

const schema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  categoryId: z.string().uuid(),
  price: z.number().int().min(0).max(10_000_000), // pesewas
  description: z.string().trim().max(3000),
  images: z.array(z.string().max(600)).max(8),
  active: z.boolean(),
  featured: z.boolean(),
  variants: z
    .array(
      z.object({
        size: z.string().trim().min(1).max(12).regex(/^[A-Za-z0-9 ./-]+$/),
        stock: z.number().int().min(0).max(100000),
        changed: z.boolean(), // only changed sizes get their stock written
      }),
    )
    .min(1)
    .max(30),
});

export async function saveProduct(input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase } = await requireAdmin();

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the form: a name, a price and at least one size with stock are required." };
  }
  const d = parsed.data;
  if (!d.images.every(isOwnStorageUrl)) return { ok: false, error: "One of the images is invalid. Please upload it again." };

  const sizes = d.variants.map((v) => v.size);
  if (new Set(sizes).size !== sizes.length) return { ok: false, error: "Each size can only appear once." };

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
  if (productId) {
    const { error } = await supabase.from("products").update(fields).eq("id", productId);
    if (error) return { ok: false, error: error.message };
  } else {
    const base = slugify(d.name);
    const { data: taken } = await supabase.from("products").select("id").eq("slug", base).maybeSingle();
    const slug = taken ? `${base}-${Math.random().toString(36).slice(2, 6)}` : base;
    const { data, error } = await supabase.from("products").insert({ ...fields, slug }).select("id").single();
    if (error || !data) return { ok: false, error: error?.message ?? "Could not create the product." };
    productId = data.id as string;
  }

  // Only write stock for new or changed sizes, so a customer's purchase isn't overwritten by a stale form
  const toWrite = d.variants.filter((v) => v.changed);
  if (toWrite.length > 0) {
    const { error } = await supabase
      .from("product_variants")
      .upsert(
        toWrite.map((v) => ({ product_id: productId, size: v.size, stock: v.stock })),
        { onConflict: "product_id,size" },
      );
    if (error) return { ok: false, error: error.message };
  }

  // Sizes that were removed from the form
  const { data: existing } = await supabase.from("product_variants").select("id,size").eq("product_id", productId);
  const removeIds = (existing ?? []).filter((v) => !sizes.includes(v.size)).map((v) => v.id);
  if (removeIds.length > 0) await supabase.from("product_variants").delete().in("id", removeIds);

  revalidatePath("/admin/products");
  return { ok: true };
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
