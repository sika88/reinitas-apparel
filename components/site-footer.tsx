import Image from "next/image";
import Link from "next/link";
import { waLink } from "@/lib/format";
import type { Category, SiteSettings } from "@/lib/types";

const linkClass = "text-cream/85 transition hover:text-white";

export default function SiteFooter({
  settings,
  categories,
}: {
  settings: SiteSettings;
  categories: Category[];
}) {
  return (
    <footer className="on-dark mt-24 bg-accent text-cream">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          {settings.logo_url ? (
            <Image
              src={settings.logo_url}
              alt={settings.business_name}
              width={330}
              height={112}
              className="h-12 w-auto brightness-0 invert"
            />
          ) : (
            <p className="font-display text-3xl">{settings.business_name}</p>
          )}
          <p className="mt-4 max-w-xs text-sm text-cream/80">
            {settings.tagline || "Dresses, shoes and bags made to turn heads."}
          </p>
        </div>

        <nav aria-label="Shop">
          <h2 className="text-xs uppercase tracking-[0.25em] text-gold">Shop</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link href="/shop" className={linkClass}>
                All products
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/shop?category=${c.slug}`} className={linkClass}>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Help">
          <h2 className="text-xs uppercase tracking-[0.25em] text-gold">Help</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link href="/delivery-returns" className={linkClass}>
                Delivery and returns
              </Link>
            </li>
            <li>
              <Link href="/terms" className={linkClass}>
                Terms of sale
              </Link>
            </li>
            <li>
              <Link href="/privacy" className={linkClass}>
                Privacy policy
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="text-xs uppercase tracking-[0.25em] text-gold">Contact</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {settings.whatsapp_number && (
              <li>
                <a
                  href={waLink(settings.whatsapp_number, "Hello! I'd like to ask about your products.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  Chat on WhatsApp<span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            )}
            <li className="text-cream/80">Pay online or with MoMo</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="container-page py-5 text-xs text-cream/70">
          © {new Date().getFullYear()} {settings.business_name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
