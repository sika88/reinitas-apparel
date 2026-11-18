import type { TickerSpeed, TickerStyle } from "@/lib/ticker-shared";

const PX_PER_SECOND: Record<TickerSpeed, number> = { slow: 45, normal: 70, fast: 105 };

// The scrolling bar. Also used for the live preview in the admin.
export default function TickerView({
  items,
  style,
  speed,
  className = "",
}: {
  items: string[];
  style: TickerStyle;
  speed: TickerSpeed;
  className?: string;
}) {
  if (items.length === 0) return null;
  const sale = style === "sale";

  // repeat the phrases until one row is wider than a big screen, then keep the same speed whatever the length
  const unit = (s: string) => s.length * (sale ? 14 : 11) + 90;
  const baseWidth = items.reduce((n, s) => n + unit(s), 0);
  const repeats = Math.min(30, Math.max(1, Math.ceil(2000 / baseWidth)));
  const row = Array.from({ length: repeats }).flatMap(() => items);
  const seconds = Math.min(240, Math.max(16, (baseWidth * repeats) / PX_PER_SECOND[speed]));
  const track = [...row, ...row];

  return (
    <div
      className={`marquee border-y py-3.5 ${
        sale ? "border-gold bg-gold text-accent-dark" : "border-accent-dark bg-accent-dark text-gold"
      } ${className}`}
    >
      <p className="sr-only">{items.join(". ")}</p>
      <div aria-hidden="true" className="marquee-track" style={{ animationDuration: `${seconds}s` }}>
        {track.map((t, i) => (
          <span
            key={i}
            className={`flex items-center whitespace-nowrap ${
              sale ? "text-sm font-semibold uppercase tracking-[0.22em]" : "font-display text-xl italic"
            }`}
          >
            <span className="px-8">{t}</span>
            <span className={`text-xs not-italic ${sale ? "text-accent-dark/60" : "text-gold/60"}`}>◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}
