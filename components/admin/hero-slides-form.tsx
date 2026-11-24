"use client";

import { useState, useTransition } from "react";
import { useToast } from "@/components/admin/toast";
import HeroSlidesView from "@/components/hero-slides-view";
import { saveHeroSlides } from "@/lib/actions/hero";
import { MAX_SLIDES, type HeroConfig, type HeroFocus, type HeroSlide, type HeroTint } from "@/lib/hero-shared";
import { uploadImage } from "@/lib/upload";

const SPEEDS = [
  { label: "Slow", seconds: 10 },
  { label: "Normal", seconds: 7 },
  { label: "Fast", seconds: 5 },
];
const TINTS: { value: HeroTint; label: string; hint: string }[] = [
  { value: "light", label: "Light", hint: "Photos show clearly" },
  { value: "medium", label: "Medium", hint: "Balanced. Recommended" },
  { value: "strong", label: "Strong", hint: "Most burgundy. Easiest to read" },
];
const FOCUS: { value: HeroFocus; label: string }[] = [
  { value: "top", label: "Top" },
  { value: "center", label: "Middle" },
  { value: "bottom", label: "Bottom" },
];

const nearestSpeed = (s: number) => SPEEDS.reduce((a, b) => (Math.abs(b.seconds - s) < Math.abs(a.seconds - s) ? b : a)).seconds;

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <h2 className="font-display text-2xl font-medium">{title}</h2>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export default function HeroSlidesForm({ initial }: { initial: HeroConfig }) {
  const toast = useToast();
  const [enabled, setEnabled] = useState(initial.enabled);
  const [slides, setSlides] = useState<HeroSlide[]>(initial.slides);
  const [tint, setTint] = useState<HeroTint>(initial.tint);
  const [seconds, setSeconds] = useState(nearestSpeed(initial.seconds));
  const [uploading, setUploading] = useState(false);
  const [pending, start] = useTransition();

  async function onFiles(files: FileList | null, input: HTMLInputElement) {
    if (!files?.length) return;
    const room = MAX_SLIDES - slides.length;
    if (room <= 0) {
      toast.error(`You can use up to ${MAX_SLIDES} photos. Remove one first.`);
      input.value = "";
      return;
    }
    const chosen = Array.from(files).slice(0, room);
    if (files.length > room) toast.error(`Only ${room} more ${room === 1 ? "photo" : "photos"} fit. The rest were skipped.`);

    setUploading(true);
    try {
      const added: HeroSlide[] = [];
      for (const f of chosen) added.push({ url: await uploadImage(f, "branding"), focus: "top" });
      setSlides((prev) => [...prev, ...added].slice(0, MAX_SLIDES));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    }
    input.value = "";
    setUploading(false);
  }

  function move(i: number, dir: -1 | 1) {
    setSlides((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function save() {
    start(async () => {
      const r = await saveHeroSlides({ enabled, slides, tint, seconds });
      if (r.ok) toast.success("Saved. The home page now uses these photos.");
      else toast.error(r.error);
    });
  }

  const previewKey = slides.map((s) => `${s.url}:${s.focus}`).join("|") + `|${tint}|${seconds}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <Card
          title="Photos"
          hint={`Up to ${MAX_SLIDES}. They fade into each other in this order. Use landscape photos of about 2000 × 1200 px, with the dresses and faces in the top half, and no writing on the picture.`}
        >
          <ul className="grid gap-4 sm:grid-cols-2">
            {slides.map((s, i) => (
              <li key={s.url} className="rounded-xl border border-border bg-background p-3">
                <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-cream">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.url}
                    alt={`Photo ${i + 1}`}
                    className={`h-full w-full object-cover ${s.focus === "top" ? "object-top" : s.focus === "bottom" ? "object-bottom" : "object-center"}`}
                  />
                  <span className="absolute left-2 top-2 rounded-full bg-foreground px-2.5 py-0.5 text-[11px] text-background">{i + 1}</span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                  <label className="flex items-center gap-2">
                    <span className="text-muted">Focus</span>
                    <select
                      value={s.focus}
                      onChange={(e) => setSlides((p) => p.map((x, k) => (k === i ? { ...x, focus: e.target.value as HeroFocus } : x)))}
                      className="field w-auto py-1.5"
                    >
                      {FOCUS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <span className="ml-auto flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      aria-label={`Move photo ${i + 1} earlier`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border transition hover:border-accent disabled:opacity-30"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === slides.length - 1}
                      aria-label={`Move photo ${i + 1} later`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border transition hover:border-accent disabled:opacity-30"
                    >
                      →
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlides((p) => p.filter((_, k) => k !== i))}
                      className="ml-2 text-muted underline underline-offset-4 transition hover:text-red-600"
                    >
                      Remove<span className="sr-only"> photo {i + 1}</span>
                    </button>
                  </span>
                </div>
              </li>
            ))}

            {slides.length < MAX_SLIDES && (
              <li>
                <label className="flex aspect-[16/10] cursor-pointer items-center justify-center rounded-xl border border-dashed border-border bg-background px-3 text-center text-sm text-muted transition hover:border-accent">
                  {uploading ? "Uploading…" : slides.length === 0 ? "+ Add photos" : "+ Add more photos"}
                  <input type="file" accept="image/*" multiple className="hidden" disabled={uploading} onChange={(e) => onFiles(e.target.files, e.target)} />
                </label>
              </li>
            )}
          </ul>
          <p className="text-xs text-muted">
            Only use photos you own or are licensed to use commercially, such as Reinita’s own photos or properly licensed stock images. Photos of her own products and models work best.
          </p>
        </Card>

        <Card title="How it looks">
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Burgundy tint</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {TINTS.map((t) => (
                <label
                  key={t.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${tint === t.value ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"}`}
                >
                  <input type="radio" name="hero-tint" checked={tint === t.value} onChange={() => setTint(t.value)} className="mt-1 h-4 w-4 accent-[var(--accent)]" />
                  <span className="text-sm">
                    <span className="block font-medium">{t.label}</span>
                    <span className="text-xs text-muted">{t.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-medium">Time on each photo</legend>
            <div className="flex flex-wrap gap-2">
              {SPEEDS.map((s) => (
                <label
                  key={s.label}
                  className={`inline-flex min-h-10 cursor-pointer items-center rounded-full border px-5 text-sm transition ${
                    seconds === s.seconds ? "border-accent bg-accent text-white" : "border-border hover:border-accent"
                  }`}
                >
                  <input type="radio" name="hero-speed" checked={seconds === s.seconds} onChange={() => setSeconds(s.seconds)} className="sr-only" />
                  {s.label} <span className="ml-1.5 text-xs opacity-70">{s.seconds}s</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-border p-3">
            <span>
              <span className="block text-sm font-medium">Show the photo slideshow</span>
              <span className="text-xs text-muted">Switch off to go back to the plain burgundy background.</span>
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
        <div className="relative isolate flex h-72 items-center justify-center overflow-hidden rounded-2xl bg-accent px-5">
          {enabled && slides.length > 0 && <HeroSlidesView key={previewKey} slides={slides} tint={tint} seconds={seconds} />}
          <div className="relative w-full max-w-[16rem] rounded-2xl border border-white/20 bg-white/10 p-4 text-cream backdrop-blur-md">
            <p className="text-[10px] uppercase tracking-[0.25em] text-gold">New season</p>
            <p className="mt-1 font-display text-2xl leading-tight">Dresses, shoes and bags</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">
          {!enabled
            ? "The slideshow is switched off, so the home page shows the plain burgundy background."
            : slides.length === 0
              ? "Add at least one photo to see it here."
              : "Your headline panel and the sale card sit on top of the photos, as in this preview. Check that the text is easy to read."}
        </p>
      </aside>
    </div>
  );
}
