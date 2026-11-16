"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/toast";
import { saveSale } from "@/lib/actions/sales";
import { formatPrice } from "@/lib/format";
import { discountedPrice } from "@/lib/pricing";

type Cat = { id: string; name: string };
export type SaleData = {
  id: string;
  name: string;
  percent_off: number;
  scope: "all" | "categories";
  category_ids: string[];
  starts_at: string | null;
  ends_at: string | null;
  enabled: boolean;
  banner_text: string;
};

const pad = (n: number) => String(n).padStart(2, "0");
const toInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const toIso = (v: string) => (v ? new Date(v).toISOString() : null);
const PRESETS = [10, 20, 30, 40, 50, 70];

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <h2 className="font-display text-2xl font-medium">{title}</h2>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export default function SaleForm({ categories, sale }: { categories: Cat[]; sale?: SaleData }) {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState(sale?.name ?? "");
  const [percent, setPercent] = useState(sale ? String(sale.percent_off) : "");
  const [scope, setScope] = useState<"all" | "categories">(sale?.scope ?? "all");
  const [categoryIds, setCategoryIds] = useState<string[]>(sale?.category_ids ?? []);
  const [startsAt, setStartsAt] = useState(toInput(sale?.starts_at ?? null));
  const [endsAt, setEndsAt] = useState(toInput(sale?.ends_at ?? null));
  const [banner, setBanner] = useState(sale?.banner_text ?? "");
  const [enabled, setEnabled] = useState(sale?.enabled ?? true);
  const [saving, setSaving] = useState(false);

  const pct = Number(percent);
  const validPct = percent.trim() !== "" && Number.isInteger(pct) && pct >= 1 && pct <= 90;
  const sample = 20000; // GHS 200.00

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validPct) {
      toast.error("Enter a discount between 1% and 90%.");
      return;
    }
    if (scope === "categories" && categoryIds.length === 0) {
      toast.error("Pick at least one category, or choose Everything.");
      return;
    }
    setSaving(true);
    const res = await saveSale({
      id: sale?.id,
      name,
      percentOff: pct,
      scope,
      categoryIds: scope === "categories" ? categoryIds : [],
      startsAt: toIso(startsAt),
      endsAt: toIso(endsAt),
      bannerText: banner,
      enabled,
    });
    if (res.ok) {
      toast.success(sale ? "Sale saved" : "Sale created");
      router.push("/admin/sales");
      router.refresh();
      return;
    }
    toast.error(res.error);
    setSaving(false);
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      <Card title="Name your sale">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Sale name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={60} placeholder="e.g. Black Friday" className="field" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">
            Banner message <span className="font-normal text-muted">(optional)</span>
          </span>
          <input
            value={banner}
            onChange={(e) => setBanner(e.target.value)}
            maxLength={120}
            placeholder="e.g. Black Friday: 40% off everything this weekend!"
            className="field"
          />
          <span className="mt-1 block text-xs text-muted">Shown across the top of the shop. If you leave it empty we write one for you.</span>
        </label>
      </Card>

      <Card title="How big is the discount?">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Percent off</span>
            <div className="relative">
              <input value={percent} onChange={(e) => setPercent(e.target.value)} inputMode="numeric" required placeholder="40" className="field w-32 pr-8" />
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted">
                %
              </span>
            </div>
          </label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Quick discounts">
            {PRESETS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setPercent(String(q))}
                className={`rounded-full border px-3.5 py-2 text-sm transition ${pct === q ? "border-accent bg-accent text-white" : "border-border hover:border-accent"}`}
              >
                {q}%
              </button>
            ))}
          </div>
        </div>
        <p aria-live="polite" className="rounded-xl bg-cream p-3 text-sm">
          {validPct ? (
            <>
              Example: a <strong>{formatPrice(sample)}</strong> item sells for <strong>{formatPrice(discountedPrice(sample, pct))}</strong>.
            </>
          ) : (
            <span className="text-muted">Enter a percentage from 1 to 90 to see an example.</span>
          )}
        </p>
        <p className="text-xs text-muted">If a product has its own discount too, customers get the bigger of the two. They don’t add up.</p>
      </Card>

      <Card title="What is included?">
        <fieldset className="space-y-2">
          <legend className="sr-only">Applies to</legend>
          {(
            [
              ["all", "Everything in the shop"],
              ["categories", "Only some categories"],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition ${scope === value ? "border-accent bg-accent/5" : "border-border"}`}
            >
              <input type="radio" name="scope" checked={scope === value} onChange={() => setScope(value)} className="h-4 w-4 accent-[var(--accent)]" />
              {label}
            </label>
          ))}
        </fieldset>
        {scope === "categories" && (
          <fieldset className="grid gap-2 sm:grid-cols-2">
            <legend className="mb-2 text-sm font-medium">Choose categories</legend>
            {categories.map((c) => (
              <label key={c.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 text-sm">
                <input
                  type="checkbox"
                  checked={categoryIds.includes(c.id)}
                  onChange={(e) => setCategoryIds((prev) => (e.target.checked ? [...prev, c.id] : prev.filter((x) => x !== c.id)))}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                {c.name}
              </label>
            ))}
          </fieldset>
        )}
      </Card>

      <Card title="When does it run?" hint="Leave the start empty to begin as soon as the sale is on. Leave the end empty to run until you switch it off.">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Starts</span>
            <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="field" />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Ends</span>
            <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className="field" />
          </label>
        </div>
        <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-border p-3">
          <span>
            <span className="block text-sm font-medium">Sale is switched on</span>
            <span className="text-xs text-muted">Switch off to pause it at any time without deleting it.</span>
          </span>
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="mt-1 h-5 w-5 accent-[var(--accent)]" />
        </label>
      </Card>

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving…" : sale ? "Save sale" : "Create sale"}
        </button>
        <button type="button" onClick={() => router.push("/admin/sales")} className="btn-outline">
          Cancel
        </button>
      </div>
    </form>
  );
}
