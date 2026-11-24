import Image from "next/image";
import { MAX_SLIDES, type HeroSlide, type HeroTint } from "@/lib/hero-shared";

// Burgundy, see-through. Stronger tints keep the text easier to read.
const TINT: Record<HeroTint, string> = {
  light: "from-accent/60 via-accent/50 to-accent-dark/65",
  medium: "from-accent/78 via-accent/68 to-accent-dark/80",
  strong: "from-accent/90 via-accent/84 to-accent-dark/92",
};
const FOCUS = { top: "object-top", center: "object-center", bottom: "object-bottom" } as const;
const FADE: Record<number, number> = { 2: 0.08, 3: 0.06, 4: 0.05 }; // fraction of a full cycle spent crossfading

export default function HeroSlidesView({
  slides,
  tint,
  seconds,
  priority = false,
}: {
  slides: HeroSlide[];
  tint: HeroTint;
  seconds: number;
  priority?: boolean;
}) {
  const list = slides.slice(0, MAX_SLIDES);
  const n = list.length;
  if (n === 0) return null;

  const cycle = n * seconds;
  const fade = FADE[n] ?? 0;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[-5] overflow-hidden">
      {list.map((s, i) => (
        <div
          key={s.url}
          className={`hero-slide absolute inset-0 ${n > 1 ? `hero-fade-${n}` : ""}`}
          style={
            n > 1
              ? { animationDuration: `${cycle}s`, animationDelay: `${(i * seconds - fade * cycle).toFixed(2)}s` }
              : undefined
          }
        >
          <Image
            src={s.url}
            alt=""
            fill
            sizes="100vw"
            quality={70}
            priority={priority && i === 0}
            className={`hero-zoom object-cover ${FOCUS[s.focus]}`}
          />
        </div>
      ))}
      <div className={`absolute inset-0 bg-linear-to-br ${TINT[tint]}`} />
      <div className="hero-glow absolute inset-0" />
    </div>
  );
}
