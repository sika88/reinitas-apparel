import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";

// An anonymous, hashed fingerprint of the visitor's IP (we never store the raw address)
export async function clientKey() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  return createHash("sha256").update(ip).digest("hex").slice(0, 24);
}
