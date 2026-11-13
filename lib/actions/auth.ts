"use server";

import { redirect } from "next/navigation";
import { clientKey } from "@/lib/client-ip";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  // 10 attempts per visitor every 15 minutes
  if (!(await rateLimit(`login:${await clientKey()}`, 10, 900))) redirect("/admin/login?error=rate");

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/admin/login?error=invalid");

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=forbidden");
  }
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
