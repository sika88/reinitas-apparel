import type { SizeType } from "./types";

export const SIZE_PRESETS: Record<SizeType, string[]> = {
  clothing: ["XS", "S", "M", "L", "XL", "XXL"],
  shoe: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"],
  none: ["One size"],
};

export const SIZE_TYPE_LABEL: Record<SizeType, string> = {
  clothing: "Clothing sizes (XS to XXL)",
  shoe: "Shoe sizes (36 to 45)",
  none: "No sizes",
};
