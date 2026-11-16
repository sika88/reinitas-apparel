"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/toast";
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

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <h2 className="font-display text-2xl font-medium">{title}</h2>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export default function ProductForm({ categories, product }: { categories: Cat[]; product?: ProductData }) {
  const router = useRouter();
  const toast = useToast();

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
  const [bulk, setBulk] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // stock as it was when the page loaded, to know which sizes the admin actually changed
  const initialStock = useMemo(
    () => Object.fromEntries((product?.variants ?? []).map((v) => [v.size, String(v.stock)])),
    [product],
  );

  // unsaved-changes tracking
  const snapshot = JSON.stringify({ name, categoryId, price, description, images, active, featured, stock });
  const initialSnapshot = useRef<string | null>(null);
  if (initialSnapshot.current === null) initialSnapshot.current = snapshot;
  const dirty = snapshot !== initialSnapshot.current;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const sizeType = categories.find((c) => c.id === categoryId)?.size_type ?? "none";
  const sizeList = useMemo(() => {
    const all = new Set([...SIZE_PRESETS[sizeType], ...Object.keys(stock), ...extraSizes]);
    return sortSizes([...all].map((size) => ({ size }))).map((x) => x.size);
  }, [sizeType, stock, extraSizes]);

  const offered = sizeList.filter((s) => (stock[s] ?? "").trim() !== "");
  const units = offered.reduce((n, s) => n + (Number(stock[s]) || 0), 0);

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

  function applyBulk() {
    const n = Number(bulk);
    if (bulk.trim() === "" || !Number.isInteger(n) || n < 0) {
      toast.error("Enter a whole number (0 or more) to apply to every size.");
      return;
    }
    setStock(Object.fromEntries(sizeList.map((s) => [s, String(n)])));
  }

  async function onFiles(files: FileList | null, input: HTMLInputElement) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) urls.push(await uploadImage(f, "products"));
      setImages((prev) => [...prev, ...urls].slice(0, 8));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    }
    input.value = "";
    setUploading(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0 || price.trim() === "") {
      toast.error("Enter a valid price, for example 320.00");
      return;
    }

    const variants: { size: string; stock: number; changed: boolean }[] = [];
    for (const [size, raw] of Object.entries(stock)) {
      if (raw.trim() === "") continue; // blank = this size isn't offered
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 0) {
        toast.error(`Stock for ${size} must be a whole number (0 or more).`);
        return;
      }
      variants.push({ size, stock: n, changed: !product || initialStock[size] !== raw });
    }
    if (variants.length === 0) {
      toast.error("Enter a stock number for at least one size. Leave a size blank if you don't sell it.");
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
      toast.success(product ? "Product saved" : "Product created");
      router.push("/admin/products");
      router.refresh();
      return;
    }
    toast.error(res.error);
    setSaving(false);
  }

  function cancel() {
    if (dirty && !window.confirm("Discard your changes?")) return;
    router.push("/admin/products");
  }

  return (
    <form onSubmit={onSubmit} className="pb-28">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card title="Details">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Product name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={120} className="field" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Description</span>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} maxLength={3000} className="field" />
            </label>
          </Card>

          <Card title="Photos" hint="Up to 8. The first photo is the main one. Large photos are shrunk automatically.">
            <div className="flex flex-wrap gap-3">
              {images.map((src, i) => (
                <div key={src} className="w-28 space-y-1.5">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-border bg-cream">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-foreground px-2 py-0.5 text-[10px] text-background">Main</span>}
                  </div>
                  <div className="flex justify-between text-xs">
                    {i > 0 ? (
                      <button type="button" onClick={() => setImages((p) => [src, ...p.filter((x) => x !== src)])} className="text-accent underline underline-offset-2">
                        Make main
                      </button>
                    ) : (
                      <span />
                    )}
                    <button type="button" onClick={() => setImages((p) => p.filter((x) => x !== src))} className="text-muted transition hover:text-red-600">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              {images.length < 8 && (
                <label className="flex aspect-[4/5] w-28 cursor-pointer items-center justify-center rounded-xl border border-dashed border-border bg-background px-2 text-center text-xs text-muted transition hover:border-accent">
                  {uploading ? "Uploading…" : "+ Add photos"}
                  <input type="file" accept="image/*" multiple className="hidden" disabled={uploading} onChange={(e) => onFiles(e.target.files, e.target)} />
                </label>
              )}
            </div>
          </Card>

          <Card
            title={sizeType === "none" ? "Stock" : "Sizes and stock"}
            hint={
              sizeType === "none"
                ? "How many do you have?"
                : "Type how many you have in each size. Leave a size blank if you don't sell it. 0 means sold out."
            }
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {sizeList.map((size) => {
                const raw = stock[size] ?? "";
                const state = raw.trim() === "" ? "Not sold" : Number(raw) === 0 ? "Sold out" : "In stock";
                return (
                  <label key={size} className="block rounded-xl border border-border bg-background p-3">
                    <span className="flex items-center justify-between text-sm font-medium">
                      {size}
                      <span className={`text-[11px] font-normal ${state === "Sold out" ? "text-red-600" : "text-muted"}`}>{state}</span>
                    </span>
                    <input
                      value={raw}
                      onChange={(e) => setStock((p) => ({ ...p, [size]: e.target.value }))}
                      inputMode="numeric"
                      placeholder="–"
                      aria-label={`Stock for ${size}`}
                      className="field mt-2"
                    />
                  </label>
                );
              })}
            </div>

            <div className="flex flex-wrap items-end gap-x-6 gap-y-3 border-t border-border pt-4">
              <div className="flex items-end gap-2">
                <label className="block text-xs text-muted">
                  Set every size to
                  <input value={bulk} onChange={(e) => setBulk(e.target.value)} inputMode="numeric" placeholder="5" className="field mt-1 w-24" />
                </label>
                <button type="button" onClick={applyBulk} className="rounded-lg border border-border px-3 py-2.5 text-sm transition hover:border-accent">
                  Apply
                </button>
              </div>
              {sizeType !== "none" && (
                <div className="flex items-end gap-2">
                  <label className="block text-xs text-muted">
                    Add another size
                    <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="e.g. 46" maxLength={12} className="field mt-1 w-28" />
                  </label>
                  <button type="button" onClick={addCustomSize} className="rounded-lg border border-border px-3 py-2.5 text-sm transition hover:border-accent">
                    Add
                  </button>
                </div>
              )}
              <p className="text-sm text-muted sm:ml-auto" aria-live="polite">
                {units} {units === 1 ? "unit" : "units"} across {offered.length} {offered.length === 1 ? "size" : "sizes"}
              </p>
            </div>

            {product && (
              <p className="text-xs text-muted">
                Stock numbers are a snapshot from when you opened this page. Orders may have come in since, so reload before editing a busy product.
              </p>
            )}
          </Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <Card title="Visibility">
            <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-border p-3">
              <span>
                <span className="block text-sm font-medium">Visible in the shop</span>
                <span className="text-xs text-muted">Hidden products can’t be seen or bought.</span>
              </span>
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="mt-1 h-5 w-5 accent-[var(--accent)]" />
            </label>
            <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-border p-3">
              <span>
                <span className="block text-sm font-medium">Featured</span>
                <span className="text-xs text-muted">Shown in “Featured pieces” on the home page.</span>
              </span>
              <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="mt-1 h-5 w-5 accent-[var(--accent)]" />
            </label>
          </Card>

          <Card title="Organise">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Category</span>
              <select value={categoryId} onChange={(e) => changeCategory(e.target.value)} className="field">
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Price</span>
              <div className="relative">
                <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-muted">
                  GHS
                </span>
                <input value={price} onChange={(e) => setPrice(e.target.value)} required inputMode="decimal" placeholder="320.00" className="field pl-12" />
              </div>
            </label>
          </Card>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 backdrop-blur lg:left-[260px]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <p aria-live="polite" className={`text-sm ${dirty ? "text-amber-700" : "text-muted"}`}>
            {dirty ? "Unsaved changes" : product ? "No changes yet" : "New product"}
          </p>
          <div className="flex gap-3">
            <button type="button" onClick={cancel} className="btn-outline">
              Cancel
            </button>
            <button type="submit" disabled={saving || uploading} className="btn-primary">
              {saving ? "Saving…" : product ? "Save changes" : "Create product"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
