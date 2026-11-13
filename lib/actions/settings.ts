"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { normalizeGhPhone } from "@/lib/phone";
import { isOwnStorageUrl } from "@/lib/storage";

const schema = z.object({
  business_name: z.string().trim().min(2).max(80),
  tagline: z.string().trim().max(160),
  whatsapp_number: z.string().trim(),
  admin_phone: z.string().trim(),
  logo_url: z.string().nullable(),
  hero_image_url: z.string().nullable(),
});

function cleanWhatsapp(input: string): string | null {
  const d = input.replace(/\D/g, "");
  if (!d) return "";
  const intl = d.startsWith("0") ? "233" + d.slice(1) : d;
  return intl.length >= 11 && intl.length <= 15 ? intl : null;
}

export async function saveSettings(input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase } = await requireAdmin();

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form. The business name is required." };
  const d = parsed.data;

  for (const url of [d.logo_url, d.hero_image_url]) {
    if (url && !isOwnStorageUrl(url)) return { ok: false, error: "Invalid image. Please upload it again." };
  }

  const whatsapp = cleanWhatsapp(d.whatsapp_number);
  if (whatsapp === null) return { ok: false, error: "Enter a valid WhatsApp number, for example 0241234567." };

  let adminPhone = "";
  if (d.admin_phone) {
    const n = normalizeGhPhone(d.admin_phone);
    if (!n) return { ok: false, error: "Enter a valid phone number for SMS alerts, for example 0241234567." };
    adminPhone = n;
  }

  const { error } = await supabase
    .from("site_settings")
    .update({
      business_name: d.business_name,
      tagline: d.tagline,
      whatsapp_number: whatsapp,
      logo_url: d.logo_url,
      hero_image_url: d.hero_image_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) return { ok: false, error: error.message };

  const { error: pErr } = await supabase.from("private_settings").upsert({ id: 1, admin_phone: adminPhone });
  if (pErr) return { ok: false, error: pErr.message };

  revalidatePath("/admin/settings");
  return { ok: true };
}
