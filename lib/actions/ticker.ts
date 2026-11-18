"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { parseTickerText } from "@/lib/ticker-shared";

const schema = z.object({
  enabled: z.boolean(),
  text: z.string().max(2000),
  style: z.enum(["classic", "sale"]),
  speed: z.enum(["slow", "normal", "fast"]),
});

export async function saveTicker(input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase } = await requireAdmin();

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form and try again." };
  const d = parsed.data;

  const { error } = await supabase
    .from("site_settings")
    .update({
      ticker_enabled: d.enabled,
      ticker_items: parseTickerText(d.text),
      ticker_style: d.style,
      ticker_speed: d.speed,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    return { ok: false, error: `${error.message}. If this mentions a missing column, run the database update first.` };
  }

  revalidatePath("/admin/banner");
  return { ok: true };
}
