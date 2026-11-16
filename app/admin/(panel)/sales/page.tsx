import Link from "next/link";
import ActionButton from "@/components/admin/action-button";
import PageHeader from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/admin";
import { deleteSale, setSaleEnabled } from "@/lib/actions/sales";

export const metadata = { title: "Sales" };

type Sale = {
  id: string;
  name: string;
  percent_off: number;
  scope: "all" | "categories";
  category_ids: string[];
  starts_at: string | null;
  ends_at: string | null;
  enabled: boolean;
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Accra" });

function statusOf(s: Sale): "Live" | "Scheduled" | "Ended" | "Off" {
  const now = Date.now();
  if (!s.enabled) return "Off";
  if (s.starts_at && Date.parse(s.starts_at) > now) return "Scheduled";
  if (s.ends_at && Date.parse(s.ends_at) <= now) return "Ended";
  return "Live";
}

const BADGE: Record<string, string> = {
  Live: "bg-emerald-100 text-emerald-800",
  Scheduled: "bg-sky-100 text-sky-800",
  Ended: "bg-stone-200 text-stone-600",
  Off: "bg-amber-100 text-amber-800",
};

export default async function SalesPage() {
  const { supabase } = await requireAdmin();
  const [{ data: salesData }, { data: catData }] = await Promise.all([
    supabase.from("sales").select("id,name,percent_off,scope,category_ids,starts_at,ends_at,enabled").order("created_at", { ascending: false }),
    supabase.from("categories").select("id,name"),
  ]);
  const sales = (salesData ?? []) as Sale[];
  const catName = new Map((catData ?? []).map((c) => [c.id as string, c.name as string]));

  const quiet = "text-sm text-muted underline underline-offset-4 transition hover:text-foreground disabled:opacity-50";

  return (
    <div>
      <PageHeader
        title="Sales"
        description="Run a sale with a big discount for a few days, or all year. The shop shows a banner and a countdown while it is live."
        actions={
          <Link href="/admin/sales/new" className="btn-primary">
            + New sale
          </Link>
        }
      />

      {sales.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="font-display text-2xl">No sales yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">Create your first sale, for example “Weekend Flash Sale, 40% off everything”.</p>
          <Link href="/admin/sales/new" className="btn-primary mt-6">
            Create a sale
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {sales.map((s) => {
            const status = statusOf(s);
            const applies =
              s.scope === "all"
                ? "Everything in the shop"
                : s.category_ids.map((id) => catName.get(id)).filter(Boolean).join(", ") || "Selected categories";
            return (
              <li key={s.id} className="rounded-2xl border border-border bg-surface p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-display text-2xl font-medium">{s.name}</h2>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${BADGE[status]}`}>{status}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {s.percent_off}% off · {applies}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {s.starts_at ? `Starts ${fmt(s.starts_at)}` : "Starts when switched on"} ·{" "}
                      {s.ends_at ? `Ends ${fmt(s.ends_at)}` : "No end date"}
                    </p>
                  </div>
                  <p className="font-display text-4xl font-medium text-accent">−{s.percent_off}%</p>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-border pt-4">
                  <Link href={`/admin/sales/${s.id}`} className="text-sm text-accent underline underline-offset-4">
                    Edit<span className="sr-only"> {s.name}</span>
                  </Link>
                  <ActionButton
                    action={setSaleEnabled.bind(null, s.id, !s.enabled)}
                    successMessage={s.enabled ? "Sale switched off" : "Sale switched on"}
                    className={quiet}
                  >
                    {s.enabled ? "Switch off" : "Switch on"}
                    <span className="sr-only"> {s.name}</span>
                  </ActionButton>
                  <ActionButton
                    action={deleteSale.bind(null, s.id)}
                    confirm={`Delete the sale "${s.name}"? Prices go back to normal.`}
                    successMessage="Sale deleted"
                    className="text-sm text-muted underline underline-offset-4 transition hover:text-red-600 disabled:opacity-50"
                  >
                    Delete<span className="sr-only"> {s.name}</span>
                  </ActionButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
