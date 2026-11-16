import Link from "next/link";
import { notFound } from "next/navigation";
import ActionButton from "@/components/admin/action-button";
import StatusBadge from "@/components/admin/status-badge";
import { requireAdmin } from "@/lib/admin";
import { cancelOrder, reopenPaidOrder, updateOrderStatus } from "@/lib/actions/orders";
import { formatPrice, waLink } from "@/lib/format";
import { toInternational } from "@/lib/phone";
import { getSettings } from "@/lib/queries";

export const metadata = { title: "Order" };

type Line = { id: string; product_name: string; size: string; quantity: number; unit_price_pesewas: number };

const METHOD: Record<string, string> = {
  paystack: "Online payment (Paystack)",
  momo: "MoMo, sent directly to you",
  pay_on_delivery: "Pay on delivery (older order)",
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Accra" });

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { supabase } = await requireAdmin();
  const { data: order } = await supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
  if (!order) notFound();
  const settings = await getSettings();

  const lines = order.order_items as Line[];
  const awaitingMomo = order.status === "pending" && order.payment_method === "momo";
  const awaitingOnline = order.status === "pending" && order.payment_method === "paystack";
  const legacyCod = order.status === "pending" && order.payment_method === "pay_on_delivery";
  const canProcess = order.status === "paid" || legacyCod;
  const canComplete = order.status === "paid" || order.status === "processing" || legacyCod;
  const canCancel = order.status !== "cancelled" && order.status !== "completed";
  const reopenable = order.status === "cancelled" && order.payment_method === "momo";
  const wasPaid = ["paid", "processing"].includes(order.status) && order.payment_method !== "pay_on_delivery";

  const primary = "btn-primary";
  const secondary = "inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-surface px-6 py-3 text-sm font-medium transition hover:border-accent disabled:opacity-50";
  const danger = "inline-flex min-h-11 items-center justify-center rounded-full border border-red-300 px-6 py-3 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50";

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/admin/orders" className="text-sm text-muted transition hover:text-foreground">
        ← All orders
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-4xl font-medium">{order.reference}</h1>
        <StatusBadge status={order.status} method={order.payment_method} />
      </div>
      <p className="text-sm text-muted">
        Placed {fmt(order.created_at)} · {METHOD[order.payment_method] ?? order.payment_method}
        {order.paid_at && ` · paid ${fmt(order.paid_at)}`}
      </p>

      {awaitingMomo && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
          <h2 className="font-display text-xl font-medium">Waiting for the customer’s MoMo payment</h2>
          <p className="mt-2">
            Expected: <strong>{formatPrice(order.total_pesewas)}</strong> to{" "}
            <strong>{settings.momo_number || "your MoMo number (not set yet)"}</strong>
            {settings.momo_name && <> ({settings.momo_name})</>}. Check your MoMo statement for the payment. The customer was told to use{" "}
            <strong>{order.reference}</strong> as the reference. The order expires automatically after 48 hours if unpaid.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <ActionButton
              action={updateOrderStatus.bind(null, order.id, "paid")} successMessage="MoMo payment confirmed"
              confirm="Confirm that you have received this MoMo payment?"
              className={primary}
            >
              Confirm MoMo payment received
            </ActionButton>
          </div>
        </section>
      )}

      {awaitingOnline && (
        <p className="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          Waiting for the customer to pay online. It turns to Paid automatically once Paystack confirms, and it expires after 2 hours if
          unpaid.
        </p>
      )}

      {reopenable && (
        <section className="rounded-2xl border border-border bg-surface p-5 text-sm">
          <h2 className="font-display text-xl font-medium">Customer paid after this expired?</h2>
          <p className="mt-2 text-muted">If you can see their MoMo payment, reopen the order. The stock is reserved again and the order becomes Paid.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <ActionButton action={reopenPaidOrder.bind(null, order.id)} successMessage="Order reopened as paid" confirm="Reopen this order as paid?" className={secondary}>
              Reopen as paid
            </ActionButton>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-surface p-5 text-sm">
        <h2 className="mb-3 font-display text-2xl font-medium">Items</h2>
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
        <p className="mt-3 flex justify-between border-t border-border pt-3 text-base font-medium">
          <span>Total</span>
          <span>{formatPrice(order.total_pesewas)}</span>
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 text-sm">
        <h2 className="mb-3 font-display text-2xl font-medium">Customer</h2>
        <p className="font-medium">{order.customer_name}</p>
        <p className="text-muted">
          {order.address}, {order.city}
        </p>
        {order.email && <p className="text-muted">{order.email}</p>}
        {order.notes && <p className="mt-3 rounded-lg bg-background p-3">Note: {order.notes}</p>}
        <div className="mt-4 flex flex-wrap gap-3">
          <a href={`tel:${order.phone}`} className={secondary}>
            Call {order.phone}
          </a>
          <a
            href={waLink(
              toInternational(order.phone),
              `Hello ${order.customer_name}, this is ${settings.business_name} about your order ${order.reference}.`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className={secondary}
          >
            WhatsApp customer
          </a>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        {canProcess && (
          <ActionButton action={updateOrderStatus.bind(null, order.id, "processing")} successMessage="Marked as processing" className={primary}>
            Mark as processing
          </ActionButton>
        )}
        {canComplete && (
          <ActionButton action={updateOrderStatus.bind(null, order.id, "completed")} successMessage="Marked as completed" className={secondary}>
            Mark as completed
          </ActionButton>
        )}
        {canCancel && (
          <ActionButton
            action={cancelOrder.bind(null, order.id)} successMessage="Order cancelled"
            confirm={
              wasPaid
                ? "Cancel this order? The stock goes back on sale. The customer already paid, so remember to refund them."
                : "Cancel this order? The stock goes back on sale."
            }
            className={danger}
          >
            Cancel order
          </ActionButton>
        )}
      </div>
    </div>
  );
}
