import "server-only";
import { alertAdmin, notifyNewOrder } from "./notify";
import { verifyPaystack } from "./paystack";
import { adminClient } from "./supabase/admin";

export type FinalizeState = "paid" | "unpaid" | "cancelled" | "mismatch" | "not_found";

// Safe to call many times (callback page + webhook). The SMS goes out only once,
// because only the first call manages to flip the order to paid.
export async function finalizePaidOrder(reference: string): Promise<FinalizeState> {
  const sb = adminClient();
  const { data: order } = await sb
    .from("orders")
    .select("id,status,total_pesewas,payment_method")
    .eq("reference", reference)
    .maybeSingle();

  if (!order || order.payment_method !== "paystack") return "not_found";
  if (order.status !== "pending" && order.status !== "cancelled") return "paid"; // already processed

  const v = await verifyPaystack(reference);
  if (!v.success) return order.status === "cancelled" ? "cancelled" : "unpaid";
  if (v.amount !== order.total_pesewas || v.currency !== "GHS") {
    console.error("Payment mismatch", { reference, paid: v.amount, expected: order.total_pesewas });
    return "mismatch";
  }

  // The customer really paid, but the order had expired: try to bring it back
  if (order.status === "cancelled") return reviveCancelledOrder(sb, order.id, reference);

  const { data: updated } = await sb
    .from("orders")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", order.id)
    .eq("status", "pending")
    .select("id");

  if (updated && updated.length > 0) await notifyNewOrder(order.id, "paid_online");
  return "paid";
}

async function reviveCancelledOrder(
  sb: ReturnType<typeof adminClient>,
  orderId: string,
  reference: string,
): Promise<FinalizeState> {
  const { data: revived, error } = await sb.rpc("revive_order", { p_order: orderId });
  if (error) console.error("revive_order failed:", error.message);

  if (revived === true) {
    await notifyNewOrder(orderId, "paid_online");
    return "paid";
  }

  // another request may have revived it a moment ago
  const { data: now } = await sb.from("orders").select("status").eq("id", orderId).maybeSingle();
  if (now && now.status !== "cancelled") return "paid";

  await alertAdmin(
    `revive:${reference}`,
    `Payment received for CANCELLED order ${reference} but the stock is gone. Refund the customer in Paystack or contact them.`,
  );
  return "cancelled";
}
