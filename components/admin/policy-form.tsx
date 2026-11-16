"use client";

import { useState, useTransition } from "react";
import { resetPolicy, savePolicy } from "@/lib/actions/policies";
import { useToast } from "@/components/admin/toast";

export default function PolicyForm({
  slug,
  title,
  initialBody,
  defaultBody,
  isCustom,
}: {
  slug: string;
  title: string;
  initialBody: string;
  defaultBody: string;
  isCustom: boolean;
}) {
  const [body, setBody] = useState(initialBody);
  const [custom, setCustom] = useState(isCustom);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const toast = useToast();

  function save() {
    setMsg(null);
    start(async () => {
      const r = await savePolicy(slug, body);
      if (r.ok) {
        setCustom(true);
        toast.success("Saved. The page is live.");
      } else setMsg({ ok: false, text: r.error });
    });
  }

  function reset() {
    if (!window.confirm("Replace this page with the original text? Your edits will be lost.")) return;
    setMsg(null);
    start(async () => {
      const r = await resetPolicy(slug);
      if (r.ok) {
        setBody(defaultBody);
        setCustom(false);
        toast.success("Restored the original text.");
      } else setMsg({ ok: false, text: r.error });
    });
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-medium">{title}</h2>
          <p className="text-xs text-muted">{custom ? "Edited by you" : "Original text"}</p>
        </div>
        <a href={`/${slug}`} target="_blank" rel="noopener noreferrer" className="text-sm text-accent underline underline-offset-4">
          View page
        </a>
      </div>

      <label htmlFor={`body-${slug}`} className="sr-only">
        Text of {title}
      </label>
      <textarea
        id={`body-${slug}`}
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          setMsg(null);
        }}
        rows={18}
        className="field mt-4 font-mono text-[13px] leading-6"
      />

      <details className="mt-3 text-sm text-muted">
        <summary className="cursor-pointer">How to format the text</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <code>## Heading</code> makes a heading.
          </li>
          <li>Leave a blank line between paragraphs.</li>
          <li>
            Start lines with <code>- </code> for a bullet list.
          </li>
          <li>
            <code>[text](/privacy)</code> links to a page on your site.
          </li>
          <li>
            <code>{"{business}"}</code> becomes your business name, and <code>{"[text]({whatsapp})"}</code> links to your WhatsApp.
          </li>
        </ul>
      </details>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={save} disabled={pending} className="btn-primary">
          {pending ? "Saving…" : "Save"}
        </button>
        {custom && (
          <button type="button" onClick={reset} disabled={pending} className="text-sm text-muted underline underline-offset-4 transition hover:text-red-600">
            Restore original text
          </button>
        )}
        {msg && (
          <p role="status" className={`text-sm ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>
            {msg.text}
          </p>
        )}
      </div>
    </section>
  );
}
