import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import SizePicker from "@/components/size-picker";
import { formatPrice } from "@/lib/format";
import { getProductBySlug, getSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  return p ? { title: p.name, description: p.description.slice(0, 155) } : {};
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProductBySlug(slug), getSettings()]);
  if (!product) notFound();

  const [mainImage, ...otherImages] = product.images;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/shop" className="text-sm text-muted transition hover:text-foreground">
        ← Back to shop
      </Link>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div className="space-y-3">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-surface">
            {mainImage ? (
              <Image
                src={mainImage}
                alt={product.name}
                fill
                priority
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center font-display text-8xl text-accent/30">
                {product.name.charAt(0)}
              </div>
            )}
          </div>
          {otherImages.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {otherImages.map((src) => (
                <div key={src} className="relative aspect-square overflow-hidden rounded-lg border border-border">
                  <Image src={src} alt="" fill sizes="15vw" className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.category && (
            <p className="text-xs uppercase tracking-[0.2em] text-muted">{product.category.name}</p>
          )}
          <h1 className="mt-2 font-display text-3xl sm:text-4xl">{product.name}</h1>
          <p className="mt-3 text-xl">{formatPrice(product.price_pesewas)}</p>
          <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-muted">{product.description}</p>

          <div className="mt-8">
            <SizePicker
              product={{ id: product.id, slug: product.slug, name: product.name, price: product.price_pesewas, image: product.images[0] ?? null }}
              sizeType={product.category?.size_type ?? "none"}
              variants={product.variants}
              whatsapp={settings.whatsapp_number}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
