import "server-only";
import { adminClient } from "./supabase/admin";
import { sendSms } from "./sms";

type Item = { product_name: string; size: string; quantity: number };

// Plain "GHS 320.00": the cedi symbol would force a costlier SMS encoding
const money = (p: number) => `GHS ${(p / 100).toFixed(2)}`;

export async function notifyNewOrder(orderId: string, kind: "paid_online" | "pay_on_delivery") {
  try {
    const { data: order } = await adminClient()
      .from("orders")
      .select("reference,customer_name,phone,city,total_pesewas,order_items(product_name,size,quantity)")
      .eq("id", orderId)
      .single();
    if (!order) return;

    const items = (order.order_items as Item[])
      .map((i) => `${i.product_name}${i.size !== "One size" ? ` (${i.size})` : ""} x${i.quantity}`)
      .join(", ");
    const how = kind === "paid_online" ? "PAID online" : "Pay on delivery";

    await sendSms(
      `New order ${order.reference}: ${items}. Total ${money(order.total_pesewas)} (${how}). ` +
        `${order.customer_name}, ${order.phone}, ${order.city}.`,
    );
  } catch (e) {
    console.error("notifyNewOrder failed:", e);
  }
}
