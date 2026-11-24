export type HeroFocus = "top" | "center" | "bottom";
export type HeroTint = "light" | "medium" | "strong";
export type HeroSlide = { url: string; focus: HeroFocus };
export type HeroConfig = { enabled: boolean; slides: HeroSlide[]; tint: HeroTint; seconds: number };

export const HERO_DEFAULT: HeroConfig = { enabled: true, slides: [], tint: "medium", seconds: 7 };
export const MAX_SLIDES = 4;
