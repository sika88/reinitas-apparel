import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const BASE = "https://api.paystack.co";

function secret() {
  const s = process.env.PAYSTACK_SECRET_KEY;
  if (!s) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return s;
}

// Amounts are in pesewas (GHS 320.00 = 32000)
export async function initializePaystack(args: {
  email: string;
  amountPesewas: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const res = await fetch(`${BASE}/transaction/initialize`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: args.email,
      amount: args.amountPesewas,
      currency: "GHS",
      reference: args.reference,
      callback_url: args.callbackUrl,
      metadata: args.metadata,
    }),
    cache: "no-store",
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.status) {
    throw new Error(json?.message ?? `Paystack initialize failed (${res.status})`);
  }
  return json.data.authorization_url as string;
}

// Never trust the redirect alone: ask Paystack directly
export async function verifyPaystack(reference: string) {
  const res = await fetch(`${BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret()}` },
    cache: "no-store",
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.status) return { success: false, amount: 0, currency: "" };
  return {
    success: json.data.status === "success",
    amount: json.data.amount as number,
    currency: json.data.currency as string,
  };
}

// Webhooks are signed with HMAC-SHA512 of the RAW body using your secret key
export function isValidSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const expected = createHmac("sha512", secret()).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
