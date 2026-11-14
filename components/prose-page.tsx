export default function ProsePage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="eyebrow">Information</p>
      <h1 className="mt-3 font-display text-4xl font-medium sm:text-5xl">{title}</h1>
      <p className="mt-2 text-sm text-muted">Last updated {updated}</p>
      <div className="prose-lite mt-8">{children}</div>
    </article>
  );
}
