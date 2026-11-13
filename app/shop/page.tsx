import Link from "next/link";
import ProductCard from "@/components/product-card";
import { getCategories, getProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Shop({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({ categorySlug: category }),
  ]);
  const active = categories.find((c) => c.slug === category);

  const pill = (isActive: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm transition ${
      isActive ? "border-accent bg-accent text-white" : "border-border bg-surface hover:border-accent"
    }`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl">{active?.name ?? "All products"}</h1>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link href="/shop" className={pill(!active)}>
          All
        </Link>
        {categories.map((c) => (
          <Link key={c.id} href={`/shop?category=${c.slug}`} className={pill(c.slug === category)}>
            {c.name}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="mt-10 text-sm text-muted">Nothing here yet. Check back soon.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
