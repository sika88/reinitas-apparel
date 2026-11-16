import PageHeader from "@/components/admin/page-header";
import SettingsForm from "@/components/admin/settings-form";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { supabase } = await requireAdmin();
  const [{ data: site }, { data: priv }] = await Promise.all([
    supabase
      .from("site_settings")
      .select("business_name,tagline,whatsapp_number,logo_url,hero_image_url,momo_number,momo_name,momo_network")
      .eq("id", 1)
      .maybeSingle(),
    supabase.from("private_settings").select("admin_phone").eq("id", 1).maybeSingle(),
  ]);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" description="Your logo, MoMo details and contact numbers. Changes show on the shop straight away." />
      <SettingsForm
        initial={{
          business_name: site?.business_name ?? "Reinita's Apparel",
          tagline: site?.tagline ?? "",
          whatsapp_number: site?.whatsapp_number ?? "",
          logo_url: site?.logo_url ?? null,
          hero_image_url: site?.hero_image_url ?? null,
          momo_number: site?.momo_number ?? "",
          momo_name: site?.momo_name ?? "",
          momo_network: site?.momo_network ?? "MTN MoMo",
          admin_phone: priv?.admin_phone ?? "",
        }}
      />
    </div>
  );
}
