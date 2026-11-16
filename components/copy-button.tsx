"use client";

import { useState } from "react";

export default function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {}
      }}
      className="rounded-full border border-border bg-surface px-3 py-1 text-xs transition hover:border-accent"
    >
      <span aria-live="polite">{copied ? "Copied" : label}</span>
      <span className="sr-only"> {value}</span>
    </button>
  );
}
