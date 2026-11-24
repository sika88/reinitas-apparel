import { HERO_DEFAULT, MAX_SLIDES, type HeroConfig, type HeroFocus, type HeroSlide, type HeroTint } from "./hero-shared";
import { publicClient } from "./supabase/public";

type Row = {
  hero_slides: unknown;
  hero_slides_enabled: boolean | null;
  hero_tint: string | null;
  hero_slide_seconds: number | null;
};

const FOCUS: HeroFocus[] = ["top", "center", "bottom"];

// Never breaks the page: if anything goes wrong, the hero simply has no slideshow
export async function getHeroSlides(): Promise<HeroConfig> {
  try {
    const { data, error } = await publicClient()
      .from("site_settings")
      .select("hero_slides,hero_slides_enabled,hero_tint,hero_slide_seconds")
      .eq("id", 1)
      .maybeSingle();
    const r = data as Row | null;
    if (error || !r) return HERO_DEFAULT;

    const slides: HeroSlide[] = Array.isArray(r.hero_slides)
      ? (r.hero_slides as { url?: unknown; focus?: unknown }[])
          .filter((s) => typeof s?.url === "string" && s.url.length > 0)
          .slice(0, MAX_SLIDES)
          .map((s) => ({ url: s.url as string, focus: FOCUS.includes(s.focus as HeroFocus) ? (s.focus as HeroFocus) : "top" }))
      : [];

    return {
      enabled: r.hero_slides_enabled !== false,
      slides,
      tint: (["light", "medium", "strong"].includes(r.hero_tint ?? "") ? r.hero_tint : "medium") as HeroTint,
      seconds: Math.min(20, Math.max(3, r.hero_slide_seconds ?? 7)),
    };
  } catch {
    return HERO_DEFAULT;
  }
}
