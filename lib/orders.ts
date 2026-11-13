import "server-only";
import { notifyNewOrder } from "./notify";
import { verifyPaystack } from "./paystack";
import { adminClient } from "./supabase/admin";

export type FinalizeState = "paid" | "unpaid" | "cancelled" | "mismatch" | "not_found";

// Safe to call many times (callback page + webhook). The SMS goes out only once,
// because only the first call manages to flip the order from pending to paid.
export async function finalizePaidOrder(reference: string): Promise<FinalizeState> {
  const sb = adminClient();
  const { data: order } = await sb
    .from("orders")
    .select("id,status,total_pesewas,payment_method")
    .eq("reference", reference)
    .maybeSingle();

  if (!order || order.payment_method !== "paystack") return "not_found";
  if (order.status === "cancelled") return "cancelled";
  if (order.status !== "pending") return "paid"; // already processed

  const v = await verifyPaystack(reference);
  if (!v.success) return "unpaid";
  if (v.amount !== order.total_pesewas || v.currency !== "GHS") {
    console.error("Payment mismatch", { reference, paid: v.amount, expected: order.total_pesewas });
    return "mismatch";
  }

  const { data: updated } = await sb
    .from("orders")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", order.id)
    .eq("status", "pending")
    .select("id");

  if (updated && updated.length > 0) await notifyNewOrder(order.id, "paid_online");
  return "paid";
}
