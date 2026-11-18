export type TickerStyle = "classic" | "sale";
export type TickerSpeed = "slow" | "normal" | "fast";
export type TickerConfig = { enabled: boolean; items: string[]; style: TickerStyle; speed: TickerSpeed };

export const TICKER_DEFAULT: TickerConfig = { enabled: true, items: [], style: "classic", speed: "normal" };

// What scrolls when the admin hasn't written anything
export function defaultTickerItems(categoryNames: string[]) {
  return ["New season", ...categoryNames, "Sized for you", "Pay online or with MoMo"];
}

// One phrase per line, at most 20 phrases of 60 characters
export function parseTickerText(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 20)
    .map((l) => l.slice(0, 60));
}
