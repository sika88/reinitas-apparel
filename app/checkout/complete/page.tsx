import Link from "next/link";
import { notFound } from "next/navigation";
import ClearCart from "@/components/clear-cart";
import { formatPrice, waLink } from "@/lib/format";
import { finalizePaidOrder } from "@/lib/orders";
import { getSettings } from "@/lib/queries";
import { adminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order status" };

type Line = { product_name: string; size: string; quantity: number; unit_price_pesewas: number };

export default async function CompletePage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const sp = await searchParams;
  const reference = sp.reference ?? sp.trxref;
  if (!reference || !/^RA-[A-F0-9]{10}$/.test(reference)) notFound();

  const { data: order } = await adminClient()
    .from("orders")
    .select(
      "reference,address,city,payment_method,total_pesewas,order_items(product_name,size,quantity,unit_price_pesewas)",
    )
    .eq("reference", reference)
    .maybeSingle();
  if (!order) notFound();

  // For online payments, ask Paystack: never trust the URL alone
  const state = order.payment_method === "paystack" ? await finalizePaidOrder(reference) : "pod";
  const settings = await getSettings();
  const lines = order.order_items as Line[];
  const success = state === "paid" || state === "pod";

  const copy: Record<string, { title: string; body: string }> = {
    paid: { title: "Payment received. Thank you!", body: "Your order is confirmed and we'll be in touch about delivery." },
    pod: { title: "Order received. Thank you!", body: "You'll pay on delivery. We'll contact you shortly to confirm." },
    unpaid: {
      title: "We haven't received your payment yet",
      body: "If you were charged, don't worry. Message us with your reference and we'll sort it out.",
    },
    cancelled: { title: "This order was cancelled", body: "If this is a mistake, please message us." },
    mismatch: {
      title: "We couldn't confirm the payment amount",
      body: "Please message us with your reference so we can check it.",
    },
  };
  const c = copy[state] ?? copy.unpaid;

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      {success && <ClearCart />}

      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <h1 className="font-display text-3xl">{c.title}</h1>
        <p className="mt-2 text-sm text-muted">{c.body}</p>

        <div className="mt-6 rounded-xl bg-background p-4 text-sm">
          <p>
            <span className="text-muted">Order reference:</span>{" "}
            <span className="font-medium">{order.reference}</span>
          </p>
          <ul className="mt-3 space-y-1.5">
            {lines.map((l, idx) => (
              <li key={idx} className="flex justify-between gap-3">
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
          <p className="mt-3 text-xs text-muted">
            Delivering to {order.address}, {order.city}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {settings.whatsapp_number && (
            <a
              href={waLink(settings.whatsapp_number, `Hello! About my order ${order.reference}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-border px-5 py-2.5 text-sm transition hover:border-accent"
            >
              Message us on WhatsApp
            </a>
          )}
          <Link
            href="/shop"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
