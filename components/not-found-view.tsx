import Link from "next/link";

export default function NotFoundView() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-xs uppercase tracking-[0.25em] text-muted">Error 404</p>
      <h1 className="mt-3 font-display text-4xl">We couldn&apos;t find that page</h1>
      <p className="mt-3 text-sm text-muted">It may have moved, or the product might no longer be available.</p>
      <Link
        href="/shop"
        className="mt-8 inline-block rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
      >
        Browse the shop
      </Link>
    </div>
  );
}
