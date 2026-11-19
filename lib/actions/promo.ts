"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { isSafeLink } from "@/lib/promo-shared";
import { isOwnStorageUrl } from "@/lib/storage";

const schema = z.object({
  enabled: z.boolean(),
  url: z.string().max(600).nullable(),
  alt: z.string().trim().max(120),
  link: z.string().trim().max(300),
  animation: z.enum(["swing", "float", "none"]),
  frame: z.boolean(),
});

export async function savePromo(input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase } = await requireAdmin();

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form and try again." };
  const d = parsed.data;

  if (d.url && !isOwnStorageUrl(d.url)) return { ok: false, error: "That image isn't valid. Please upload it again." };
  if (d.url && !d.alt) {
    return { ok: false, error: "Add a short description of the image, for people who can't see it." };
  }
  if (!isSafeLink(d.link)) {
    return { ok: false, error: "The link must start with / (a page on your shop) or https://" };
  }

  const { error } = await supabase
    .from("site_settings")
    .update({
      promo_enabled: d.enabled,
      promo_url: d.url,
      promo_alt: d.alt,
      promo_link: d.link,
      promo_animation: d.animation,
      promo_frame: d.frame,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    return { ok: false, error: `${error.message}. If this mentions a missing column, run the database update first.` };
  }

  revalidatePath("/admin/promo");
  return { ok: true };
}
