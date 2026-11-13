import ProductForm from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/admin";
import type { SizeType } from "@/lib/types";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("categories").select("id,name,size_type").order("sort_order");
  const categories = (data ?? []) as { id: string; name: string; size_type: SizeType }[];

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 font-display text-3xl">New product</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
