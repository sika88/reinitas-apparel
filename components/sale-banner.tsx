import Link from "next/link";
import Countdown from "@/components/countdown";
import type { ActiveSale } from "@/lib/pricing";

export default function SaleBanner({ sale }: { sale: ActiveSale }) {
  const message =
    sale.banner_text ||
    `${sale.name}: ${sale.percent_off}% off ${sale.scope === "categories" ? "selected items" : "everything"}`;

  return (
    <div className="bg-accent-dark text-cream">
      <div className="container-page flex flex-wrap items-center justify-center gap-x-5 gap-y-1 py-2.5 text-center text-sm">
        <span className="font-medium tracking-wide">
          <span aria-hidden="true" className="mr-2 text-gold">
            ◆
          </span>
          {message}
        </span>
        {sale.ends_at && (
          <span className="text-cream/80">
            Ends in <Countdown to={sale.ends_at} className="font-medium tabular-nums text-gold" />
          </span>
        )}
        <Link href="/shop?sale=1" className="underline underline-offset-4 transition hover:text-white">
          Shop the sale →
        </Link>
      </div>
    </div>
  );
}
