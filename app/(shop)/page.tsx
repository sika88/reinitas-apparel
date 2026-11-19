import Ticker from "@/components/ticker";
import Hero from "@/components/hero";
import Image from "next/image";
import Link from "next/link";
import OnSaleSection from "@/components/on-sale-section";
import ProductCard from "@/components/product-card";
import Reveal from "@/components/reveal";
import { waLink } from "@/lib/format";
import { getCategories, getCategoryImages, getProducts, getSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = { alternates: { canonical: "/" } };

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
    title: "Shop by size",
    text: "Filter by your size and see only what fits, before you order.",
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

  const categoryImages = await getCategoryImages(categories);
  const hasHero = Boolean(settings.hero_image_url);
  const featured = products.filter((p) => p.featured).slice(0, 4);
  const arrivals = products.slice(0, 8);
  const imageFor = (slug: string) => categoryImages[slug];


  return (
    <>
      <Hero settings={settings} categories={categories} products={products} />

      <Ticker categories={categories} />

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

      <OnSaleSection />

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
