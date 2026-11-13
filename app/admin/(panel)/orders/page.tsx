import Link from "next/link";
import StatusBadge from "@/components/admin/status-badge";
import { requireAdmin } from "@/lib/admin";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Orders" };

const FILTERS = ["all", "pending", "paid", "processing", "completed", "cancelled"] as const;

type Row = {
  id: string;
  reference: string;
  customer_name: string;
  total_pesewas: number;
  status: string;
  payment_method: string;
  created_at: string;
};

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const filter = FILTERS.find((f) => f === status) ?? "all";
  const { supabase } = await requireAdmin();

  let query = supabase
    .from("orders")
    .select("id,reference,customer_name,total_pesewas,status,payment_method,created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (filter !== "all") query = query.eq("status", filter);

  const { data } = await query;
  const rows = (data ?? []) as Row[];

  return (
    <div>
      <h1 className="font-display text-3xl">Orders</h1>

      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "all" ? "/admin/orders" : `/admin/orders?status=${f}`}
            className={`rounded-full border px-4 py-1.5 text-sm capitalize transition ${
              f === filter ? "border-accent bg-accent text-white" : "border-border bg-surface hover:border-accent"
            }`}
          >
            {f}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="mt-10 text-sm text-muted">No orders here.</p>
      ) : (
        <ul className="mt-6 divide-y divide-border rounded-2xl border border-border bg-surface">
          {rows.map((o) => (
            <li key={o.id}>
              <Link href={`/admin/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-3 p-4 transition hover:bg-background">
                <span>
                  <span className="font-medium">{o.reference}</span>
                  <span className="block text-xs text-muted">
                    {o.customer_name} ·{" "}
                    {new Date(o.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Accra" })}
                  </span>
                </span>
                <span className="flex items-center gap-3 text-sm">
                  <span className="text-xs text-muted">{o.payment_method === "paystack" ? "Online" : "On delivery"}</span>
                  {formatPrice(o.total_pesewas)}
                  <StatusBadge status={o.status} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
