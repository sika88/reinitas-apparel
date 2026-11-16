import PageHeader from "@/components/admin/page-header";
import ProductForm from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/admin";
import type { SizeType } from "@/lib/types";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("categories").select("id,name,size_type").order("sort_order");
  const categories = (data ?? []) as { id: string; name: string; size_type: SizeType }[];

  return (
    <div>
      <PageHeader title="New product" description="Add the photos, sizes and stock, then save." back={{ href: "/admin/products", label: "Products" }} />
      <ProductForm categories={categories} />
    </div>
  );
}
