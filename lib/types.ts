export type SizeType = "clothing" | "shoe" | "none";

export type Category = { id: string; name: string; slug: string; size_type: SizeType };
export type Variant = { id: string; size: string; stock: number };

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_pesewas: number;
  images: string[];
  featured: boolean;
  category: { name: string; slug: string; size_type: SizeType } | null;
  variants: Variant[];
};

export type SiteSettings = {
  business_name: string;
  tagline: string;
  logo_url: string | null;
  hero_image_url: string | null;
  whatsapp_number: string;
  momo_number: string;
  momo_name: string;
  momo_network: string;
};
