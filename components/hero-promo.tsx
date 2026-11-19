import Image from "next/image";
import Link from "next/link";
import type { PromoConfig } from "@/lib/promo-shared";

// A gold pin and two thin strings: the whole thing swings from this point
function Strings() {
  return (
    <svg
      viewBox="0 0 200 48"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="block h-12 w-full"
      fill="none"
      stroke="#d9b26a"
      strokeWidth="1.4"
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
    >
      <path d="M100 5 L22 48 M100 5 L178 48" vectorEffect="non-scaling-stroke" />
      <circle cx="100" cy="5" r="4.5" fill="#d9b26a" stroke="none" />
    </svg>
  );
}

// Shown until the admin uploads an image
function DefaultCard() {
  return (
    <span className="block w-[16rem] rounded-3xl border border-gold/40 bg-linear-to-b from-accent-dark to-accent px-7 py-9 text-center text-cream shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)] sm:w-[20rem]">
      <svg viewBox="0 0 200 200" aria-hidden="true" className="mx-auto h-20 w-20 text-gold" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="100" cy="100" r="92" />
        <path d="M100 78V70C100 63 106 59 111 59C116 59 119 63 119 67" />
        <path d="M100 78L50 110H150Z" />
      </svg>
      <span className="mt-5 block text-xs uppercase tracking-[0.28em] text-gold">New season</span>
      <span className="mt-2 block font-display text-4xl font-medium leading-tight">Fresh styles just landed</span>
      <span className="mt-3 block text-sm text-cream/75">Dresses · Shoes · Sneakers · Bags</span>
      <span className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-cream px-6 text-sm font-medium text-accent">Shop now</span>
    </span>
  );
}

export default function HeroPromo({
  promo,
  preview = false,
  priority = false,
}: {
  promo: PromoConfig;
  preview?: boolean; // in the admin: no clicking through
  priority?: boolean;
}) {
  const hasImage = Boolean(promo.url);
  const anim = promo.animation === "swing" ? "promo-swing" : promo.animation === "float" ? "promo-float" : "";
  const href = hasImage ? promo.link : promo.link || "/shop";

  const body = hasImage ? (
    <span
      className={`block ${
        promo.frame ? "rounded-3xl border border-white/20 bg-accent-dark p-2 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)]" : ""
      }`}
    >
      <Image
        src={promo.url!}
        alt={promo.alt}
        width={1000}
        height={1250}
        priority={priority}
        sizes="(min-width: 768px) 420px, 70vw"
        className={`mx-auto block h-auto max-h-[28rem] w-auto max-w-full object-contain md:max-h-[32rem] ${
          promo.frame ? "rounded-2xl" : "drop-shadow-[0_24px_30px_rgba(0,0,0,0.45)]"
        }`}
      />
    </span>
  ) : (
    <DefaultCard />
  );

  const linked =
    preview || !href ? (
      body
    ) : href.startsWith("/") ? (
      <Link href={href} className="block rounded-3xl">
        {body}
      </Link>
    ) : (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block rounded-3xl">
        {body}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );

  return (
    <div className="mx-auto w-full max-w-[16rem] sm:max-w-[22rem] md:max-w-[24rem]">
      <div className={`mx-auto w-fit max-w-full ${anim}`}>
        <Strings />
        {linked}
      </div>
    </div>
  );
}
