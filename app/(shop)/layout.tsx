import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { CartProvider } from "@/lib/cart";
import { getCategories, getSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
  return (
    <CartProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-accent focus:px-5 focus:py-2.5 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>
      <SiteHeader settings={settings} categories={categories} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter settings={settings} categories={categories} />
    </CartProvider>
  );
}
