import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Call this at the top of every admin page AND every admin Server Action
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/admin/unauthorized");

  return { supabase, user };
}
