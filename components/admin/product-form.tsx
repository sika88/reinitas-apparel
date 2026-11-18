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
type Template = {
  name: string;
  category_id: string;
  description: string;
  price_pesewas: number;
  images: string[];
  active: boolean;
  featured: boolean;
};
export type ProductData = Template & { id: string; variants: { size: string; stock: number }[] };

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <h2 className="font-display text-2xl font-medium">{title}</h2>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export default function ProductForm({
  categories,
  product,
  template,
}: {
  categories: Cat[];
  product?: ProductData; // editing
  template?: Template; // "add another size": same details, new size
}) {
  const router = useRouter();
  const toast = useToast();
  const base = product ?? template;

  const [name, setName] = useState(base?.name ?? "");
  const [categoryId, setCategoryId] = useState(base?.category_id ?? categories[0]?.id ?? "");
  const [price, setPrice] = useState(base ? (base.price_pesewas / 100).toFixed(2) : "");
  const [description, setDescription] = useState(base?.description ?? "");
  const [images, setImages] = useState<string[]>(base?.images ?? []);
  const [active, setActive] = useState(base?.active ?? true);
  const [featured, setFeatured] = useState(base?.featured ?? false);
  const [size, setSize] = useState(product?.variants[0]?.size ?? "");
  const [stock, setStock] = useState(product ? String(product.variants[0]?.stock ?? "") : "");
  const [custom, setCustom] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const initialStock = useRef(product ? String(product.variants[0]?.stock ?? "") : "");

  // unsaved-changes tracking
  const snapshot = JSON.stringify({ name, categoryId, price, description, images, active, featured, size, stock });
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
  const sized = sizeType !== "none";

  const sizeOptions = useMemo(() => {
    const presets = SIZE_PRESETS[sizeType];
    const all = size && !presets.includes(size) && size !== "One size" ? [...presets, size] : presets;
    return sortSizes(all.map((s) => ({ size: s }))).map((x) => x.size);
  }, [sizeType, size]);

  function changeCategory(id: string) {
    const nextType = categories.find((c) => c.id === id)?.size_type ?? "none";
    setCategoryId(id);
    if (nextType === "none" || !SIZE_PRESETS[nextType].includes(size)) setSize("");
  }

  function useCustomSize() {
    const s = custom.trim();
    if (!s || !/^[A-Za-z0-9 ./-]{1,12}$/.test(s)) {
      toast.error("Use up to 12 letters or numbers for the size.");
      return;
    }
    setSize(s);
    setCustom("");
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

  async function submit(addAnother: boolean) {
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0 || price.trim() === "") {
      toast.error("Enter a valid price, for example 320.00");
      return;
    }
    if (sized && !size) {
      toast.error("Choose the size this product is posted under.");
      return;
    }
    const stockNum = Number(stock);
    if (stock.trim() === "" || !Number.isInteger(stockNum) || stockNum < 0) {
      toast.error("Enter how many you have in stock (0 or more).");
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
      size: sized ? size : null,
      stock: stockNum,
      stockChanged: !product || stock !== initialStock.current,
    });

    if (res.ok) {
      if (addAnother) {
        toast.success(`Created. Now add the next size.`);
        router.push(`/admin/products/new?from=${res.id}`);
      } else {
        toast.success(product ? "Product saved" : "Product created");
        router.push("/admin/products");
      }
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

  const stockState = stock.trim() === "" ? null : Number(stock) === 0 ? "Sold out" : "In stock";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(false);
      }}
      className="pb-28"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card
            title="Category and size"
            hint={sized ? "Each listing is posted under one size. To sell the same item in another size, post it again for that size." : undefined}
          >
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Category</span>
              <select value={categoryId} onChange={(e) => changeCategory(e.target.value)} className="field max-w-xs">
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            {sized && (
              <div>
                <p id="size-label" className="mb-2 text-sm font-medium">
                  Size
                </p>
                <div role="radiogroup" aria-labelledby="size-label" className="flex flex-wrap gap-2">
                  {sizeOptions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      role="radio"
                      aria-checked={size === s}
                      onClick={() => setSize(s)}
                      className={`min-h-11 min-w-12 rounded-lg border px-4 text-sm transition ${
                        size === s ? "border-accent bg-accent text-white" : "border-border bg-surface hover:border-accent"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-end gap-2">
                  <label className="block text-xs text-muted">
                    Another size
                    <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="e.g. 46" maxLength={12} className="field mt-1 w-32" />
                  </label>
                  <button type="button" onClick={useCustomSize} className="rounded-lg border border-border px-3 py-2.5 text-sm transition hover:border-accent">
                    Use this size
                  </button>
                </div>
              </div>
            )}
          </Card>

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
        </div>

        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <Card title="Price and stock">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Price</span>
              <div className="relative">
                <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-muted">
                  GHS
                </span>
                <input value={price} onChange={(e) => setPrice(e.target.value)} required inputMode="decimal" placeholder="320.00" className="field pl-12" />
              </div>
            </label>
            <label className="block">
              <span className="mb-1.5 flex items-center justify-between text-sm font-medium">
                {sized ? (size ? `How many in size ${size}?` : "How many in this size?") : "How many do you have?"}
                {stockState && <span className={`text-xs font-normal ${stockState === "Sold out" ? "text-red-600" : "text-muted"}`}>{stockState}</span>}
              </span>
              <input value={stock} onChange={(e) => setStock(e.target.value)} required inputMode="numeric" placeholder="1" className="field" />
            </label>
            {product && (
              <p className="text-xs text-muted">This number is a snapshot from when you opened the page. Orders may have come in since, so reload before editing a busy product.</p>
            )}
          </Card>

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
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 backdrop-blur lg:left-[260px]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <p aria-live="polite" className={`text-sm ${dirty ? "text-amber-700" : "text-muted"}`}>
            {dirty ? "Unsaved changes" : product ? "No changes yet" : template ? "Add the next size" : "New product"}
          </p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={cancel} className="btn-outline">
              Cancel
            </button>
            {!product && sized && (
              <button type="button" onClick={() => submit(true)} disabled={saving || uploading} className="btn-outline">
                Save and add another size
              </button>
            )}
            <button type="submit" disabled={saving || uploading} className="btn-primary">
              {saving ? "Saving…" : product ? "Save changes" : "Create product"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
