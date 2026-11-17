import "server-only";
import { toInternational } from "./phone";
import { adminClient } from "./supabase/admin";

const DEFAULT_FALLBACK = "You have a new order on your shop. Open the admin dashboard to see it.";

async function getAdminPhone(): Promise<string | null> {
  try {
    const { data } = await adminClient().from("private_settings").select("admin_phone").eq("id", 1).maybeSingle();
    if (data?.admin_phone) return data.admin_phone;
  } catch {}
  return process.env.ADMIN_PHONE ?? null;
}

async function post(key: string, sender: string, phone: string, message: string) {
  const res = await fetch(`https://api.mnotify.com/api/sms/quick?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      recipient: [phone],
      sender,
      message: message.slice(0, 450),
      is_schedule: false,
      schedule_date: "",
    }),
    cache: "no-store",
  });
  return { ok: res.ok, status: res.status, body: await res.text() };
}

// Sends an SMS to the admin through mNotify. Never throws: a failed text must not break an order.
// If mNotify rejects the text as fraud (its content filter), a short neutral fallback is sent instead.
export async function sendSms(message: string, fallback: string = DEFAULT_FALLBACK) {
  const key = process.env.MNOTIFY_API_KEY;
  const sender = process.env.MNOTIFY_SENDER_ID;
  const admin = await getAdminPhone();
  if (!key || !sender || !admin) {
    console.warn("SMS skipped: set MNOTIFY_API_KEY, MNOTIFY_SENDER_ID and an admin phone number");
    return;
  }
  const phone = toInternational(admin);

  try {
    const r = await post(key, sender, phone, message);
    if (r.ok) {
      console.log("mNotify SMS response:", r.body);
      return;
    }
    console.error("mNotify SMS failed:", r.status, r.body);

    const blocked = r.status === 419 || /fraud/i.test(r.body);
    if (blocked && message !== fallback) {
      const f = await post(key, sender, phone, fallback);
      if (f.ok) console.log("mNotify fallback SMS sent:", f.body);
      else console.error("mNotify fallback SMS failed:", f.status, f.body);
    }
  } catch (e) {
    console.error("mNotify SMS error:", e);
  }
}
