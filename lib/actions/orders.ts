"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { adminClient } from "@/lib/supabase/admin";

export async function updateOrderStatus(orderId: string, status: "processing" | "completed") {
  const { supabase } = await requireAdmin();
  z.string().uuid().parse(orderId);
  z.enum(["processing", "completed"]).parse(status);

  const { data: order } = await supabase
    .from("orders")
    .select("status,payment_method,paid_at")
    .eq("id", orderId)
    .single();
  if (!order) return;

  const waitingForPayment = order.status === "pending" && order.payment_method === "paystack";
  if (waitingForPayment || order.status === "cancelled" || order.status === "completed") return;

  const paidAt = status === "completed" && !order.paid_at ? { paid_at: new Date().toISOString() } : {};
  await supabase.from("orders").update({ status, ...paidAt }).eq("id", orderId);

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}

export async function cancelOrder(orderId: string) {
  await requireAdmin();
  z.string().uuid().parse(orderId);

  // The database function puts the stock back
  const { error } = await adminClient().rpc("cancel_order", { p_order: orderId });
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}
