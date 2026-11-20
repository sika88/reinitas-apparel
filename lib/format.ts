export function formatPrice(pesewas: number) {
  return new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS" }).format(pesewas / 100);
}

// wa.me needs digits only, with the country code (e.g. 233241234567)
export function waLink(number: string, text: string) {
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

const LETTER_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];

export function sortSizes<T extends { size: string }>(variants: T[]): T[] {
  return [...variants].sort((a, b) => {
    const na = Number(a.size);
    const nb = Number(b.size);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    const ia = LETTER_ORDER.indexOf(a.size);
    const ib = LETTER_ORDER.indexOf(b.size);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
}

// "233540245553" -> "054 024 5553". Other numbers are shown as "+<digits>".
export function formatPhone(intl: string) {
  const d = intl.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("233")) {
    const local = "0" + d.slice(3);
    return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  }
  return d ? `+${d}` : "";
}

export const telHref = (intl: string) => `tel:+${intl.replace(/\D/g, "")}`;
