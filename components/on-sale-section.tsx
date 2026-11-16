import Link from "next/link";
import ProductCard from "@/components/product-card";
import Reveal from "@/components/reveal";
import { getProducts } from "@/lib/queries";

export default async function OnSaleSection() {
  const products = (await getProducts({ limit: 48 })).filter((p) => p.pricing.onSale).slice(0, 4);
  if (products.length === 0) return null;

  return (
    <section className="container-page pt-20">
      <Reveal>
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Limited time</p>
            <h2 className="mt-2 font-display text-4xl font-medium">On sale now</h2>
          </div>
          <Link href="/shop?sale=1" className="text-sm text-accent underline underline-offset-4">
            See all deals
          </Link>
        </div>
      </Reveal>
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
        {products.map((p, i) => (
          <Reveal key={p.id} delay={i * 90}>
            <ProductCard product={p} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
