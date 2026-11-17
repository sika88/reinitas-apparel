import Image from "next/image";
import Link from "next/link";
import HeroStage from "@/components/hero-stage";
import { formatPrice } from "@/lib/format";
import type { Category, Product } from "@/lib/types";

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;
const depth = (n: number) => ({ "--px": n }) as React.CSSProperties;

const CARD_SLOTS = [
  { pos: "left-[1%] top-[5%] w-[31%]", depth: 24, float: "float-a", d: 1000 },
  { pos: "right-0 top-[33%] w-[33%]", depth: -18, float: "float-b", d: 1300 },
  { pos: "bottom-0 left-[9%] w-[29%]", depth: 30, float: "float-c", d: 1600 },
];

const CHIP_SLOTS = [
  { pos: "left-0 top-[14%]", depth: 22, float: "float-a", d: 1000 },
  { pos: "right-0 top-[44%]", depth: -18, float: "float-b", d: 1300 },
  { pos: "bottom-[8%] left-[8%]", depth: 28, float: "float-c", d: 1600 },
];

const SPARKS = [
  { cls: "left-[48%] top-[1%] text-base", d: 0 },
  { cls: "right-[9%] top-[13%] text-sm", d: 900 },
  { cls: "right-[2%] bottom-[20%] text-lg", d: 1700 },
  { cls: "left-[1%] top-[52%] text-xs", d: 600 },
  { cls: "left-[54%] bottom-[1%] text-sm", d: 2300 },
];

export default function HeroArt({ products, categories }: { products: Product[]; categories: Category[] }) {
  const showcase = products.filter((p) => p.images[0] && p.variants.some((v) => v.stock > 0)).slice(0, 3);
  const chips = categories.slice(0, 3);

  return (
    <HeroStage className="relative mx-auto hidden aspect-square w-full max-w-[34rem] md:block">
      {/* slow rings and glow */}
      <div aria-hidden="true" className="parallax pointer-events-none absolute inset-0" style={depth(6)}>
        <div className="spin-cw absolute inset-[3%] rounded-full border border-gold/35" />
        <div className="spin-ccw absolute inset-[13%] rounded-full border border-dashed border-gold/25" />
        <div className="glow-pulse absolute inset-[24%] rounded-full bg-gold/15 blur-3xl" />
      </div>

      {/* the brand mark draws itself, then the hanger swings */}
      <div aria-hidden="true" className="parallax pointer-events-none absolute inset-[19%] z-10 text-cream" style={depth(-10)}>
        <div className="pop-in h-full w-full" style={delay(100)}>
          <svg
            viewBox="0 0 200 200"
            className="h-full w-full"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle pathLength={1} className="draw" style={delay(0)} cx="100" cy="100" r="92" />
            <g className="swing">
              <path pathLength={1} className="draw" style={delay(600)} d="M100 78V70C100 63 106 59 111 59C116 59 119 63 119 67" />
              <path pathLength={1} className="draw" style={delay(1000)} d="M100 78L50 110H150Z" />
            </g>
            <text
              x="100"
              y="158"
              textAnchor="middle"
              stroke="none"
              fill="currentColor"
              fontSize="54"
              fontWeight="600"
              className="pop-in"
              style={{ ...delay(1800), fontFamily: "var(--font-cormorant), serif" }}
            >
              R
            </text>
          </svg>
        </div>
      </div>

      {/* floating products, or category chips until there are photos */}
      {showcase.length > 0
        ? showcase.map((p, i) => {
            const s = CARD_SLOTS[i];
            return (
              <div key={p.id} className={`absolute z-20 ${s.pos}`}>
                <div className="parallax" style={depth(s.depth)}>
                  <div className="pop-in" style={delay(s.d)}>
                    <div className={s.float}>
                      <Link
                        href={`/product/${p.slug}`}
                        aria-label={`${p.name}, ${formatPrice(p.pricing.price)}`}
                        className="group relative block aspect-[3/4] overflow-hidden rounded-2xl border border-white/20 bg-accent-dark shadow-[0_20px_50px_-12px_rgba(0,0,0,0.55)] transition hover:border-gold/70"
                      >
                        <Image
                          src={p.images[0]}
                          alt=""
                          fill
                          sizes="(min-width: 768px) 180px, 140px"
                          className="object-cover transition duration-700 group-hover:scale-105"
                        />
                        <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-accent-dark/90 via-transparent to-transparent" />
                        <span className="absolute inset-x-2.5 bottom-2 text-left text-cream">
                          <span className="block truncate font-display text-sm leading-tight sm:text-base">{p.name}</span>
                          <span className="text-[11px] text-gold sm:text-xs">{formatPrice(p.pricing.price)}</span>
                        </span>
                        {p.pricing.onSale && (
                          <span className="absolute left-2 top-2 rounded-full bg-gold px-2 py-0.5 text-[10px] font-medium text-accent-dark">
                            −{p.pricing.percent}%
                          </span>
                        )}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        : chips.map((c, i) => {
            const s = CHIP_SLOTS[i];
            return (
              <div key={c.id} className={`absolute z-20 ${s.pos}`}>
                <div className="parallax" style={depth(s.depth)}>
                  <div className="pop-in" style={delay(s.d)}>
                    <div className={s.float}>
                      <Link
                        href={`/shop?category=${c.slug}`}
                        className="block rounded-full border border-cream/30 bg-cream/10 px-5 py-2.5 font-display text-xl text-cream backdrop-blur transition hover:bg-cream/20"
                      >
                        {c.name}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

      {/* sparkles */}
      {SPARKS.map((s, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`twinkle pointer-events-none absolute z-[5] text-gold ${s.cls}`}
          style={delay(s.d)}
        >
          ◆
        </span>
      ))}
    </HeroStage>
  );
}
