"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { adminClient } from "@/lib/supabase/admin";

type Result = { ok: true } | { ok: false; error: string };

function refresh(orderId: string) {
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin", "layout");
}

export async function updateOrderStatus(
  orderId: string,
  status: "paid" | "processing" | "completed",
): Promise<Result> {
  const { supabase } = await requireAdmin();
  if (!z.string().uuid().safeParse(orderId).success) return { ok: false, error: "Invalid order." };
  if (!z.enum(["paid", "processing", "completed"]).safeParse(status).success) return { ok: false, error: "Invalid status." };

  const { data: o } = await supabase
    .from("orders")
    .select("status,payment_method,paid_at")
    .eq("id", orderId)
    .single();
  if (!o) return { ok: false, error: "Order not found." };

  const legacyCod = o.payment_method === "pay_on_delivery";
  const allowed: Record<string, string[]> = {
    pending: legacyCod ? ["processing", "completed"] : o.payment_method === "momo" ? ["paid"] : [],
    paid: ["processing", "completed"],
    processing: ["completed"],
  };
  if (!(allowed[o.status] ?? []).includes(status)) {
    return { ok: false, error: "That change isn't possible for this order right now." };
  }

  const patch: Record<string, unknown> = { status };
  if ((status === "paid" || status === "completed") && !o.paid_at) patch.paid_at = new Date().toISOString();

  const { error } = await supabase.from("orders").update(patch).eq("id", orderId).eq("status", o.status);
  if (error) return { ok: false, error: error.message };

  refresh(orderId);
  return { ok: true };
}

export async function cancelOrder(orderId: string): Promise<Result> {
  await requireAdmin();
  if (!z.string().uuid().safeParse(orderId).success) return { ok: false, error: "Invalid order." };

  // The database function puts the stock back
  const { error } = await adminClient().rpc("cancel_order", { p_order: orderId });
  if (error) return { ok: false, error: error.message };

  refresh(orderId);
  return { ok: true };
}

// A MoMo payment arrived after the order had expired: re-reserve the stock and mark it paid
export async function reopenPaidOrder(orderId: string): Promise<Result> {
  await requireAdmin();
  if (!z.string().uuid().safeParse(orderId).success) return { ok: false, error: "Invalid order." };

  const { data, error } = await adminClient().rpc("revive_order", { p_order: orderId });
  if (error) return { ok: false, error: error.message };
  if (data !== true) return { ok: false, error: "There isn't enough stock left to reopen this order." };

  refresh(orderId);
  return { ok: true };
}
