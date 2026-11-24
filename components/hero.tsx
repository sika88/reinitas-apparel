import HeroSlides from "@/components/hero-slides";
import Image from "next/image";
import Link from "next/link";
import HeroArt from "@/components/hero-art";
import HeroPromo from "@/components/hero-promo";
import { waLink } from "@/lib/format";
import { getPromo } from "@/lib/promo";
import type { Category, Product, SiteSettings } from "@/lib/types";

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

const slides = ["/hero/1.jpg", "/hero/2.jpg", "/hero/3.jpg", "/hero/4.jpg"];
export default async function Hero({
  settings,
  categories,
  products,
}: {
  settings: SiteSettings;
  categories: Category[];
  products: Product[];
}) {
  const promo = await getPromo();
  const hasHero = Boolean(settings.hero_image_url);
  const showPromo = promo.enabled;
  const showArt = !showPromo && !hasHero;

  return (
    <section className="relative isolate overflow-hidden bg-accent text-cream">
      <HeroSlides />
      <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
        {slides.map((src, i) => (
          <div key={src} className="hero-slide absolute inset-0" style={{ "--i": i } as React.CSSProperties}>
            <Image src={src} alt="" fill priority={i === 0} sizes="100vw" quality={70} className="object-cover" />
          </div>
        ))}
        {/* translucent burgundy tint so the photos show through */}
        <div className="absolute inset-0 bg-linear-to-r from-accent/85 via-accent/60 to-accent/35" />
      </div>

      <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
        <span className="orb orb-gold" />
        <span className="orb orb-rose" />
      </div>

      <div
        className={`container-page grid items-center gap-10 py-16 sm:py-24 lg:py-28 ${
          showPromo || showArt ? "md:grid-cols-[1.05fr_0.95fr]" : ""
        }`}
      >
        <div className="glass rounded-3xl p-6 sm:p-10">
          <p className="fade-up flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-gold" style={delay(0)}>
            <span aria-hidden="true" className="line-grow inline-block h-px w-10 bg-gold" style={delay(200)} />
            New season
          </p>
          <h1
            className="fade-up mt-4 max-w-2xl font-display text-5xl font-medium leading-[1.05] lg:text-6xl xl:text-7xl"
            style={delay(120)}
          >
            {settings.tagline || "Dresses, shoes and bags made to turn heads."}
          </h1>
          <p className="fade-up mt-6 max-w-lg text-base text-cream/85" style={delay(260)}>
            Shop ladies dresses, shoes and bags online in Ghana. Browse by size, pay online or with MoMo, and chat with us on WhatsApp whenever you need a hand.
          </p>
          <div className="fade-up mt-9 flex flex-wrap gap-3" style={delay(400)}>
            <Link href="/shop" className="btn-light btn-shine">
              Shop the collection
            </Link>
            {settings.whatsapp_number && (
              <a
                href={waLink(settings.whatsapp_number, "Hello! I'd like to ask about your products.")}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost-light"
              >
                Chat on WhatsApp<span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
          </div>
        </div>

        {showPromo && (
          <div className="pop-in" style={delay(500)}>
            <HeroPromo promo={promo} priority />
          </div>
        )}
        {showArt && <HeroArt products={products} categories={categories} />}
      </div>
    </section>
  );
}