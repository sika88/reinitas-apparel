"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { clientKey } from "@/lib/client-ip";
import { notifyNewOrder } from "@/lib/notify";
import { initializePaystack } from "@/lib/paystack";
import { normalizeGhPhone } from "@/lib/phone";
import { rateLimit } from "@/lib/rate-limit";
import { adminClient } from "@/lib/supabase/admin";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim(),
  email: z.union([z.literal(""), z.string().trim().email().max(200)]),
  address: z.string().trim().min(5).max(300),
  city: z.string().trim().min(2).max(100),
  notes: z.string().trim().max(500),
  method: z.enum(["paystack", "momo"]),
  expectedTotal: z.number().int().min(0).optional(),
  items: z
    .array(z.object({ variantId: z.string().uuid(), quantity: z.number().int().min(1).max(10) }))
    .min(1)
    .max(20),
});

type Result = { ok: true; redirectUrl: string } | { ok: false; error: string; refreshCart?: boolean };

function friendlyError(message: string) {
  if (message.includes("PRICE_CHANGED")) {
    return "The price of something in your cart has changed. We’ve updated your cart. Please check the new total and try again.";
  }
  if (message.includes("OUT_OF_STOCK:")) {
    const what = message.split("OUT_OF_STOCK:")[1]?.trim();
    return `Sorry, "${what}" just sold out or has fewer in stock than you asked for. Please update your cart.`;
  }
  if (message.includes("ITEM_UNAVAILABLE")) {
    return "One of the items in your cart is no longer available. Please remove it and try again.";
  }
  return "We couldn't place your order. Please try again.";
}

// A Server Action is a public endpoint: everything is validated here, prices come from the database.
export async function placeOrder(input: unknown): Promise<Result> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check your details and try again." };
  const d = parsed.data;

  const phone = normalizeGhPhone(d.phone);
  if (!phone) return { ok: false, error: "Enter a valid phone number, for example 0241234567." };
  if (d.method === "paystack" && !d.email) {
    return { ok: false, error: "An email address is needed for online payment." };
  }

  // at most 8 order attempts per visitor every 10 minutes
  if (!(await rateLimit(`order:${await clientKey()}`, 8, 600))) {
    return { ok: false, error: "Too many attempts. Please wait a few minutes and try again." };
  }

  // merge duplicate lines
  const merged = new Map<string, number>();
  for (const i of d.items) {
    merged.set(i.variantId, Math.min(10, (merged.get(i.variantId) ?? 0) + i.quantity));
  }

  const reference = "RA-" + randomBytes(5).toString("hex").toUpperCase();
  const sb = adminClient();

  const { data, error } = await sb.rpc("place_order", {
    p_reference: reference,
    p_name: d.name,
    p_phone: phone,
    p_email: d.email || null,
    p_address: d.address,
    p_city: d.city,
    p_notes: d.notes || null,
    p_method: d.method,
    p_items: [...merged].map(([variant_id, quantity]) => ({ variant_id, quantity })),
    p_expected_total: d.expectedTotal ?? null,
  });

  if (error) {
    console.error("place_order failed:", error.message);
    return {
      ok: false,
      error: friendlyError(error.message),
      refreshCart: /PRICE_CHANGED|OUT_OF_STOCK|ITEM_UNAVAILABLE/.test(error.message),
    };
  }
  const row = (data as { new_order_id: string; new_total_pesewas: number }[] | null)?.[0];
  if (!row) return { ok: false, error: "We couldn't place your order. Please try again." };

  if (d.method === "momo") {
    await notifyNewOrder(row.new_order_id, "momo_pending");
    return { ok: true, redirectUrl: `/checkout/complete?reference=${reference}` };
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");

  try {
    const url = await initializePaystack({
      email: d.email,
      amountPesewas: row.new_total_pesewas,
      reference,
      callbackUrl: `${proto}://${host}/checkout/complete`,
      metadata: { customer_name: d.name, phone },
    });
    return { ok: true, redirectUrl: url };
  } catch (e) {
    console.error("Paystack initialize failed:", e);
    await sb.rpc("cancel_order", { p_order: row.new_order_id }); // give the stock back
    return { ok: false, error: "We couldn't start the payment. Please try again." };
  }
}
