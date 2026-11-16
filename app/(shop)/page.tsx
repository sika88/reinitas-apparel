import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/components/product-card";
import Reveal from "@/components/reveal";
import { waLink } from "@/lib/format";
import { getCategories, getProducts, getSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
      {children}
    </svg>
  );
}

const perks = [
  {
    title: "Pay your way",
    text: "Card or Mobile Money online, or send a MoMo payment straight to us.",
    icon: (
      <Icon>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M3 10h18" />
      </Icon>
    ),
  },
  {
    title: "See every size",
    text: "Stock is shown size by size, so you know what you can get before you order.",
    icon: (
      <Icon>
        <path d="M4 8h16v8H4z" />
        <path d="M8 8v3M12 8v4M16 8v3" />
      </Icon>
    ),
  },
  {
    title: "Talk to a person",
    text: "Questions about a product or your order? Message us on WhatsApp.",
    icon: (
      <Icon>
        <path d="M5 6h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-7l-4 3v-3H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z" />
      </Icon>
    ),
  },
];

function SectionHeading({ eyebrow, title, href, linkLabel }: { eyebrow: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <Reveal>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="mt-2 font-display text-4xl font-medium">{title}</h2>
        </div>
        {href && (
          <Link href={href} className="text-sm text-accent underline underline-offset-4">
            {linkLabel}
          </Link>
        )}
      </div>
    </Reveal>
  );
}

export default async function Home() {
  const [settings, categories, products] = await Promise.all([getSettings(), getCategories(), getProducts({ limit: 24 })]);

  const hasHero = Boolean(settings.hero_image_url);
  const featured = products.filter((p) => p.featured).slice(0, 4);
  const arrivals = products.slice(0, 8);
  const imageFor = (slug: string) => products.find((p) => p.category?.slug === slug && p.images[0])?.images[0];

  const ticker = ["New season", ...categories.map((c) => c.name), "Sized for you", "Pay online or with MoMo"];
  const half = [...ticker, ...ticker];

  return (
    <>
      <section className="relative isolate overflow-hidden bg-accent text-cream">
        {hasHero ? (
          <>
            <Image src={settings.hero_image_url!} alt="" fill priority sizes="100vw" className="kenburns -z-10 object-cover" />
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-r from-accent/95 via-accent/65 to-accent/20" />
          </>
        ) : (
          <>
            <div aria-hidden="true" className="hero-glow absolute inset-0 -z-10" />
            <div
              aria-hidden="true"
              className="ring-float absolute -right-32 top-1/2 -z-10 hidden h-[30rem] w-[30rem] -translate-y-1/2 rounded-full border border-gold/30 md:block"
            />
            <div
              aria-hidden="true"
              className="ring-float absolute -right-14 top-1/2 -z-10 hidden h-[22rem] w-[22rem] -translate-y-1/2 rounded-full border border-gold/20 md:block"
            />
          </>
        )}

        <div className="container-page py-20 sm:py-28 lg:py-40">
          <p className="fade-up text-xs uppercase tracking-[0.28em] text-gold" style={delay(0)}>
            New season
          </p>
          <h1 className="fade-up mt-4 max-w-2xl font-display text-5xl font-medium leading-[1.05] sm:text-7xl" style={delay(120)}>
            {settings.tagline || "Dresses, shoes and bags made to turn heads."}
          </h1>
          <p className="fade-up mt-6 max-w-lg text-base text-cream/85" style={delay(260)}>
            Browse by size, pay online or with MoMo, and chat with us on WhatsApp whenever you need a hand.
          </p>
          <div className="fade-up mt-9 flex flex-wrap gap-3" style={delay(400)}>
            <Link href="/shop" className="btn-light">
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
      </section>

      <div aria-hidden="true" className="marquee border-y border-accent-dark bg-accent-dark py-3.5 text-gold">
        <div className="marquee-track">
          {[...half, ...half].map((t, i) => (
            <span key={i} className="flex items-center whitespace-nowrap font-display text-xl italic">
              <span className="px-8">{t}</span>
              <span className="text-xs not-italic text-gold/60">◆</span>
            </span>
          ))}
        </div>
      </div>

      <section aria-label="Why shop with us" className="border-b border-border bg-cream">
        <ul className="container-page grid gap-6 py-8 sm:grid-cols-3">
          {perks.map((p, i) => (
            <li key={p.title}>
              <Reveal delay={i * 110} className="flex gap-4">
                <span className="mt-0.5 text-accent">{p.icon}</span>
                <span>
                  <span className="block font-medium">{p.title}</span>
                  <span className="mt-0.5 block text-sm text-muted">{p.text}</span>
                </span>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-page pt-16">
        <SectionHeading eyebrow="Browse" title="Shop by category" />
        <ul className="grid gap-4 sm:grid-cols-3">
          {categories.map((c, i) => {
            const img = imageFor(c.slug);
            return (
              <li key={c.id}>
                <Reveal delay={i * 110}>
                  <Link href={`/shop?category=${c.slug}`} className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-accent">
                    {img && (
                      <Image
                        src={img}
                        alt=""
                        fill
                        sizes="(min-width: 640px) 33vw, 100vw"
                        className="object-cover transition duration-700 group-hover:scale-105"
                      />
                    )}
                    <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-accent-dark/85 via-accent-dark/20 to-transparent" />
                    <span className="absolute inset-x-5 bottom-4 flex items-end justify-between text-cream">
                      <span className="font-display text-3xl font-medium">{c.name}</span>
                      <span aria-hidden="true" className="text-xl transition group-hover:translate-x-1.5">
                        →
                      </span>
                    </span>
                  </Link>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </section>

      {featured.length > 0 && (
        <section className="container-page pt-20">
          <SectionHeading eyebrow="Hand-picked" title="Featured pieces" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
            {featured.map((p, i) => (
              <Reveal key={p.id} delay={i * 90}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section className="container-page pt-20">
        <SectionHeading eyebrow="Just in" title="New arrivals" href="/shop" linkLabel="View everything" />
        {arrivals.length === 0 ? (
          <p className="text-sm text-muted">New pieces are on their way. Check back soon.</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
            {arrivals.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 90}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {settings.whatsapp_number && (
        <section className="container-page pt-20">
          <Reveal>
            <div className="rounded-3xl bg-cream px-6 py-12 text-center sm:px-12">
              <h2 className="font-display text-4xl font-medium">Not sure about your size?</h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-muted">Message us on WhatsApp and we will help you choose the right fit.</p>
              <a
                href={waLink(settings.whatsapp_number, "Hello! Can you help me choose a size?")}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary mt-6"
              >
                Message us<span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
          </Reveal>
        </section>
      )}
    </>
  );
}
