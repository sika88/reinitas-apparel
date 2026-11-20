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
  call_number: z.string().trim(),
  admin_phone: z.string().trim(),
  momo_number: z.string().trim(),
  momo_name: z.string().trim().max(80),
  momo_network: z.enum(["MTN MoMo", "Telecel Cash", "AirtelTigo Money"]),
  logo_url: z.string().nullable(),
  hero_image_url: z.string().nullable(),
});

// 0241234567, 024 123 4567 or +233 24 123 4567  ->  233241234567
function cleanIntl(input: string): string | null {
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

  const whatsapp = cleanIntl(d.whatsapp_number);
  if (whatsapp === null) return { ok: false, error: "Enter a valid WhatsApp number, for example 0241234567." };

  const call = cleanIntl(d.call_number);
  if (call === null) return { ok: false, error: "Enter a valid phone number for customers to call, for example 0241234567." };

  let adminPhone = "";
  if (d.admin_phone) {
    const n = normalizeGhPhone(d.admin_phone);
    if (!n) return { ok: false, error: "Enter a valid phone number for SMS alerts, for example 0241234567." };
    adminPhone = n;
  }

  let momoNumber = "";
  if (d.momo_number) {
    const n = normalizeGhPhone(d.momo_number);
    if (!n) return { ok: false, error: "Enter a valid MoMo number, for example 0241234567." };
    if (!d.momo_name) return { ok: false, error: "Add the MoMo account name, so customers can check who they are paying." };
    momoNumber = n;
  }

  const { error } = await supabase
    .from("site_settings")
    .update({
      business_name: d.business_name,
      tagline: d.tagline,
      whatsapp_number: whatsapp,
      logo_url: d.logo_url,
      hero_image_url: d.hero_image_url,
      momo_number: momoNumber,
      momo_name: momoNumber ? d.momo_name : "",
      momo_network: d.momo_network,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) return { ok: false, error: error.message };

  const { error: pErr } = await supabase.from("private_settings").upsert({ id: 1, admin_phone: adminPhone });
  if (pErr) return { ok: false, error: pErr.message };

  // saved on its own, so everything above still saves if the database update hasn't been run yet
  const { error: cErr } = await supabase.from("site_settings").update({ call_number: call }).eq("id", 1);
  if (cErr) {
    return {
      ok: false,
      error: "Your other settings were saved, but the call number couldn't be saved yet. Run the database update, then save again.",
    };
  }

  revalidatePath("/admin/settings");
  return { ok: true };
}
