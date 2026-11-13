import Image from "next/image";
import Link from "next/link";
import type { Category, SiteSettings } from "@/lib/types";

export default function SiteHeader({
  settings,
  categories,
}: {
  settings: SiteSettings;
  categories: Category[];
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link href="/" className="flex items-center">
          {settings.logo_url ? (
            <Image
              src={settings.logo_url}
              alt={settings.business_name}
              width={140}
              height={44}
              priority
              className="h-9 w-auto object-contain"
            />
          ) : (
            <span className="font-display text-xl tracking-tight">{settings.business_name}</span>
          )}
        </Link>
        <nav className="ml-auto flex items-center gap-5 text-sm">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/shop?category=${c.slug}`}
              className="text-muted transition hover:text-foreground"
            >
              {c.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
