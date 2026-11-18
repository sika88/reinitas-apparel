import TickerView from "@/components/ticker-view";
import { getTicker } from "@/lib/ticker";
import { defaultTickerItems } from "@/lib/ticker-shared";
import type { Category } from "@/lib/types";

export default async function Ticker({ categories }: { categories: Category[] }) {
  const t = await getTicker();
  if (!t.enabled) return null;
  const items = t.items.length ? t.items : defaultTickerItems(categories.map((c) => c.name));
  return <TickerView items={items} style={t.style} speed={t.speed} />;
}
