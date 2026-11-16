import Link from "next/link";
import PageHeader from "@/components/admin/page-header";
import SalesChart from "@/components/admin/sales-chart";
import StatusBadge from "@/components/admin/status-badge";
import { requireAdmin } from "@/lib/admin";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Dashboard" };

type Recent = { id: string; reference: string; customer_name: string; total_pesewas: number; status: string; payment_method: string; created_at: string };
type Slim = { id: string; created_at: string; total_pesewas: number; status: string; payment_method: string };
type Low = { id: string; size: string; stock: number; product: { name: string } | null };

const DAY = 24 * 3600 * 1000;
const COUNTED = ["paid", "processing", "completed"];

function Stat({ label, value, note, href }: { label: string; value: string; note?: string; href?: string }) {
  const body = (
    <>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 font-display text-4xl font-medium leading-none">{value}</p>
      {note && <p className="mt-2 text-xs text-muted">{note}</p>}
    </>
  );
  const cls = "block rounded-2xl border border-border bg-surface p-5";
  return href ? (
    <Link href={href} className={`${cls} transition hover:border-accent`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export default async function Dashboard() {
  const { supabase } = await requireAdmin();
  const since = new Date(Date.now() - 30 * DAY).toISOString();

  const [ordersRes, recentRes, lowRes, productsRes, siteRes, privRes] = await Promise.all([
    supabase
      .from("orders")
      .select("id,created_at,total_pesewas,status,payment_method")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase
      .from("orders")
      .select("id,reference,customer_name,total_pesewas,status,payment_method,created_at")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase.from("product_variants").select("id,size,stock,product:products(name)").lte("stock", 2).order("stock").limit(8),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("active", true),
    supabase.from("site_settings").select("logo_url,whatsapp_number,momo_number").eq("id", 1).maybeSingle(),
    supabase.from("private_settings").select("admin_phone").eq("id", 1).maybeSingle(),
  ]);

  const orders = (ordersRes.data ?? []) as Slim[];
  const recent = (recentRes.data ?? []) as Recent[];
  const lowStock = (lowRes.data ?? []) as unknown as Low[];

  const counted = orders.filter((o) => COUNTED.includes(o.status));
  const sales30 = counted.reduce((s, o) => s + o.total_pesewas, 0);
  const weekAgo = Date.now() - 7 * DAY;
  const ordersThisWeek = orders.filter((o) => o.status !== "cancelled" && new Date(o.created_at).getTime() >= weekAgo).length;
  const momoWaiting = orders.filter((o) => o.status === "pending" && o.payment_method === "momo");
  const momoTotal = momoWaiting.reduce((s, o) => s + o.total_pesewas, 0);
  const attention = orders.filter(
    (o) => o.status === "paid" || (o.status === "pending" && (o.payment_method === "momo" || o.payment_method === "pay_on_delivery")),
  ).length;

  // 14-day chart (Ghana is on UTC all year, so UTC dates are Ghana dates)
  const days = Array.from({ length: 14 }, (_, i) => new Date(Date.now() - (13 - i) * DAY).toISOString().slice(0, 10));
  const byDay = new Map(days.map((d) => [d, { date: d, total: 0, orders: 0 }]));
  for (const o of counted) {
    const bucket = byDay.get(o.created_at.slice(0, 10));
    if (bucket) {
      bucket.total += o.total_pesewas;
      bucket.orders += 1;
    }
  }
  const chart = days.map((d) => byDay.get(d)!);

  const site = siteRes.data;
  const setup = [
    { done: Boolean(site?.logo_url), label: "Upload your logo", href: "/admin/settings" },
    { done: Boolean(site?.momo_number), label: "Add your MoMo number and account name", href: "/admin/settings" },
    { done: Boolean(site?.whatsapp_number), label: "Add your WhatsApp number", href: "/admin/settings" },
    { done: Boolean(privRes.data?.admin_phone), label: "Add the phone number for order SMS alerts", href: "/admin/settings" },
    { done: (productsRes.count ?? 0) > 0, label: "Add your first product", href: "/admin/products/new" },
  ];
  const todo = setup.filter((s) => !s.done);

  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Accra" });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={today}
        actions={
          <Link href="/admin/products/new" className="btn-primary">
            + New product
          </Link>
        }
      />

      {todo.length > 0 && (
        <section aria-labelledby="setup-heading" className="rounded-2xl border border-gold/50 bg-gold/10 p-5">
          <h2 id="setup-heading" className="font-display text-2xl font-medium">
            Finish setting up
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {setup.map((s) => (
              <li key={s.label} className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${s.done ? "border-emerald-600 bg-emerald-600 text-white" : "border-border bg-surface"}`}
                >
                  {s.done && "✓"}
                </span>
                {s.done ? (
                  <span className="text-muted line-through">{s.label}</span>
                ) : (
                  <Link href={s.href} className="text-accent underline underline-offset-4">
                    {s.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {momoWaiting.length > 0 && (
        <Link
          href="/admin/orders?status=pending&method=momo"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-900 transition hover:border-amber-400"
        >
          <span>
            <span className="block font-display text-2xl font-medium">
              {momoWaiting.length} MoMo {momoWaiting.length === 1 ? "payment" : "payments"} awaiting confirmation
            </span>
            <span className="mt-1 block text-sm">{formatPrice(momoTotal)} in total. Check your MoMo statement, then confirm each order.</span>
          </span>
          <span className="rounded-full bg-amber-900 px-4 py-2 text-sm text-white">Review</span>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Sales, last 30 days" value={formatPrice(sales30)} note={`${counted.length} paid ${counted.length === 1 ? "order" : "orders"}`} />
        <Stat label="Orders this week" value={String(ordersThisWeek)} href="/admin/orders" />
        <Stat label="Needs your attention" value={String(attention)} note="Paid or MoMo orders to action" href="/admin/orders?attention=1" />
        <Stat label="Active products" value={String(productsRes.count ?? 0)} href="/admin/products" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section aria-labelledby="sales-heading" className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <h2 id="sales-heading" className="mb-4 font-display text-2xl font-medium">
            Sales
          </h2>
          <SalesChart data={chart} />
        </section>

        <section aria-labelledby="stock-heading" className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <h2 id="stock-heading" className="mb-3 font-display text-2xl font-medium">
            Low or sold-out sizes
          </h2>
          {lowStock.length === 0 ? (
            <p className="text-sm text-muted">Everything is well stocked.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {lowStock.map((v) => (
                <li key={v.id} className="flex justify-between gap-3 py-3">
                  <span>
                    {v.product?.name ?? "Product"}
                    {v.size !== "One size" && <span className="text-muted"> · {v.size}</span>}
                  </span>
                  <span className={v.stock === 0 ? "font-medium text-red-600" : "text-amber-700"}>
                    {v.stock === 0 ? "Sold out" : `${v.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section aria-labelledby="recent-heading" className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="recent-heading" className="font-display text-2xl font-medium">
            Recent orders
          </h2>
          <Link href="/admin/orders" className="text-sm text-accent underline underline-offset-4">
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-muted">No orders yet. They will show up here as soon as customers start ordering.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {recent.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3 transition hover:text-accent">
                  <span>
                    <span className="font-medium">{o.reference}</span>
                    <span className="block text-xs text-muted">{o.customer_name}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    {formatPrice(o.total_pesewas)}
                    <StatusBadge status={o.status} method={o.payment_method} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
