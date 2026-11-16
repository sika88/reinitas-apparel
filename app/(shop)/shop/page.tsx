import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/product-card";
import { getCategories, getProducts } from "@/lib/queries";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

const SORTS = [
  { key: "newest", label: "Newest" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
] as const;
type SortKey = (typeof SORTS)[number]["key"];
type Search = { category?: string; sort?: string; sale?: string };

export async function generateMetadata({ searchParams }: { searchParams: Promise<Search> }): Promise<Metadata> {
  const { category, sale } = await searchParams;
  const active = (await getCategories()).find((c) => c.slug === category);
  return {
    title: sale === "1" ? "On sale" : active ? active.name : "Shop",
    alternates: { canonical: active ? `/shop?category=${active.slug}` : "/shop" },
  };
}

function sortProducts(list: Product[], sort: SortKey) {
  const inStock = (p: Product) => p.variants.some((v) => v.stock > 0);
  const sorted = [...list];
  if (sort === "price-asc") sorted.sort((a, b) => a.pricing.price - b.pricing.price);
  if (sort === "price-desc") sorted.sort((a, b) => b.pricing.price - a.pricing.price);
  return [...sorted.filter(inStock), ...sorted.filter((p) => !inStock(p))]; // sold out goes last
}

export default async function Shop({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const sort: SortKey = SORTS.find((s) => s.key === sp.sort)?.key ?? "newest";
  const onlySale = sp.sale === "1";

  const [categories, all] = await Promise.all([getCategories(), getProducts({ categorySlug: sp.category })]);
  const active = categories.find((c) => c.slug === sp.category);
  const anySale = all.some((p) => p.pricing.onSale);
  const list = sortProducts(onlySale ? all.filter((p) => p.pricing.onSale) : all, sort);

  const build = (category: string | undefined, s: SortKey, sale: boolean) => {
    const q = new URLSearchParams();
    if (category) q.set("category", category);
    if (s !== "newest") q.set("sort", s);
    if (sale) q.set("sale", "1");
    const str = q.toString();
    return str ? `/shop?${str}` : "/shop";
  };

  const pill = (isActive: boolean) =>
    `inline-flex min-h-10 items-center rounded-full border px-5 text-sm transition ${
      isActive ? "border-accent bg-accent text-white" : "border-border bg-surface hover:border-accent"
    }`;

  return (
    <div className="container-page py-10 sm:py-14">
      <p className="eyebrow">Shop</p>
      <h1 className="mt-2 font-display text-5xl font-medium">
        {onlySale ? "On sale" : (active?.name ?? "All products")}
      </h1>

      <div className="mt-8 flex flex-col gap-5 border-b border-border pb-6 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Categories">
          <ul className="flex flex-wrap gap-2">
            <li>
              <Link href={build(undefined, sort, onlySale)} aria-current={!active ? "page" : undefined} className={pill(!active)}>
                All
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={build(c.slug, sort, onlySale)}
                  aria-current={c.slug === sp.category ? "page" : undefined}
                  className={pill(c.slug === sp.category)}
                >
                  {c.name}
                </Link>
              </li>
            ))}
            {(anySale || onlySale) && (
              <li>
                <Link
                  href={build(sp.category, sort, !onlySale)}
                  aria-pressed={onlySale}
                  className={`${pill(onlySale)} ${onlySale ? "" : "border-accent/50 text-accent"}`}
                >
                  On sale
                </Link>
              </li>
            )}
          </ul>
        </nav>

        <nav aria-label="Sort" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <span className="text-muted">Sort by</span>
          {SORTS.map((s) => (
            <Link
              key={s.key}
              href={build(sp.category, s.key, onlySale)}
              aria-current={s.key === sort ? "true" : undefined}
              className={s.key === sort ? "font-medium text-accent underline underline-offset-4" : "text-foreground/70 hover:text-accent"}
            >
              {s.label}
            </Link>
          ))}
        </nav>
      </div>

      <p aria-live="polite" className="mt-5 text-sm text-muted">
        {list.length} {list.length === 1 ? "piece" : "pieces"}
      </p>

      {list.length === 0 ? (
        <p className="mt-10 text-sm text-muted">
          {onlySale ? "No items are on sale right now. Check back soon." : "Nothing here yet. Check back soon."}
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
