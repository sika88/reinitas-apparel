"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { MAX_SLIDES } from "@/lib/hero-shared";
import { isOwnStorageUrl } from "@/lib/storage";

const schema = z.object({
  enabled: z.boolean(),
  slides: z
    .array(z.object({ url: z.string().max(600), focus: z.enum(["top", "center", "bottom"]) }))
    .max(MAX_SLIDES),
  tint: z.enum(["light", "medium", "strong"]),
  seconds: z.number().int().min(3).max(20),
});

export async function saveHeroSlides(input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase } = await requireAdmin();

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form and try again." };
  const d = parsed.data;

  if (!d.slides.every((s) => isOwnStorageUrl(s.url))) {
    return { ok: false, error: "One of the photos isn't valid. Please upload it again." };
  }

  const { error } = await supabase
    .from("site_settings")
    .update({
      hero_slides: d.slides,
      hero_slides_enabled: d.enabled,
      hero_tint: d.tint,
      hero_slide_seconds: d.seconds,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    return { ok: false, error: `${error.message}. If this mentions a missing column, run the database update first.` };
  }

  revalidatePath("/admin/hero");
  return { ok: true };
}
