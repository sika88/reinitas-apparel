import { notFound } from "next/navigation";
import DiscountCard from "@/components/admin/discount-card";
import PageHeader from "@/components/admin/page-header";
import ProductForm, { type ProductData } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/admin";
import type { SizeType } from "@/lib/types";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { supabase } = await requireAdmin();
  const [{ data: product }, { data: cats }] = await Promise.all([
    supabase
      .from("products")
      .select("id,name,category_id,description,price_pesewas,images,active,featured,discount_percent,variants:product_variants(size,stock)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("categories").select("id,name,size_type").order("sort_order"),
  ]);
  if (!product) notFound();

  const variants = (product.variants ?? []) as { size: string; stock: number }[];

  return (
    <div>
      <PageHeader title="Edit product" back={{ href: "/admin/products", label: "Products" }} />

      {variants.length > 1 ? (
        <p className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
          This product still has several sizes in one listing ({variants.map((v) => v.size).join(", ")}). Run the size-split SQL from the update
          instructions, then reload this page. After that, each size is its own listing.
        </p>
      ) : (
        <>
          <DiscountCard productId={product.id} price={product.price_pesewas} discount={product.discount_percent ?? null} />
          <ProductForm
            categories={(cats ?? []) as { id: string; name: string; size_type: SizeType }[]}
            product={product as unknown as ProductData}
          />
        </>
      )}
    </div>
  );
}
