export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

// Profile links (Instagram, Facebook, TikTok...) from NEXT_PUBLIC_SOCIAL_URLS, comma-separated
export function socialLinks(): string[] {
  return (process.env.NEXT_PUBLIC_SOCIAL_URLS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((u) => /^https:\/\//.test(u));
}

// "Reinita's Apparel" -> ["Reinitas Apparel", "Reinita Apparel"], for people who skip the apostrophe
export function nameVariants(name: string): string[] {
  const variants = [name.replace(/['’]/g, ""), name.replace(/['’]s\b/g, "")];
  return [...new Set(variants)].filter((v) => v && v !== name);
}
