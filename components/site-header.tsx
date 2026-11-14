import Image from "next/image";
import Link from "next/link";
import CartLink from "@/components/cart-link";
import MobileMenu from "@/components/mobile-menu";
import type { Category, SiteSettings } from "@/lib/types";

export default function SiteHeader({
  settings,
  categories,
}: {
  settings: SiteSettings;
  categories: Category[];
}) {
  const links = [
    { href: "/shop", label: "Shop all" },
    ...categories.map((c) => ({ href: `/shop?category=${c.slug}`, label: c.name })),
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="container-page grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4 md:h-20">
        <div className="flex items-center">
          <MobileMenu links={links} />
          <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm tracking-wide text-foreground/80 transition hover:text-accent">
                {l.label}
              </Link>
            ))}
          </nav>
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
    </header>
  );
}
