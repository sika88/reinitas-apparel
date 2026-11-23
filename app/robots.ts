import type { MetadataRoute } from "next";

import { SITE_URL as base } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/cart", "/checkout"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
