"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { slugify } from "@/lib/slug";

type Result = { ok: true; message?: string } | { ok: false; error: string };

const id = z.string().uuid();
const name = z.string().trim().min(2, "The name is too short.").max(40, "The name is too long.");

function refresh() {
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
}

export async function createCategory(input: unknown): Promise<Result> {
  const { supabase } = await requireAdmin();
  const parsed = z.object({ name, sizeType: z.enum(["clothing", "shoe", "none"]) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const d = parsed.data;

  const { data: all } = await supabase.from("categories").select("name,slug,sort_order");
  const rows = all ?? [];
  if (rows.some((r) => String(r.name).toLowerCase() === d.name.toLowerCase())) {
    return { ok: false, error: `You already have a category called “${d.name}”.` };
  }

  const base = slugify(d.name);
  const slug = rows.some((r) => r.slug === base) ? `${base}-${Math.random().toString(36).slice(2, 6)}` : base;
  const sortOrder = rows.reduce((m, r) => Math.max(m, Number(r.sort_order) || 0), 0) + 1;

  const { error } = await supabase
    .from("categories")
    .insert({ name: d.name, slug, size_type: d.sizeType, sort_order: sortOrder, visible: true });
  if (error) return { ok: false, error: error.message };

  refresh();
  return { ok: true };
}

export async function renameCategory(categoryId: string, newName: string): Promise<Result> {
  const { supabase } = await requireAdmin();
  const i = id.safeParse(categoryId);
  const n = name.safeParse(newName);
  if (!i.success || !n.success) return { ok: false, error: n.success ? "Invalid category." : n.error.issues[0].message };

  const { data: dupes } = await supabase.from("categories").select("id,name");
  if ((dupes ?? []).some((r) => r.id !== i.data && String(r.name).toLowerCase() === n.data.toLowerCase())) {
    return { ok: false, error: `You already have a category called “${n.data}”.` };
  }

  // the web address (slug) stays the same, so existing links keep working
  const { error } = await supabase.from("categories").update({ name: n.data }).eq("id", i.data);
  if (error) return { ok: false, error: error.message };

  refresh();
  return { ok: true };
}

export async function setCategoryVisible(categoryId: string, visible: boolean): Promise<Result> {
  const { supabase } = await requireAdmin();
  if (!id.safeParse(categoryId).success) return { ok: false, error: "Invalid category." };
  const { error } = await supabase.from("categories").update({ visible }).eq("id", categoryId);
  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true };
}

// Hides every shown category that has no visible product
export async function hideEmptyCategories(): Promise<Result> {
  const { supabase } = await requireAdmin();
  const [{ data: cats }, { data: prods }] = await Promise.all([
    supabase.from("categories").select("id").eq("visible", true),
    supabase.from("products").select("category_id").eq("active", true),
  ]);
  const used = new Set((prods ?? []).map((p) => p.category_id as string));
  const toHide = (cats ?? []).map((c) => c.id as string).filter((cid) => !used.has(cid));

  if (toHide.length === 0) return { ok: true, message: "There are no empty categories to hide." };

  const { error } = await supabase.from("categories").update({ visible: false }).in("id", toHide);
  if (error) return { ok: false, error: error.message };

  refresh();
  return { ok: true, message: `${toHide.length} empty ${toHide.length === 1 ? "category" : "categories"} hidden from the shop.` };
}

export async function moveCategory(categoryId: string, dir: "up" | "down"): Promise<Result> {
  const { supabase } = await requireAdmin();
  if (!id.safeParse(categoryId).success) return { ok: false, error: "Invalid category." };

  const { data } = await supabase.from("categories").select("id").order("sort_order").order("name");
  const ids = (data ?? []).map((r) => r.id as string);
  const i = ids.indexOf(categoryId);
  if (i < 0) return { ok: false, error: "Category not found." };

  const j = dir === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= ids.length) return { ok: true };
  [ids[i], ids[j]] = [ids[j], ids[i]];

  // renumber everything, which also clears any duplicate order numbers
  await Promise.all(ids.map((cid, k) => supabase.from("categories").update({ sort_order: k + 1 }).eq("id", cid)));

  refresh();
  return { ok: true };
}

export async function deleteCategory(categoryId: string): Promise<Result> {
  const { supabase } = await requireAdmin();
  if (!id.safeParse(categoryId).success) return { ok: false, error: "Invalid category." };

  const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("category_id", categoryId);
  if ((count ?? 0) > 0) {
    return { ok: false, error: `This category still has ${count} ${count === 1 ? "product" : "products"}. Move or delete them first.` };
  }

  const { error } = await supabase.from("categories").delete().eq("id", categoryId);
  if (error) return { ok: false, error: error.message };

  refresh();
  return { ok: true };
}
