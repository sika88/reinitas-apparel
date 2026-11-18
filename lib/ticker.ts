import { publicClient } from "./supabase/public";
import { TICKER_DEFAULT, type TickerConfig } from "./ticker-shared";

type Row = { ticker_enabled: boolean | null; ticker_items: string[] | null; ticker_style: string | null; ticker_speed: string | null };

// Never breaks the page: if anything goes wrong the standard banner is shown
export async function getTicker(): Promise<TickerConfig> {
  try {
    const { data } = await publicClient()
      .from("site_settings")
      .select("ticker_enabled,ticker_items,ticker_style,ticker_speed")
      .eq("id", 1)
      .maybeSingle();
    const r = data as Row | null;
    if (!r) return TICKER_DEFAULT;
    return {
      enabled: r.ticker_enabled !== false,
      items: Array.isArray(r.ticker_items) ? r.ticker_items.filter((s) => typeof s === "string" && s.trim()) : [],
      style: r.ticker_style === "sale" ? "sale" : "classic",
      speed: r.ticker_speed === "slow" || r.ticker_speed === "fast" ? r.ticker_speed : "normal",
    };
  } catch {
    return TICKER_DEFAULT;
  }
}
