"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveProduct } from "@/lib/actions/products";
import { sortSizes } from "@/lib/format";
import { SIZE_PRESETS } from "@/lib/sizes";
import type { SizeType } from "@/lib/types";
import { uploadImage } from "@/lib/upload";

type Cat = { id: string; name: string; size_type: SizeType };
export type ProductData = {
  id: string;
  name: string;
  category_id: string;
  description: string;
  price_pesewas: number;
  images: string[];
  active: boolean;
  featured: boolean;
  variants: { size: string; stock: number }[];
};

const field =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20";

export default function ProductForm({ categories, product }: { categories: Cat[]; product?: ProductData }) {
  const router = useRouter();

  const [name, setName] = useState(product?.name ?? "");
  const [categoryId, setCategoryId] = useState(product?.category_id ?? categories[0]?.id ?? "");
  const [price, setPrice] = useState(product ? (product.price_pesewas / 100).toFixed(2) : "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [active, setActive] = useState(product?.active ?? true);
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [stock, setStock] = useState<Record<string, string>>(() =>
    Object.fromEntries((product?.variants ?? []).map((v) => [v.size, String(v.stock)])),
  );
  const [extraSizes, setExtraSizes] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // stock as it was when the page loaded, to know which sizes the admin actually changed
  const initialStock = useMemo(
    () => Object.fromEntries((product?.variants ?? []).map((v) => [v.size, String(v.stock)])),
    [product],
  );

  const sizeType = categories.find((c) => c.id === categoryId)?.size_type ?? "none";
  const sizeList = useMemo(() => {
    const all = new Set([...SIZE_PRESETS[sizeType], ...Object.keys(stock), ...extraSizes]);
    return sortSizes([...all].map((size) => ({ size }))).map((x) => x.size);
  }, [sizeType, stock, extraSizes]);

  function changeCategory(id: string) {
    const nextType = categories.find((c) => c.id === id)?.size_type ?? "none";
    setCategoryId(id);
    setExtraSizes([]);
    setStock((prev) => Object.fromEntries(Object.entries(prev).filter(([s]) => SIZE_PRESETS[nextType].includes(s))));
  }

  function addCustomSize() {
    const s = custom.trim();
    if (!s || !/^[A-Za-z0-9 ./-]{1,12}$/.test(s)) return;
    setExtraSizes((prev) => (prev.includes(s) ? prev : [...prev, s]));
    setCustom("");
  }

  async function onFiles(files: FileList | null, input: HTMLInputElement) {
    if (!files?.length) return;
    setError(null);
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) urls.push(await uploadImage(f, "products"));
      setImages((prev) => [...prev, ...urls].slice(0, 8));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    }
    input.value = "";
    setUploading(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0 || price.trim() === "") {
      setError("Enter a valid price, for example 320.00");
      return;
    }

    const variants: { size: string; stock: number; changed: boolean }[] = [];
    for (const [size, raw] of Object.entries(stock)) {
      if (raw.trim() === "") continue; // blank = this size isn't offered
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 0) {
        setError(`Stock for ${size} must be a whole number (0 or more).`);
        return;
      }
      variants.push({ size, stock: n, changed: !product || initialStock[size] !== raw });
    }
    if (variants.length === 0) {
      setError("Enter a stock number for at least one size. Leave a size blank if you don't sell it.");
      return;
    }

    setSaving(true);
    const res = await saveProduct({
      id: product?.id,
      name,
      categoryId,
      price: Math.round(priceNum * 100),
      description,
      images,
      active,
      featured,
      variants,
    });
    if (res.ok) {
      router.push("/admin/products");
      router.refresh();
      return;
    }
    setError(res.error);
    setSaving(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm">
          <span className="font-medium">Product name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={120} className={field} />
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="font-medium">Category</span>
          <select value={categoryId} onChange={(e) => changeCategory(e.target.value)} className={field}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="font-medium">Price (GHS)</span>
          <input value={price} onChange={(e) => setPrice(e.target.value)} required inputMode="decimal" placeholder="320.00" className={field} />
        </label>
      </div>

      <label className="block space-y-1.5 text-sm">
        <span className="font-medium">Description</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={3000} className={field} />
      </label>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium">Photos</h2>
          <span className="text-xs text-muted">Up to 8. The first one is the main photo.</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {images.map((src, i) => (
            <div key={src} className="w-28 space-y-1.5">
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-border bg-background">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
                {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-foreground px-2 py-0.5 text-[10px] text-background">Main</span>}
              </div>
              <div className="flex justify-between text-xs">
                {i > 0 ? (
                  <button type="button" onClick={() => setImages((p) => [src, ...p.filter((x) => x !== src)])} className="text-accent hover:underline">
                    Make main
                  </button>
                ) : (
                  <span />
                )}
                <button type="button" onClick={() => setImages((p) => p.filter((x) => x !== src))} className="text-muted hover:text-red-600">
                  Remove
                </button>
              </div>
            </div>
          ))}
          {images.length < 8 && (
            <label className="flex aspect-[4/5] w-28 cursor-pointer items-center justify-center rounded-lg border border-dashed border-border bg-surface px-2 text-center text-xs text-muted transition hover:border-accent">
              {uploading ? "Uploading…" : "+ Add photos"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={uploading}
                onChange={(e) => onFiles(e.target.files, e.target)}
              />
            </label>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-medium">{sizeType === "none" ? "Stock" : "Sizes and stock"}</h2>
          <p className="text-xs text-muted">
            {sizeType === "none"
              ? "How many do you have?"
              : "Type how many you have in each size. Leave a size blank if you don't sell it. 0 means sold out."}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {sizeList.map((size) => (
            <label key={size} className="space-y-1 text-xs">
              <span className="font-medium">{size}</span>
              <input
                value={stock[size] ?? ""}
                onChange={(e) => setStock((p) => ({ ...p, [size]: e.target.value }))}
                inputMode="numeric"
                placeholder="–"
                className={field}
              />
            </label>
          ))}
        </div>
        {sizeType !== "none" && (
          <div className="flex gap-2">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Another size, e.g. 46"
              maxLength={12}
              className={`${field} max-w-48`}
            />
            <button type="button" onClick={addCustomSize} className="rounded-lg border border-border px-3 text-sm transition hover:border-accent">
              Add size
            </button>
          </div>
        )}
        {product && (
          <p className="text-xs text-muted">
            Stock numbers are a snapshot from when you opened this page. Orders may have come in since, so reload before editing a busy product.
          </p>
        )}
      </section>

      <div className="flex flex-wrap gap-6 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="accent-[var(--accent)]" />
          Visible in the shop
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="accent-[var(--accent)]" />
          Featured
        </label>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving || uploading}
          className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : product ? "Save changes" : "Create product"}
        </button>
        <button type="button" onClick={() => router.push("/admin/products")} className="rounded-full border border-border px-6 py-3 text-sm transition hover:border-accent">
          Cancel
        </button>
      </div>
    </form>
  );
}
