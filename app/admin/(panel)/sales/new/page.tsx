import PageHeader from "@/components/admin/page-header";
import SaleForm from "@/components/admin/sale-form";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "New sale" };

export default async function NewSalePage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("categories").select("id,name").order("sort_order");

  return (
    <div>
      <PageHeader title="New sale" description="Choose the discount, what it covers, and when it runs." back={{ href: "/admin/sales", label: "Sales" }} />
      <SaleForm categories={(data ?? []) as { id: string; name: string }[]} />
    </div>
  );
}
