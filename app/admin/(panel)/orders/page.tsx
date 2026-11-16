import Link from "next/link";
import PageHeader from "@/components/admin/page-header";
import StatusBadge from "@/components/admin/status-badge";
import { requireAdmin } from "@/lib/admin";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Orders" };

const STATUSES = ["all", "pending", "paid", "processing", "completed", "cancelled"] as const;
const METHODS = [
  { key: "all", label: "All payments" },
  { key: "paystack", label: "Online" },
  { key: "momo", label: "MoMo" },
] as const;
const PAGE_SIZE = 25;

type Search = { status?: string; method?: string; q?: string; page?: string; attention?: string };
type Row = {
  id: string;
  reference: string;
  customer_name: string;
  phone: string;
  total_pesewas: number;
  status: string;
  payment_method: string;
  created_at: string;
};

const METHOD_LABEL: Record<string, string> = { paystack: "Online", momo: "MoMo", pay_on_delivery: "On delivery" };
const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Accra" });

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const status = STATUSES.find((s) => s === sp.status) ?? "all";
  const method = METHODS.find((m) => m.key === sp.method)?.key ?? "all";
  const attention = sp.attention === "1";
  const q = (sp.q ?? "").replace(/[,()%*\\]/g, " ").trim().slice(0, 60);
  const phoneQ = q.replace(/\s+/g, "");
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;

  const { supabase } = await requireAdmin();

  let query = supabase
    .from("orders")
    .select("id,reference,customer_name,phone,total_pesewas,status,payment_method,created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (attention) query = query.or("status.eq.paid,and(status.eq.pending,payment_method.in.(momo,pay_on_delivery))");
  else if (status !== "all") query = query.eq("status", status);
  if (method !== "all") query = query.eq("payment_method", method);
  if (q) query = query.or(`reference.ilike.%${q}%,customer_name.ilike.%${q}%,phone.ilike.%${phoneQ || q}%`);

  const { data, count } = await query;
  const rows = (data ?? []) as Row[];
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const base: Record<string, string | undefined> = {
    status: status === "all" ? undefined : status,
    method: method === "all" ? undefined : method,
    q: q || undefined,
    attention: attention ? "1" : undefined,
  };
  const href = (next: Record<string, string | undefined> = {}) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...base, ...next })) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/admin/orders?${s}` : "/admin/orders";
  };

  const pill = (active: boolean) =>
    `inline-flex min-h-10 items-center rounded-full border px-4 text-sm capitalize transition ${
      active ? "border-accent bg-accent text-white" : "border-border bg-surface hover:border-accent"
    }`;

  return (
    <div>
      <PageHeader title="Orders" description="Search, filter and open any order." />

      <form action="/admin/orders" method="get" role="search" className="flex flex-wrap gap-2">
        {status !== "all" && <input type="hidden" name="status" value={status} />}
        {method !== "all" && <input type="hidden" name="method" value={method} />}
        {attention && <input type="hidden" name="attention" value="1" />}
        <label htmlFor="order-search" className="sr-only">
          Search orders
        </label>
        <input
          id="order-search"
          name="q"
          defaultValue={q}
          placeholder="Search by reference, name or phone"
          className="field max-w-md flex-1"
        />
        <button className="btn-primary">Search</button>
        {q && (
          <Link href={href({ q: undefined, page: undefined })} className="inline-flex min-h-11 items-center px-3 text-sm text-muted underline underline-offset-4">
            Clear
          </Link>
        )}
      </form>

      <div className="mt-5 space-y-3">
        <nav aria-label="Order status" className="flex flex-wrap gap-2">
          <Link href={href({ attention: "1", status: undefined, page: undefined })} aria-current={attention ? "page" : undefined} className={pill(attention)}>
            Needs attention
          </Link>
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={href({ status: s === "all" ? undefined : s, attention: undefined, page: undefined })}
              aria-current={!attention && status === s ? "page" : undefined}
              className={pill(!attention && status === s)}
            >
              {s}
            </Link>
          ))}
        </nav>
        <nav aria-label="Payment method" className="flex flex-wrap gap-2">
          {METHODS.map((m) => (
            <Link
              key={m.key}
              href={href({ method: m.key === "all" ? undefined : m.key, page: undefined })}
              aria-current={method === m.key ? "page" : undefined}
              className={pill(method === m.key)}
            >
              {m.label}
            </Link>
          ))}
        </nav>
      </div>

      <p aria-live="polite" className="mt-5 text-sm text-muted">
        {total} {total === 1 ? "order" : "orders"}
      </p>

      {rows.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted">No orders match these filters.</p>
      ) : (
        <>
          <div className="mt-4 hidden overflow-hidden rounded-2xl border border-border bg-surface md:block">
            <table className="w-full text-sm">
              <caption className="sr-only">Orders</caption>
              <thead className="bg-cream text-left text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">Order</th>
                  <th scope="col" className="px-5 py-3 font-medium">Customer</th>
                  <th scope="col" className="px-5 py-3 font-medium">Placed</th>
                  <th scope="col" className="px-5 py-3 font-medium">Payment</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Total</th>
                  <th scope="col" className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((o) => (
                  <tr key={o.id} className="transition hover:bg-background">
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/orders/${o.id}`} className="font-medium text-accent hover:underline">
                        {o.reference}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      {o.customer_name}
                      <span className="block text-xs text-muted">{o.phone}</span>
                    </td>
                    <td className="px-5 py-3.5 text-muted">{fmt(o.created_at)}</td>
                    <td className="px-5 py-3.5 text-muted">{METHOD_LABEL[o.payment_method] ?? o.payment_method}</td>
                    <td className="px-5 py-3.5 text-right font-medium">{formatPrice(o.total_pesewas)}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={o.status} method={o.payment_method} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-4 space-y-3 md:hidden">
            {rows.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="block rounded-2xl border border-border bg-surface p-4 transition hover:border-accent">
                  <span className="flex items-start justify-between gap-3">
                    <span className="font-medium">{o.reference}</span>
                    <StatusBadge status={o.status} method={o.payment_method} />
                  </span>
                  <span className="mt-1 block text-sm">{o.customer_name}</span>
                  <span className="mt-2 flex items-center justify-between text-xs text-muted">
                    <span>
                      {fmt(o.created_at)} · {METHOD_LABEL[o.payment_method] ?? o.payment_method}
                    </span>
                    <span className="text-sm font-medium text-foreground">{formatPrice(o.total_pesewas)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={href({ page: page > 2 ? String(page - 1) : undefined })} className="btn-outline">
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={href({ page: String(page + 1) })} className="btn-outline">
              Older →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
