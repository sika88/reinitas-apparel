import Image from "next/image";
import Link from "next/link";
import CartLink from "@/components/cart-link";
import MobileMenu from "@/components/mobile-menu";
import type { Category, SiteSettings } from "@/lib/types";

export default function SiteHeader({
  settings,
  categories,
  hasSale,
}: {
  settings: SiteSettings;
  categories: Category[];
  hasSale: boolean;
}) {
  const links: { href: string; label: string; sale?: boolean }[] = [
    { href: "/shop", label: "Shop all" },
    ...categories.map((c) => ({ href: `/shop?category=${c.slug}`, label: c.name })),
    ...(hasSale ? [{ href: "/shop?sale=1", label: "Sale", sale: true }] : []),
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="container-page grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4 md:h-[72px]">
        <div className="flex items-center">
          <MobileMenu links={links} />
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

        <div className="flex items-center justify-end">
          <CartLink />
        </div>
      </div>

      <nav aria-label="Main" className="hidden border-t border-border/70 md:block">
        <ul className="container-page flex flex-wrap items-center justify-center gap-x-8 gap-y-1 py-2.5">
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
    </header>
  );
}
