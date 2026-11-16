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

// Sends an SMS to the admin through mNotify. Never throws: a failed text must not break an order.
export async function sendSms(message: string) {
  const key = process.env.MNOTIFY_API_KEY;
  const sender = process.env.MNOTIFY_SENDER_ID;
  const admin = await getAdminPhone();
  if (!key || !sender || !admin) {
    console.warn("SMS skipped: set MNOTIFY_API_KEY, MNOTIFY_SENDER_ID and an admin phone number");
    return;
  }
  try {
    const res = await fetch(`https://api.mnotify.com/api/sms/quick?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        recipient: [toInternational(admin)],
        sender,
        message: message.slice(0, 450),
        is_schedule: false,
        schedule_date: "",
      }),
      cache: "no-store",
    });
    const body = await res.text();
    if (!res.ok) console.error("mNotify SMS failed:", res.status, body);
    else console.log("mNotify SMS response:", body);
  } catch (e) {
    console.error("mNotify SMS error:", e);
  }
}
