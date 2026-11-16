import { notFound } from "next/navigation";
import PageHeader from "@/components/admin/page-header";
import SaleForm, { type SaleData } from "@/components/admin/sale-form";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Edit sale" };

export default async function EditSalePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { supabase } = await requireAdmin();
  const [{ data: sale }, { data: cats }] = await Promise.all([
    supabase
      .from("sales")
      .select("id,name,percent_off,scope,category_ids,starts_at,ends_at,enabled,banner_text")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("categories").select("id,name").order("sort_order"),
  ]);
  if (!sale) notFound();

  return (
    <div>
      <PageHeader title="Edit sale" back={{ href: "/admin/sales", label: "Sales" }} />
      <SaleForm categories={(cats ?? []) as { id: string; name: string }[]} sale={sale as SaleData} />
    </div>
  );
}
