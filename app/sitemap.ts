import type { MetadataRoute } from "next";
import { publicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: products } = await publicClient().from("products").select("slug").eq("active", true);

  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/shop`, changeFrequency: "daily", priority: 0.8 },
    ...(products ?? []).map((p) => ({
      url: `${base}/product/${p.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
