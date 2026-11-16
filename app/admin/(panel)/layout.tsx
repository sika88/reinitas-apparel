import AdminShell from "@/components/admin/admin-shell";
import { ToastProvider } from "@/components/admin/toast";
import { requireAdmin } from "@/lib/admin";
import { getSettings } from "@/lib/queries";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { supabase } = await requireAdmin();

  const [settings, attention] = await Promise.all([
    getSettings(),
    // paid orders to process + MoMo orders waiting for you to confirm the money
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .or("status.eq.paid,and(status.eq.pending,payment_method.in.(momo,pay_on_delivery))"),
  ]);

  return (
    <ToastProvider>
      <AdminShell businessName={settings.business_name} logoUrl={settings.logo_url} attention={attention.count ?? 0}>
        {children}
      </AdminShell>
    </ToastProvider>
  );
}
