import PageHeader from "@/components/admin/page-header";
import PromoForm from "@/components/admin/promo-form";
import { requireAdmin } from "@/lib/admin";
import { PROMO_DEFAULT, type PromoConfig } from "@/lib/promo-shared";

export const metadata = { title: "Promo image" };

export default async function PromoPage() {
  const { supabase } = await requireAdmin();
  const [{ data, error }, { data: cats }] = await Promise.all([
    supabase
      .from("site_settings")
      .select("promo_enabled,promo_url,promo_alt,promo_link,promo_animation,promo_frame")
      .eq("id", 1)
      .maybeSingle(),
    supabase.from("categories").select("name,slug").order("sort_order"),
  ]);

  const initial: PromoConfig = data
    ? {
        enabled: data.promo_enabled !== false,
        url: data.promo_url || null,
        alt: data.promo_alt ?? "",
        link: data.promo_link ?? "",
        animation: data.promo_animation === "float" || data.promo_animation === "none" ? data.promo_animation : "swing",
        frame: data.promo_frame !== false,
      }
    : PROMO_DEFAULT;

  return (
    <div>
      <PageHeader
        title="Promo image"
        description="The picture that hangs and swings on the right of the home page. Change it when you run a promo, a discount or a sale."
      />
      {error && (
        <p role="alert" className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          These settings aren’t available yet. Run the database update first, then reload this page.
        </p>
      )}
      <PromoForm initial={initial} categories={(cats ?? []) as { name: string; slug: string }[]} />
    </div>
  );
}
