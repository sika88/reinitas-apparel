import Link from "next/link";
import { notFound } from "next/navigation";
import ConfirmButton from "@/components/admin/confirm-button";
import StatusBadge from "@/components/admin/status-badge";
import { requireAdmin } from "@/lib/admin";
import { cancelOrder, updateOrderStatus } from "@/lib/actions/orders";
import { formatPrice, waLink } from "@/lib/format";
import { toInternational } from "@/lib/phone";
import { getSettings } from "@/lib/queries";

export const metadata = { title: "Order" };

type Line = { id: string; product_name: string; size: string; quantity: number; unit_price_pesewas: number };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { supabase } = await requireAdmin();
  const { data: order } = await supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
  if (!order) notFound();
  const settings = await getSettings();

  const lines = order.order_items as Line[];
  const onlinePending = order.status === "pending" && order.payment_method === "paystack";
  const canProgress =
    order.status === "paid" || order.status === "processing" || (order.status === "pending" && order.payment_method === "pay_on_delivery");
  const canCancel = order.status !== "cancelled" && order.status !== "completed";
  const wasPaidOnline = order.payment_method === "paystack" && ["paid", "processing"].includes(order.status);

  const btn = "rounded-full px-5 py-2.5 text-sm font-medium transition";

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/admin/orders" className="text-sm text-muted transition hover:text-foreground">
        ← All orders
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl">{order.reference}</h1>
        <StatusBadge status={order.status} />
      </div>

      <section className="rounded-2xl border border-border bg-surface p-5 text-sm">
        <h2 className="mb-3 font-display text-xl">Items</h2>
        <ul className="divide-y divide-border">
          {lines.map((l) => (
            <li key={l.id} className="flex justify-between gap-3 py-2.5">
              <span>
                {l.product_name}
                {l.size !== "One size" && <span className="text-muted"> · {l.size}</span>}
                <span className="text-muted"> × {l.quantity}</span>
              </span>
              <span>{formatPrice(l.unit_price_pesewas * l.quantity)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex justify-between border-t border-border pt-3 font-medium">
          <span>Total</span>
          <span>{formatPrice(order.total_pesewas)}</span>
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 text-sm">
        <h2 className="mb-3 font-display text-xl">Customer</h2>
        <p className="font-medium">{order.customer_name}</p>
        <p className="text-muted">
          {order.address}, {order.city}
        </p>
        {order.email && <p className="text-muted">{order.email}</p>}
        {order.notes && <p className="mt-2 rounded-lg bg-background p-3">Note: {order.notes}</p>}
        <div className="mt-4 flex flex-wrap gap-3">
          <a href={`tel:${order.phone}`} className="rounded-full border border-border px-4 py-2 transition hover:border-accent">
            Call {order.phone}
          </a>
          <a
            href={waLink(
              toInternational(order.phone),
              `Hello ${order.customer_name}, this is ${settings.business_name} about your order ${order.reference}.`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-border px-4 py-2 transition hover:border-accent"
          >
            WhatsApp customer
          </a>
        </div>
        <p className="mt-4 text-xs text-muted">
          {order.payment_method === "paystack" ? "Online payment (Paystack)" : "Pay on delivery"}
          {order.paid_at &&
            ` · paid ${new Date(order.paid_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Accra" })}`}
        </p>
      </section>

      {onlinePending && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Waiting for the customer to pay online. The order turns to Paid automatically once Paystack confirms. Cancel it if the customer
          abandoned checkout, and the stock goes back on sale.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        {canProgress && order.status !== "processing" && (
          <form action={updateOrderStatus.bind(null, order.id, "processing")}>
            <button className={`${btn} bg-accent text-white hover:opacity-90`}>Mark as processing</button>
          </form>
        )}
        {canProgress && (
          <form action={updateOrderStatus.bind(null, order.id, "completed")}>
            <button className={`${btn} border border-border bg-surface hover:border-accent`}>Mark as completed</button>
          </form>
        )}
        {canCancel && (
          <form action={cancelOrder.bind(null, order.id)}>
            <ConfirmButton
              message={
                wasPaidOnline
                  ? "Cancel this order? The stock goes back on sale. The customer already paid online, so remember to refund them in Paystack."
                  : "Cancel this order? The stock goes back on sale."
              }
              className={`${btn} border border-red-300 text-red-700 hover:bg-red-50`}
            >
              Cancel order
            </ConfirmButton>
          </form>
        )}
      </div>
    </div>
  );
}
