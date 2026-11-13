import { NextResponse } from "next/server";
import { finalizePaidOrder } from "@/lib/orders";
import { isValidSignature } from "@/lib/paystack";

export async function POST(req: Request) {
  const raw = await req.text(); // the signature covers the raw body, so don't parse first
  if (!isValidSignature(raw, req.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  if (event.event === "charge.success" && typeof event.data?.reference === "string") {
    await finalizePaidOrder(event.data.reference);
  }
  return NextResponse.json({ ok: true });
}
