import { publicClient } from "./supabase/public";

// The number customers can call. Never breaks the page: if anything goes wrong, nothing is shown.
export async function getCallNumber(): Promise<string> {
  try {
    const { data, error } = await publicClient().from("site_settings").select("call_number").eq("id", 1).maybeSingle();
    if (error) return "";
    return (data as { call_number: string | null } | null)?.call_number ?? "";
  } catch {
    return "";
  }
}
