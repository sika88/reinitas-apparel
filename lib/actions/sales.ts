"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";

type Result = { ok: true } | { ok: false; error: string };

const isoDate = z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Invalid date").nullable();

const schema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(60),
  percentOff: z.number().int().min(1).max(90),
  scope: z.enum(["all", "categories"]),
  categoryIds: z.array(z.string().uuid()).max(20),
  startsAt: isoDate,
  endsAt: isoDate,
  bannerText: z.string().trim().max(120),
  enabled: z.boolean(),
});

export async function saveSale(input: unknown): Promise<Result> {
  const { supabase } = await requireAdmin();

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form. A name and a discount from 1% to 90% are required." };
  const d = parsed.data;

  if (d.scope === "categories" && d.categoryIds.length === 0) {
    return { ok: false, error: "Pick at least one category, or choose Everything." };
  }
  if (d.startsAt && d.endsAt && Date.parse(d.endsAt) <= Date.parse(d.startsAt)) {
    return { ok: false, error: "The end time must be after the start time." };
  }

  const row = {
    name: d.name,
    percent_off: d.percentOff,
    scope: d.scope,
    category_ids: d.scope === "categories" ? d.categoryIds : [],
    starts_at: d.startsAt,
    ends_at: d.endsAt,
    banner_text: d.bannerText,
    enabled: d.enabled,
  };

  const { error } = d.id
    ? await supabase.from("sales").update(row).eq("id", d.id)
    : await supabase.from("sales").insert(row);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/sales");
  return { ok: true };
}

export async function setSaleEnabled(saleId: string, enabled: boolean): Promise<Result> {
  const { supabase } = await requireAdmin();
  if (!z.string().uuid().safeParse(saleId).success) return { ok: false, error: "Invalid sale." };
  const { error } = await supabase.from("sales").update({ enabled }).eq("id", saleId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/sales");
  return { ok: true };
}

export async function deleteSale(saleId: string): Promise<Result> {
  const { supabase } = await requireAdmin();
  if (!z.string().uuid().safeParse(saleId).success) return { ok: false, error: "Invalid sale." };
  const { error } = await supabase.from("sales").delete().eq("id", saleId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/sales");
  return { ok: true };
}
