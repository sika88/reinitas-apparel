import Link from "next/link";
import { notFound } from "next/navigation";
import ClearCart from "@/components/clear-cart";
import { formatPrice, waLink } from "@/lib/format";
import { finalizePaidOrder } from "@/lib/orders";
import { getSettings } from "@/lib/queries";
import { adminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order status", robots: { index: false } };

type Line = { product_name: string; size: string; quantity: number; unit_price_pesewas: number };

const copy: Record<string, { title: string; body: string; tone: "ok" | "wait" | "issue" }> = {
  paid: { title: "Payment received. Thank you!", body: "Your order is confirmed and we will be in touch about delivery.", tone: "ok" },
  pod: { title: "Order received. Thank you!", body: "You will pay on delivery. We will contact you shortly to confirm.", tone: "ok" },
  unpaid: {
    title: "We haven’t received your payment yet",
    body: "If you were charged, don’t worry. Message us with your reference and we will sort it out.",
    tone: "wait",
  },
  cancelled: { title: "This order was cancelled", body: "If this is a mistake, please message us.", tone: "issue" },
  mismatch: {
    title: "We couldn’t confirm the payment amount",
    body: "Please message us with your reference so we can check it.",
    tone: "issue",
  },
};

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
    .select("reference,address,city,payment_method,total_pesewas,order_items(product_name,size,quantity,unit_price_pesewas)")
    .eq("reference", reference)
    .maybeSingle();
  if (!order) notFound();

  // For online payments, ask Paystack: never trust the URL alone
  const state = order.payment_method === "paystack" ? await finalizePaidOrder(reference) : "pod";
  const settings = await getSettings();
  const lines = order.order_items as Line[];
  const c = copy[state] ?? copy.unpaid;
  const success = c.tone === "ok";

  const iconColor = c.tone === "ok" ? "bg-emerald-100 text-emerald-700" : c.tone === "wait" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-14 sm:py-20">
      {success && <ClearCart />}

      <div className="rounded-3xl border border-border bg-surface p-7 sm:p-10">
        <div className={`flex h-14 w-14 items-center justify-center rounded-full ${iconColor}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden="true">
            {c.tone === "ok" ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : c.tone === "wait" ? <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></> : <path d="M12 7v6M12 17h.01" />}
          </svg>
        </div>

        <h1 className="mt-6 font-display text-4xl font-medium leading-tight">{c.title}</h1>
        <p className="mt-3 text-sm text-muted">{c.body}</p>

        <div className="mt-8 rounded-2xl bg-cream p-5 text-sm">
          <p>
            <span className="text-muted">Order reference</span>{" "}
            <span className="font-medium">{order.reference}</span>
          </p>
          <ul className="mt-4 space-y-2">
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
          <p className="mt-4 flex justify-between border-t border-border pt-4 font-medium">
            <span>Total</span>
            <span>{formatPrice(order.total_pesewas)}</span>
          </p>
          <p className="mt-3 text-xs text-muted">
            Delivering to {order.address}, {order.city}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {settings.whatsapp_number && (
            <a
              href={waLink(settings.whatsapp_number, `Hello! About my order ${order.reference}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
            >
              Message us on WhatsApp<span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
          <Link href="/shop" className="btn-primary">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
