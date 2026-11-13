import "server-only";
import { toInternational } from "./phone";
import { adminClient } from "./supabase/admin";

async function getAdminPhone(): Promise<string | null> {
  try {
    const { data } = await adminClient().from("private_settings").select("admin_phone").eq("id", 1).maybeSingle();
    if (data?.admin_phone) return data.admin_phone;
  } catch {}
  return process.env.ADMIN_PHONE ?? null;
}

// Sends an SMS to the admin. Never throws: a failed text must not break an order.
export async function sendSms(message: string) {
  const key = process.env.ARKESEL_API_KEY;
  const sender = process.env.ARKESEL_SENDER_ID;
  const admin = await getAdminPhone();
  if (!key || !sender || !admin) {
    console.warn("SMS skipped: set ARKESEL_API_KEY, ARKESEL_SENDER_ID and an admin phone number");
    return;
  }
  try {
    const res = await fetch("https://sms.arkesel.com/api/v2/sms/send", {
      method: "POST",
      headers: { "api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ sender, message, recipients: [toInternational(admin)] }),
      cache: "no-store",
    });
    const body = await res.text();
    if (!res.ok) console.error("Arkesel SMS failed:", res.status, body);
    else console.log("Arkesel SMS response:", body);
  } catch (e) {
    console.error("Arkesel SMS error:", e);
  }
}
