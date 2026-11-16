"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "@/lib/actions/auth";

function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0" aria-hidden="true">
      {children}
    </svg>
  );
}

const NAV = [
  { href: "/admin", label: "Dashboard", exact: true, icon: <path d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z" /> },
  { href: "/admin/products", label: "Products", icon: <path d="M20 8l-8-4-8 4 8 4 8-4Zm0 0v8l-8 4-8-4V8" /> },
  {
    href: "/admin/orders",
    label: "Orders",
    badge: true,
    icon: <path d="M6 6h15l-1.5 9h-12L6 6Zm0 0L5 3H2M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />,
  },
  { href: "/admin/pages", label: "Pages", icon: <path d="M7 3h7l5 5v13H7V3Zm7 0v5h5M10 13h6M10 17h6" /> },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: (
      <>
        <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
        <circle cx="16" cy="7" r="2" />
        <circle cx="8" cy="17" r="2" />
      </>
    ),
  },
];

function SidebarContent({
  businessName,
  logoUrl,
  attention,
  pathname,
}: {
  businessName: string;
  logoUrl: string | null;
  attention: number;
  pathname: string;
}) {
  return (
    <>
      <div className="px-6 pb-4 pt-7">
        {logoUrl ? (
          <Image src={logoUrl} alt={businessName} width={330} height={112} className="h-11 w-auto brightness-0 invert" />
        ) : (
          <p className="font-display text-2xl">{businessName}</p>
        )}
        <p className="mt-2 text-[11px] uppercase tracking-[0.28em] text-gold">Admin</p>
      </div>

      <nav aria-label="Admin" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                active ? "bg-white/12 text-white" : "text-cream/80 hover:bg-white/8 hover:text-white"
              }`}
            >
              <Svg>{item.icon}</Svg>
              <span className="flex-1">{item.label}</span>
              {item.badge && attention > 0 && (
                <span className="rounded-full bg-gold px-2 py-0.5 text-xs font-medium text-accent-dark">
                  {attention}
                  <span className="sr-only"> orders need attention</span>
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-white/10 px-3 py-4 text-sm">
        <Link href="/" target="_blank" className="block rounded-xl px-3 py-2.5 text-cream/80 transition hover:bg-white/8 hover:text-white">
          View shop ↗<span className="sr-only"> (opens in a new tab)</span>
        </Link>
        <form action={signOut}>
          <button className="w-full rounded-xl px-3 py-2.5 text-left text-cream/80 transition hover:bg-white/8 hover:text-white">Sign out</button>
        </form>
      </div>
    </>
  );
}

export default function AdminShell({
  businessName,
  logoUrl,
  attention,
  children,
}: {
  businessName: string;
  logoUrl: string | null;
  attention: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  // keep the "needs attention" badge fresh while the tab is open
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 60_000);
    return () => clearInterval(id);
  }, [router]);

  const sidebar = <SidebarContent businessName={businessName} logoUrl={logoUrl} attention={attention} pathname={pathname} />;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-accent focus:px-5 focus:py-2.5 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      <aside className="on-dark sticky top-0 hidden h-screen flex-col bg-accent text-cream lg:flex">{sidebar}</aside>

      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-surface px-4 py-2.5 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-label="Open menu"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-cream"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="h-6 w-6" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <span className="font-display text-xl text-accent">{businessName}</span>
        {attention > 0 && (
          <Link href="/admin/orders?attention=1" className="ml-auto rounded-full bg-accent px-3 py-1 text-xs font-medium text-white">
            {attention} to action
          </Link>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/50" />
          <aside className="on-dark absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-accent text-cream shadow-xl">{sidebar}</aside>
        </div>
      )}

      <main id="admin-main" className="min-w-0 px-4 py-8 sm:px-8 lg:py-10">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
