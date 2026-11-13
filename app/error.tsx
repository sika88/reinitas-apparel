"use client";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-xs uppercase tracking-[0.25em] text-muted">Something went wrong</p>
      <h1 className="mt-3 font-display text-4xl">Sorry, that didn&apos;t work</h1>
      <p className="mt-3 text-sm text-muted">Please try again. If it keeps happening, message us on WhatsApp.</p>
      {error.digest && <p className="mt-2 text-xs text-muted">Reference: {error.digest}</p>}
      <button
        onClick={reset}
        className="mt-8 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}
