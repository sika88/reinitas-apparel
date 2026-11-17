import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import SeoSchema from "@/components/seo-schema";
import { getSettings } from "@/lib/queries";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

const sans = Jost({ variable: "--font-jost", subsets: ["latin"] });
const display = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = { themeColor: "#5B1A2B" };

// The share image (opengraph-image.png) and icons (icon.png, apple-icon.png) come from the files in /app
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const name = s.business_name;
  const title = `${name} | Dresses, Shoes, Bags and More`;
  const description = `Shop dresses, shoes, sneakers, bags and more at ${name}, online in Ghana. Pay online or with MoMo.`;

  return {
    metadataBase: new URL(SITE_URL),
    applicationName: name,
    title: { default: title, template: `%s | ${name}` },
    description,
    openGraph: { type: "website", siteName: name, locale: "en_GH", title, description },
    twitter: { card: "summary_large_image", title, description },
    verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className="flex min-h-screen flex-col">
        <SeoSchema settings={settings} />
        {children}
      </body>
    </html>
  );
}
