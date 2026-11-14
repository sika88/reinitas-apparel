import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";

const sans = Jost({ variable: "--font-jost", subsets: ["latin"] });
const display = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const viewport: Viewport = { themeColor: "#5B1A2B" };

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const description = s.tagline || `Shop dresses, shoes and bags at ${s.business_name}.`;
  return {
    metadataBase: new URL(siteUrl),
    title: { default: s.business_name, template: `%s | ${s.business_name}` },
    description,
    openGraph: {
      type: "website",
      siteName: s.business_name,
      locale: "en_GH",
      title: s.business_name,
      description,
      ...(s.hero_image_url ? { images: [s.hero_image_url] } : {}),
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className="flex min-h-screen flex-col">{children}</body>
    </html>
  );
}
