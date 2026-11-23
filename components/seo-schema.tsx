import { nameVariants, SITE_URL, socialLinks } from "@/lib/seo";
import type { SiteSettings } from "@/lib/types";

// Tells Google the company name, logo and website, so they can show them in search results
export default function SeoSchema({ settings }: { settings: SiteSettings }) {
  const name = settings.business_name;
  const alt = nameVariants(name);
  const sameAs = socialLinks();
  const digits = (settings.whatsapp_number ?? "").replace(/\D/g, "");

  const graph = [
    {
      "@type": "OnlineStore",
      "@id": `${SITE_URL}/#organization`,
      name,
      alternateName: alt.length ? alt : undefined,
      url: SITE_URL,
      areaServed: "GH",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.png`, width: 192, height: 192 },
      image: settings.logo_url ?? undefined,
      description: `${name} sells dresses, shoes, sneakers, bags and more online in Ghana.`,
      sameAs: sameAs.length ? sameAs : undefined,
      contactPoint: digits
        ? [{ "@type": "ContactPoint", contactType: "customer service", telephone: `+${digits}`, areaServed: "GH", availableLanguage: ["English"] }]
        : undefined,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name,
      alternateName: alt.length ? alt : undefined,
      inLanguage: "en-GH",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c"),
      }}
    />
  );
}
