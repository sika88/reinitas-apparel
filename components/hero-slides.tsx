import HeroSlidesView from "@/components/hero-slides-view";
import { getHeroSlides } from "@/lib/hero-slides";

// Placed inside the hero section. Renders nothing when there are no photos or it is switched off.
export default async function HeroSlides() {
  const c = await getHeroSlides();
  if (!c.enabled || c.slides.length === 0) return null;
  return <HeroSlidesView slides={c.slides} tint={c.tint} seconds={c.seconds} priority />;
}
