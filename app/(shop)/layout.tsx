import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { CartProvider } from "@/lib/cart";
import { getCategories, getSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
  return (
    <CartProvider>
      <SiteHeader settings={settings} categories={categories} />
      <main className="flex-1">{children}</main>
      <SiteFooter settings={settings} />
    </CartProvider>
  );
}
