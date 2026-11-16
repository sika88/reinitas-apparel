import SaleBanner from "@/components/sale-banner";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { CartProvider } from "@/lib/cart";
import { getActiveSales, getCategories, getSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories, sales] = await Promise.all([getSettings(), getCategories(), getActiveSales()]);
  const topSale = sales[0]; // the biggest live discount (the query sorts by percentage)

  return (
    <CartProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-accent focus:px-5 focus:py-2.5 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>
      {topSale && <SaleBanner sale={topSale} />}
      <SiteHeader settings={settings} categories={categories} hasSale={Boolean(topSale)} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter settings={settings} categories={categories} />
    </CartProvider>
  );
}
