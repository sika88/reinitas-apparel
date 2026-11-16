import Link from "next/link";

export default function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-8">
      {back && (
        <Link href={back.href} className="mb-3 inline-block text-sm text-muted transition hover:text-foreground">
          ← {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-medium">{title}</h1>
          {description && <p className="mt-1.5 max-w-xl text-sm text-muted">{description}</p>}
        </div>
        {actions}
      </div>
    </div>
  );
}
