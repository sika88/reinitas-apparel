"use client";

import { useState } from "react";
import { saveSettings } from "@/lib/actions/settings";
import { uploadImage } from "@/lib/upload";

type Initial = {
  business_name: string;
  tagline: string;
  whatsapp_number: string;
  admin_phone: string;
  logo_url: string | null;
  hero_image_url: string | null;
};

const field =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20";

function ImageField({
  label,
  hint,
  value,
  onChange,
  onError,
}: {
  label: string;
  hint: string;
  value: string | null;
  onChange: (url: string | null) => void;
  onError: (msg: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function pick(files: FileList | null, input: HTMLInputElement) {
    const f = files?.[0];
    if (!f) return;
    setBusy(true);
    try {
      onChange(await uploadImage(f, "branding"));
    } catch (e) {
      onError(e instanceof Error ? e.message : "Upload failed.");
    }
    input.value = "";
    setBusy(false);
  }

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted">{hint}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-36 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-xs text-muted">None</span>
          )}
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <label className="cursor-pointer rounded-lg border border-border px-3 py-1.5 transition hover:border-accent">
            {busy ? "Uploading…" : value ? "Replace" : "Upload"}
            <input type="file" accept="image/*" className="hidden" disabled={busy} onChange={(e) => pick(e.target.files, e.target)} />
          </label>
          {value && (
            <button type="button" onClick={() => onChange(null)} className="text-left text-muted transition hover:text-red-600">
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SettingsForm({ initial }: { initial: Initial }) {
  const [v, setV] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof Initial>(key: K, value: Initial[K]) => {
    setSaved(false);
    setV((p) => ({ ...p, [key]: value }));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    const res = await saveSettings(v);
    if (res.ok) setSaved(true);
    else setError(res.error);
    setSaving(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section className="space-y-4 rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-display text-xl">Brand</h2>
        <ImageField
          label="Logo"
          hint="Shown in the shop header and footer. Use a wide (horizontal) logo on a transparent background, for example reinitas-logo-horizontal.png."
          value={v.logo_url}
          onChange={(u) => set("logo_url", u)}
          onError={setError}
        />
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Business name</span>
          <input value={v.business_name} onChange={(e) => set("business_name", e.target.value)} required minLength={2} maxLength={80} className={field} />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Tagline</span>
          <input
            value={v.tagline}
            onChange={(e) => set("tagline", e.target.value)}
            maxLength={160}
            placeholder="Shown as the headline on the home page"
            className={field}
          />
        </label>
        <ImageField
          label="Home page banner"
          hint="Optional background photo for the top of the home page."
          value={v.hero_image_url}
          onChange={(u) => set("hero_image_url", u)}
          onError={setError}
        />
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-display text-xl">Contact and alerts</h2>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">WhatsApp number for customers</span>
          <input value={v.whatsapp_number} onChange={(e) => set("whatsapp_number", e.target.value)} placeholder="0241234567" className={field} />
          <span className="text-xs text-muted">Customers tap this to chat with you about a product or an order.</span>
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Phone number for order SMS alerts</span>
          <input value={v.admin_phone} onChange={(e) => set("admin_phone", e.target.value)} placeholder="0241234567" className={field} />
          <span className="text-xs text-muted">Only you can see this. A text is sent here for every new order.</span>
        </label>
      </section>

      {error && (
        <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {saved && <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Settings saved.</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
