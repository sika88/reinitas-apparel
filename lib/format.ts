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
