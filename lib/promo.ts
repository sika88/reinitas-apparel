import { publicClient } from "./supabase/public";
import { PROMO_DEFAULT, type PromoConfig } from "./promo-shared";

type Row = {
  promo_enabled: boolean | null;
  promo_url: string | null;
  promo_alt: string | null;
  promo_link: string | null;
  promo_animation: string | null;
  promo_frame: boolean | null;
};

// Never breaks the page: if anything goes wrong the default design is shown
export async function getPromo(): Promise<PromoConfig> {
  try {
    const { data } = await publicClient()
      .from("site_settings")
      .select("promo_enabled,promo_url,promo_alt,promo_link,promo_animation,promo_frame")
      .eq("id", 1)
      .maybeSingle();
    const r = data as Row | null;
    if (!r) return PROMO_DEFAULT;
    return {
      enabled: r.promo_enabled !== false,
      url: r.promo_url || null,
      alt: r.promo_alt ?? "",
      link: r.promo_link ?? "",
      animation: r.promo_animation === "float" || r.promo_animation === "none" ? r.promo_animation : "swing",
      frame: r.promo_frame !== false,
    };
  } catch {
    return PROMO_DEFAULT;
  }
}
