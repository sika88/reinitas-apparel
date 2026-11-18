import PageHeader from "@/components/admin/page-header";
import TickerForm from "@/components/admin/ticker-form";
import { requireAdmin } from "@/lib/admin";
import { defaultTickerItems, type TickerSpeed, type TickerStyle } from "@/lib/ticker-shared";

export const metadata = { title: "Scrolling banner" };

export default async function BannerPage() {
  const { supabase } = await requireAdmin();
  const [{ data, error }, { data: cats }] = await Promise.all([
    supabase.from("site_settings").select("ticker_enabled,ticker_items,ticker_style,ticker_speed").eq("id", 1).maybeSingle(),
    supabase.from("categories").select("name").order("sort_order"),
  ]);

  const items = (data?.ticker_items as string[] | null) ?? [];

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Scrolling banner"
        description="The moving text under the home page header. Change it when you run a sale, for example “SALE, SALE, SALE”."
      />
      {error && (
        <p role="alert" className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          The banner settings aren’t available yet. Run the database update first, then reload this page.
        </p>
      )}
      <TickerForm
        initial={{
          enabled: data?.ticker_enabled !== false,
          text: items.join("\n"),
          style: (data?.ticker_style === "sale" ? "sale" : "classic") as TickerStyle,
          speed: (data?.ticker_speed === "slow" || data?.ticker_speed === "fast" ? data.ticker_speed : "normal") as TickerSpeed,
        }}
        defaultItems={defaultTickerItems((cats ?? []).map((c) => c.name as string))}
      />
    </div>
  );
}
