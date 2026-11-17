import Image from "next/image";
import Link from "next/link";
import HeroArt from "@/components/hero-art";
import { waLink } from "@/lib/format";
import type { Category, Product, SiteSettings } from "@/lib/types";

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

export default function Hero({
  settings,
  categories,
  products,
}: {
  settings: SiteSettings;
  categories: Category[];
  products: Product[];
}) {
  const hasHero = Boolean(settings.hero_image_url);

  return (
    <section className="relative isolate overflow-hidden bg-accent text-cream">
      {hasHero ? (
        <>
          <Image src={settings.hero_image_url!} alt="" fill priority sizes="100vw" className="kenburns -z-10 object-cover" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-r from-accent/95 via-accent/65 to-accent/20" />
        </>
      ) : (
        <div aria-hidden="true" className="hero-glow absolute inset-0 -z-10" />
      )}

      <div className={`container-page grid items-center gap-10 py-16 sm:py-24 lg:py-28 ${hasHero ? "" : "md:grid-cols-[1.05fr_0.95fr]"}`}>
        <div>
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
            Browse by size, pay online or with MoMo, and chat with us on WhatsApp whenever you need a hand.
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

        {!hasHero && <HeroArt products={products} categories={categories} />}
      </div>
    </section>
  );
}
