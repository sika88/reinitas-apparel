import PageHeader from "@/components/admin/page-header";
import ProductForm from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/admin";
import type { SizeType } from "@/lib/types";

export const metadata = { title: "New product" };

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams;
  const { supabase } = await requireAdmin();

  const { data: cats } = await supabase.from("categories").select("id,name,size_type").order("sort_order");

  // "add another size": start from an existing listing's details
  let template = null;
  if (from && /^[0-9a-f-]{36}$/i.test(from)) {
    const { data } = await supabase
      .from("products")
      .select("name,category_id,description,price_pesewas,images,active,featured")
      .eq("id", from)
      .maybeSingle();
    template = data;
  }

  return (
    <div>
      <PageHeader
        title={template ? "Add another size" : "New product"}
        description={
          template
            ? "The details are copied from the other size. Choose the new size and how many you have."
            : "Choose the category and size, add the photos and price, then save."
        }
        back={{ href: "/admin/products", label: "Products" }}
      />
      <ProductForm categories={(cats ?? []) as { id: string; name: string; size_type: SizeType }[]} template={template ?? undefined} />
    </div>
  );
}
