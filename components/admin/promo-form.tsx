"use client";

import { useState, useTransition } from "react";
import { useToast } from "@/components/admin/toast";
import HeroPromo from "@/components/hero-promo";
import { savePromo } from "@/lib/actions/promo";
import { isSafeLink, type PromoAnimation, type PromoConfig } from "@/lib/promo-shared";
import { uploadImage } from "@/lib/upload";

type Cat = { name: string; slug: string };

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <h2 className="font-display text-2xl font-medium">{title}</h2>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export default function PromoForm({ initial, categories }: { initial: PromoConfig; categories: Cat[] }) {
  const toast = useToast();

  const options = [
    { value: "", label: "Nowhere (just show the image)" },
    { value: "/shop", label: "All products" },
    { value: "/shop?sale=1", label: "Sale items" },
    ...categories.map((c) => ({ value: `/shop?category=${c.slug}`, label: `${c.name} category` })),
  ];
  const known = options.some((o) => o.value === initial.link);

  const [enabled, setEnabled] = useState(initial.enabled);
  const [url, setUrl] = useState<string | null>(initial.url);
  const [alt, setAlt] = useState(initial.alt);
  const [choice, setChoice] = useState(known ? initial.link : "custom");
  const [custom, setCustom] = useState(known ? "" : initial.link);
  const [animation, setAnimation] = useState<PromoAnimation>(initial.animation);
  const [frame, setFrame] = useState(initial.frame);
  const [uploading, setUploading] = useState(false);
  const [pending, start] = useTransition();

  const link = choice === "custom" ? custom.trim() : choice;

  async function onFile(files: FileList | null, input: HTMLInputElement) {
    const f = files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      setUrl(await uploadImage(f, "branding"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    }
    input.value = "";
    setUploading(false);
  }

  function save() {
    if (url && !alt.trim()) {
      toast.error("Add a short description of the image, for people who can't see it.");
      return;
    }
    if (!isSafeLink(link)) {
      toast.error("The link must start with / (a page on your shop) or https://");
      return;
    }
    start(async () => {
      const r = await savePromo({ enabled, url, alt, link, animation, frame });
      if (r.ok) toast.success("Saved. It's live on the home page.");
      else toast.error(r.error);
    });
  }

  const preview: PromoConfig = { enabled, url, alt, link, animation, frame };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <Card
          title="Image"
          hint="Use it to announce a promo, a discount or a sale. A portrait picture of about 1080 × 1350 px works best. It is never cropped."
        >
          <div className="flex flex-wrap items-center gap-3">
            <label className="btn-primary cursor-pointer">
              {uploading ? "Uploading…" : url ? "Replace image" : "Upload an image"}
              <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => onFile(e.target.files, e.target)} />
            </label>
            {url && (
              <button
                type="button"
                onClick={() => {
                  setUrl(null);
                  setAlt("");
                }}
                className="text-sm text-muted underline underline-offset-4 transition hover:text-foreground"
              >
                Use the default design
              </button>
            )}
          </div>
          {!url && <p className="text-sm text-muted">No image yet, so the default “Fresh styles just landed” card is shown.</p>}

          {url && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Describe the image</span>
              <input
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                maxLength={120}
                placeholder="e.g. Black Friday: 40% off all dresses"
                className="field"
              />
              <span className="mt-1 block text-xs text-muted">For people who use a screen reader, and for Google. Say what the picture says.</span>
            </label>
          )}
        </Card>

        <Card title="Where does it go when someone taps it?">
          <label className="block">
            <span className="sr-only">Link</span>
            <select value={choice} onChange={(e) => setChoice(e.target.value)} className="field max-w-sm">
              {options.map((o) => (
                <option key={o.value || "none"} value={o.value}>
                  {o.label}
                </option>
              ))}
              <option value="custom">A different address…</option>
            </select>
          </label>
          {choice === "custom" && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Address</span>
              <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="/product/adjoa-wrap-dress-m or https://…" className="field" />
              <span className="mt-1 block text-xs text-muted">Start with / for a page on your shop, or https:// for another website.</span>
            </label>
          )}
          {!url && choice === "" && <p className="text-xs text-muted">The default card sends people to the shop when you leave this empty.</p>}
        </Card>

        <Card title="How it looks">
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Motion</legend>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["swing", "Swing"],
                  ["float", "Float"],
                  ["none", "Still"],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={`inline-flex min-h-10 cursor-pointer items-center rounded-full border px-5 text-sm transition ${
                    animation === value ? "border-accent bg-accent text-white" : "border-border hover:border-accent"
                  }`}
                >
                  <input type="radio" name="promo-motion" checked={animation === value} onChange={() => setAnimation(value)} className="sr-only" />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-border p-3">
            <span>
              <span className="block text-sm font-medium">Show a frame around the image</span>
              <span className="text-xs text-muted">Turn this off for a transparent cut-out picture, so it hangs without a box.</span>
            </span>
            <input type="checkbox" checked={frame} onChange={(e) => setFrame(e.target.checked)} className="mt-1 h-5 w-5 accent-[var(--accent)]" />
          </label>

          <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-border p-3">
            <span>
              <span className="block text-sm font-medium">Show on the home page</span>
              <span className="text-xs text-muted">Switch off to hide this area completely.</span>
            </span>
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="mt-1 h-5 w-5 accent-[var(--accent)]" />
          </label>
        </Card>

        <button type="button" onClick={save} disabled={pending || uploading} className="btn-primary">
          {pending ? "Saving…" : "Save"}
        </button>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <h2 className="mb-3 font-display text-2xl font-medium">Preview</h2>
        <div className="on-dark overflow-hidden rounded-2xl bg-accent px-6 pb-10 pt-8">
          {enabled ? (
            <HeroPromo promo={preview} preview />
          ) : (
            <p className="rounded-xl border border-dashed border-cream/30 p-6 text-center text-sm text-cream/80">Switched off. Nothing shows here on the home page.</p>
          )}
        </div>
        <p className="mt-3 text-xs text-muted">This is how it appears on the right side of the home page. Hover it to pause the motion.</p>
      </aside>
    </div>
  );
}
