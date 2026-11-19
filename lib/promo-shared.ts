export type PromoAnimation = "swing" | "float" | "none";
export type PromoConfig = {
  enabled: boolean;
  url: string | null;
  alt: string;
  link: string;
  animation: PromoAnimation;
  frame: boolean;
};

export const PROMO_DEFAULT: PromoConfig = { enabled: true, url: null, alt: "", link: "", animation: "swing", frame: true };

// "" (no link), a path on this site, or an https address
export const isSafeLink = (s: string) =>
  s === "" || /^\/(?!\/)[A-Za-z0-9\-._~/?=&%#]*$/.test(s) || /^https:\/\/[^\s]+$/.test(s);
