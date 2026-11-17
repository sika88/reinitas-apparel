import "server-only";
import { rateLimit } from "./rate-limit";
import { sendSms } from "./sms";
import { adminClient } from "./supabase/admin";

type Item = { product_name: string; size: string; quantity: number };
type Kind = "paid_online" | "momo_pending" | "pay_on_delivery";

// Careful with wording: SMS fraud filters can block texts that talk about mobile money or payments
const HOW: Record<Kind, string> = {
  paid_online: "PAID online",
  momo_pending: "to confirm in admin",
  pay_on_delivery: "on delivery",
};

// Plain "GHS 320.00": the cedi symbol would force a costlier SMS encoding
const money = (p: number) => `GHS ${(p / 100).toFixed(2)}`;

export async function notifyNewOrder(orderId: string, kind: Kind) {
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

    await sendSms(
      `New order ${order.reference}: ${items}. Total ${money(order.total_pesewas)} (${HOW[kind]}). ` +
        `${order.customer_name}, ${order.phone}, ${order.city}.`,
      `New order ${order.reference} on your shop. Open the admin dashboard to see it.`,
    );
  } catch (e) {
    console.error("notifyNewOrder failed:", e);
  }
}

// Texts the admin about something that needs a human. At most once a day per key.
export async function alertAdmin(key: string, message: string) {
  if (await rateLimit(`alert:${key}`, 1, 86400)) {
    await sendSms(
      `ATTENTION: ${message}`,
      "ATTENTION: An order needs your attention. Open the admin dashboard and check Orders.",
    );
  }
}
