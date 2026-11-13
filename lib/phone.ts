// Accepts 0241234567 or +233 24 123 4567. Returns 0241234567, or null if invalid.
export function normalizeGhPhone(input: string): string | null {
  const d = input.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("233")) return "0" + d.slice(3);
  if (d.length === 10 && d.startsWith("0")) return d;
  return null;
}

// 0241234567 -> 233241234567 (what SMS providers expect)
export function toInternational(input: string): string {
  const d = input.replace(/\D/g, "");
  if (d.startsWith("233")) return d;
  if (d.startsWith("0")) return "233" + d.slice(1);
  return d;
}
