import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Countdown from "@/components/countdown";
import Gallery from "@/components/gallery";
import PriceTag from "@/components/price-tag";
import SizePicker from "@/components/size-picker";
import { getProductBySlug, getSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return {};
  const description = p.description.slice(0, 155) || undefined;
  return {
    title: p.category?.size_type !== "none" && p.variants[0] ? `${p.name} (Size ${p.variants[0].size})` : p.name,
    description,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: {
      title: p.name,
      description,
      images: p.images[0] ? [p.images[0]] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProductBySlug(slug), getSettings()]);
  if (!product) notFound();

  const pricing = product.pricing;
  const inStock = product.variants.some((v) => v.stock > 0);

  // Structured data so Google can show the current price and availability
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    image: product.images.length ? product.images : undefined,
    category: product.category?.name,
    brand: { "@type": "Brand", name: settings.business_name },
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/product/${product.slug}`,
      priceCurrency: "GHS",
      price: (pricing.price / 100).toFixed(2),
      priceValidUntil: pricing.endsAt ?? undefined,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="container-page py-8 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="transition hover:text-foreground">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/shop" className="transition hover:text-foreground">
              Shop
            </Link>
          </li>
          {product.category && (
            <>
              <li aria-hidden="true">/</li>
              <li>
                <Link href={`/shop?category=${product.category.slug}`} className="transition hover:text-foreground">
                  {product.category.name}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-foreground">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <Gallery images={product.images} name={product.name} />

        <div className="lg:sticky lg:top-32 lg:self-start">
          {product.category && <p className="eyebrow">{product.category.name}</p>}
          <h1 className="mt-2 font-display text-4xl font-medium leading-tight sm:text-5xl">{product.name}</h1>

          <div className="mt-4">
            <PriceTag pricing={pricing} size="lg" />
          </div>
          {pricing.onSale && (
            <p className="mt-2 text-sm text-accent">
              {pricing.label}
              {pricing.endsAt && (
                <>
                  {" "}
                  · ends in <Countdown to={pricing.endsAt} className="font-medium tabular-nums" />
                </>
              )}
            </p>
          )}

          <p className="mt-3 flex items-center gap-2 text-sm text-muted">
            <span aria-hidden="true" className={`h-2 w-2 rounded-full ${inStock ? "bg-emerald-600" : "bg-red-500"}`} />
            {inStock ? "In stock" : "Sold out"}
          </p>

          {product.description && (
            <p className="mt-6 whitespace-pre-line text-[15px] leading-7 text-foreground/85">{product.description}</p>
          )}

          <div className="mt-8">
            <SizePicker
              product={{ id: product.id, slug: product.slug, name: product.name, price: pricing.price, image: product.images[0] ?? null }}
              sizeType={product.category?.size_type ?? "none"}
              moreHref={`/shop?category=${product.category?.slug ?? ""}`}
              variants={product.variants}
              whatsapp={settings.whatsapp_number}
            />
          </div>

          <ul className="mt-8 space-y-3 border-t border-border pt-6 text-sm text-muted">
            <li>Pay online with card or Mobile Money, or pay with MoMo directly to us.</li>
            <li>
              We confirm delivery details with you after you order.{" "}
              <Link href="/delivery-returns" className="text-accent underline underline-offset-2">
                Delivery and returns
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
