"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/actions/auth";

const links = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <span className="font-display text-lg">Admin</span>
        <nav className="flex flex-wrap gap-1 text-sm">
          {links.map((l) => {
            const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 transition ${
                  active ? "bg-accent/10 font-medium text-accent" : "text-muted hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-4 text-sm">
          <Link href="/" target="_blank" className="text-muted transition hover:text-foreground">
            View site ↗
          </Link>
          <form action={signOut}>
            <button className="text-muted transition hover:text-foreground">Sign out</button>
          </form>
        </div>
      </div>
    </header>
  );
}
