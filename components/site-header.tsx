import Image from "next/image";
import Link from "next/link";
import CartLink from "@/components/cart-link";
import MobileMenu from "@/components/mobile-menu";
import { formatPhone, telHref } from "@/lib/format";
import type { Category, SiteSettings } from "@/lib/types";

function PhoneIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A15 15 0 0 1 4 5a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

export default function SiteHeader({
  settings,
  categories,
  hasSale,
  callNumber,
}: {
  settings: SiteSettings;
  categories: Category[];
  hasSale: boolean;
  callNumber: string;
}) {
  const links: { href: string; label: string; sale?: boolean }[] = [
    { href: "/shop", label: "Shop all" },
    ...categories.map((c) => ({ href: `/shop?category=${c.slug}`, label: c.name })),
    ...(hasSale ? [{ href: "/shop?sale=1", label: "Sale", sale: true }] : []),
  ];
  const call = callNumber ? { href: telHref(callNumber), label: formatPhone(callNumber) } : undefined;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="container-page grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4 md:h-[72px]">
        <div className="flex items-center">
          <MobileMenu links={links} call={call} />
        </div>

        <Link href="/" className="flex items-center justify-center">
          {settings.logo_url ? (
            <Image
              src={settings.logo_url}
              alt={settings.business_name}
              width={330}
              height={112}
              priority
              className="h-10 w-auto md:h-12"
            />
          ) : (
            <span className="font-display text-2xl font-semibold tracking-tight text-accent md:text-3xl">
              {settings.business_name}
            </span>
          )}
        </Link>

        <div className="flex items-center justify-end gap-1">
          {call && (
            <a
              href={call.href}
              aria-label={`Call us on ${call.label}`}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-cream md:hidden"
            >
              <PhoneIcon className="h-6 w-6" />
            </a>
          )}
          <CartLink />
        </div>
      </div>

      <div className="hidden border-t border-border/70 md:block">
        <div className="container-page grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-2.5">
          <span aria-hidden="true" />

          <nav aria-label="Main">
            <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-1">
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={`text-sm tracking-wide transition ${
                      l.sale ? "font-medium text-accent hover:text-accent-dark" : "text-foreground/80 hover:text-accent"
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex justify-end">
            {call && (
              <a href={call.href} className="inline-flex items-center gap-2 whitespace-nowrap text-sm transition hover:text-accent">
                <PhoneIcon />
                <span className="hidden text-muted lg:inline">Call us</span>
                <span className="font-medium">{call.label}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
