import type { Metadata } from "next";
import { Geist, Playfair_Display } from "next/font/google";
import "./globals.css";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { CartProvider } from "@/lib/cart";
import { getCategories, getSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";

const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const display = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: { default: s.business_name, template: `%s | ${s.business_name}` },
    description: s.tagline || `Shop dresses, shoes and bags at ${s.business_name}.`,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className="flex min-h-screen flex-col">
        <CartProvider>
          <SiteHeader settings={settings} categories={categories} />
          <main className="flex-1">{children}</main>
          <SiteFooter settings={settings} />
        </CartProvider>
      </body>
    </html>
  );
}
