import Link from "next/link";
import StatusBadge from "@/components/admin/status-badge";
import { requireAdmin } from "@/lib/admin";
import { formatPrice } from "@/lib/format";

type Recent = { id: string; reference: string; customer_name: string; total_pesewas: number; status: string };
type Low = { id: string; size: string; stock: number; product: { name: string } | null };

export default async function Dashboard() {
  const { supabase } = await requireAdmin();
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

  const [toFulfil, products, revenue, recent, low] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .or("status.in.(paid,processing),and(status.eq.pending,payment_method.eq.pay_on_delivery)"),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("active", true),
    supabase.from("orders").select("total_pesewas").in("status", ["paid", "processing", "completed"]).gte("created_at", since),
    supabase.from("orders").select("id,reference,customer_name,total_pesewas,status").order("created_at", { ascending: false }).limit(5),
    supabase.from("product_variants").select("id,size,stock,product:products(name)").lte("stock", 2).order("stock").limit(8),
  ]);

  const revenueTotal = (revenue.data ?? []).reduce((sum, o) => sum + (o.total_pesewas as number), 0);
  const recentOrders = (recent.data ?? []) as unknown as Recent[];
  const lowStock = (low.data ?? []) as unknown as Low[];

  const stats = [
    { label: "Orders to fulfil", value: String(toFulfil.count ?? 0), href: "/admin/orders" },
    { label: "Sales, last 30 days", value: formatPrice(revenueTotal), href: "/admin/orders" },
    { label: "Active products", value: String(products.count ?? 0), href: "/admin/products" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-2xl border border-border bg-surface p-5 transition hover:border-accent">
            <p className="text-sm text-muted">{s.label}</p>
            <p className="mt-2 text-2xl font-medium">{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm text-accent hover:underline">View all</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {recentOrders.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-accent">
                    <span>
                      <span className="font-medium">{o.reference}</span>
                      <span className="block text-xs text-muted">{o.customer_name}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      {formatPrice(o.total_pesewas)}
                      <StatusBadge status={o.status} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-3 font-display text-xl">Low or sold-out sizes</h2>
          {lowStock.length === 0 ? (
            <p className="text-sm text-muted">Everything is well stocked.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {lowStock.map((v) => (
                <li key={v.id} className="flex justify-between py-3">
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
    </div>
  );
}
