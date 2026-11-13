import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/components/product-card";
import { getCategories, getProducts, getSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [settings, categories, latest] = await Promise.all([
    getSettings(),
    getCategories(),
    getProducts({ limit: 8 }),
  ]);
  const hasHero = Boolean(settings.hero_image_url);

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        {hasHero ? (
          <>
            <Image src={settings.hero_image_url!} alt="" fill priority sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-black/40" />
          </>
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-accent/15 via-background to-accent/5" />
        )}
        <div className={`relative mx-auto max-w-6xl px-4 py-24 sm:py-32 ${hasHero ? "text-white" : ""}`}>
          <p className="text-xs uppercase tracking-[0.25em] opacity-80">New season</p>
          <h1 className="mt-3 max-w-xl font-display text-4xl leading-tight sm:text-6xl">
            {settings.tagline || "Dresses, shoes and bags made to turn heads."}
          </h1>
          <Link
            href="/shop"
            className="mt-8 inline-block rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            Shop the collection
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-3">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/shop?category=${c.slug}`}
              className="group flex h-32 items-end rounded-xl border border-border bg-surface p-5 transition hover:border-accent"
            >
              <span className="font-display text-2xl transition group-hover:text-accent">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4">
        <h2 className="mb-6 font-display text-2xl">New arrivals</h2>
        {latest.length === 0 ? (
          <p className="text-sm text-muted">No products yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
            {latest.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
