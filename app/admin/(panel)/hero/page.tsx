import PageHeader from "@/components/admin/page-header";
import HeroSlidesForm from "@/components/admin/hero-slides-form";
import { requireAdmin } from "@/lib/admin";
import { getHeroSlides } from "@/lib/hero-slides";

export const metadata = { title: "Hero photos" };

export default async function HeroPhotosPage() {
  const { supabase } = await requireAdmin();
  const check = await supabase.from("site_settings").select("hero_slides").eq("id", 1).maybeSingle();
  const initial = await getHeroSlides();

  return (
    <div>
      <PageHeader
        title="Hero photos"
        description="The moving photos behind the top of the home page. They fade slowly under a see-through burgundy tint."
      />
      {check.error && (
        <p role="alert" className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          These settings aren’t available yet. Run the database update first, then reload this page.
        </p>
      )}
      <HeroSlidesForm initial={initial} />
    </div>
  );
}
