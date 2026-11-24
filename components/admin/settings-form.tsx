"use client";

import { useState } from "react";
import { useToast } from "@/components/admin/toast";
import { saveSettings } from "@/lib/actions/settings";
import { uploadImage } from "@/lib/upload";

type Initial = {
  business_name: string;
  tagline: string;
  whatsapp_number: string;
  call_number: string;
  admin_phone: string;
  momo_number: string;
  momo_name: string;
  momo_network: string;
  logo_url: string | null;
  hero_image_url: string | null;
};

const NETWORKS = ["MTN MoMo", "Telecel Cash", "AirtelTigo Money"];
const field = "field";

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
        <div className="flex h-20 w-44 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
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
  const toast = useToast();
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
    if (res.ok) {
      setSaved(true);
      toast.success("Settings saved");
    } else setError(res.error);
    setSaving(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section className="space-y-4 rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-display text-2xl font-medium">Brand</h2>
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
          hint="Optional single photo. For a moving slideshow of several photos, use Hero photos in the sidebar."
          value={v.hero_image_url}
          onChange={(u) => set("hero_image_url", u)}
          onError={setError}
        />
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-surface p-5">
        <div>
          <h2 className="font-display text-2xl font-medium">Payments: MoMo</h2>
          <p className="mt-1 text-sm text-muted">
            Customers who choose “Pay with MoMo” see these details after they order, and send the payment to this account. You confirm each
            payment on the order page.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Network</span>
            <select value={v.momo_network} onChange={(e) => set("momo_network", e.target.value)} className={field}>
              {NETWORKS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">MoMo number</span>
            <input value={v.momo_number} onChange={(e) => set("momo_number", e.target.value)} inputMode="tel" placeholder="0241234567" className={field} />
          </label>
        </div>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Account name</span>
          <input
            value={v.momo_name}
            onChange={(e) => set("momo_name", e.target.value)}
            maxLength={80}
            placeholder="The name registered on the MoMo account"
            className={field}
          />
        </label>

        <div className="rounded-xl bg-cream p-4 text-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">What customers see</p>
          {v.momo_number ? (
            <p className="mt-2">
              Send the amount to <strong>{v.momo_number}</strong>
              {v.momo_name && <> ({v.momo_name})</>} on <strong>{v.momo_network}</strong>.
            </p>
          ) : (
            <p className="mt-2 text-muted">Add a number so customers know where to send their payment.</p>
          )}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-display text-2xl font-medium">Contact and alerts</h2>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">WhatsApp number for customers</span>
          <input value={v.whatsapp_number} onChange={(e) => set("whatsapp_number", e.target.value)} placeholder="0241234567" className={field} />
          <span className="text-xs text-muted">Customers tap this to chat with you about a product or an order.</span>
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Phone number for customers to call</span>
          <input value={v.call_number} onChange={(e) => set("call_number", e.target.value)} inputMode="tel" placeholder="0241234567" className={field} />
          <span className="text-xs text-muted">
            Shown as “Call us” at the top of every page of the shop. Customers tap it to call you. Leave it empty to hide it.
          </span>
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
      {saved && <p role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Settings saved.</p>}

      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
