"use client";

import { useState, useTransition } from "react";
import { useToast } from "@/components/admin/toast";
import TickerView from "@/components/ticker-view";
import { saveTicker } from "@/lib/actions/ticker";
import { parseTickerText, type TickerSpeed, type TickerStyle } from "@/lib/ticker-shared";

type Initial = { enabled: boolean; text: string; style: TickerStyle; speed: TickerSpeed };

const SALE_STARTER = "SALE\nSALE\nSALE\nBIG REDUCTIONS\nSALE\nSALE\nSALE";

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <h2 className="font-display text-2xl font-medium">{title}</h2>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export default function TickerForm({ initial, defaultItems }: { initial: Initial; defaultItems: string[] }) {
  const toast = useToast();
  const [enabled, setEnabled] = useState(initial.enabled);
  const [text, setText] = useState(initial.text);
  const [style, setStyle] = useState<TickerStyle>(initial.style);
  const [speed, setSpeed] = useState<TickerSpeed>(initial.speed);
  const [pending, start] = useTransition();

  const items = parseTickerText(text);
  const usingStandard = items.length === 0;
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const tooLong = lines.some((l) => l.length > 60);

  function save() {
    start(async () => {
      const r = await saveTicker({ enabled, text, style, speed });
      if (r.ok) toast.success("Banner saved. It’s live on the home page.");
      else toast.error(r.error);
    });
  }

  return (
    <div className="space-y-6">
      <Card title="Preview" hint="This is how the bar looks on the home page.">
        {enabled ? (
          <div className="overflow-hidden rounded-xl border border-border">
            <TickerView items={usingStandard ? defaultItems : items} style={style} speed={speed} />
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">The bar is switched off, so nothing shows on the home page.</p>
        )}
        {enabled && usingStandard && <p className="text-xs text-muted">Showing the standard words. Write your own below to replace them.</p>}
      </Card>

      <Card title="What should scroll?" hint="Write one phrase per line. They repeat one after another. Leave it empty to use the standard words.">
        <label htmlFor="ticker-text" className="sr-only">
          Phrases that scroll across the home page
        </label>
        <textarea
          id="ticker-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder={"SALE\nSALE\nSALE\nUP TO 40% OFF"}
          className="field font-mono text-sm leading-6"
        />
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <button
            type="button"
            onClick={() => {
              setText(SALE_STARTER);
              setStyle("sale");
            }}
            className="rounded-full border border-border px-4 py-2 transition hover:border-accent"
          >
            Sale starter
          </button>
          <button
            type="button"
            onClick={() => {
              setText("");
              setStyle("classic");
            }}
            className="rounded-full border border-border px-4 py-2 transition hover:border-accent"
          >
            Use the standard words
          </button>
          <span className={`ml-auto text-xs ${lines.length > 20 || tooLong ? "text-red-600" : "text-muted"}`}>
            {lines.length} of 20 lines{tooLong ? " · lines over 60 characters are cut short" : ""}
          </span>
        </div>
      </Card>

      <Card title="How it looks">
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Style</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["classic", "Classic", "Burgundy bar with gold italic words"],
                ["sale", "Sale", "Gold bar with bold capitals. Stands out more"],
              ] as const
            ).map(([value, title, hint]) => (
              <label
                key={value}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${style === value ? "border-accent bg-accent/5" : "border-border"}`}
              >
                <input type="radio" name="ticker-style" checked={style === value} onChange={() => setStyle(value)} className="mt-1 h-4 w-4 accent-[var(--accent)]" />
                <span className="text-sm">
                  <span className="block font-medium">{title}</span>
                  <span className="text-muted">{hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-medium">Speed</legend>
          <div className="flex flex-wrap gap-2">
            {(["slow", "normal", "fast"] as const).map((s) => (
              <label
                key={s}
                className={`inline-flex min-h-10 cursor-pointer items-center rounded-full border px-5 text-sm capitalize transition ${
                  speed === s ? "border-accent bg-accent text-white" : "border-border hover:border-accent"
                }`}
              >
                <input type="radio" name="ticker-speed" checked={speed === s} onChange={() => setSpeed(s)} className="sr-only" />
                {s}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-border p-3">
          <span>
            <span className="block text-sm font-medium">Show the scrolling bar</span>
            <span className="text-xs text-muted">Switch off to hide it completely from the home page.</span>
          </span>
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="mt-1 h-5 w-5 accent-[var(--accent)]" />
        </label>
      </Card>

      <button type="button" onClick={save} disabled={pending} className="btn-primary">
        {pending ? "Saving…" : "Save banner"}
      </button>
    </div>
  );
}
