import { notFound } from "next/navigation";
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
      .select("id,name,category_id,description,price_pesewas,images,active,featured,variants:product_variants(size,stock)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("categories").select("id,name,size_type").order("sort_order"),
  ]);
  if (!product) notFound();

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 font-display text-3xl">Edit product</h1>
      <ProductForm
        categories={(cats ?? []) as { id: string; name: string; size_type: SizeType }[]}
        product={product as unknown as ProductData}
      />
    </div>
  );
}
