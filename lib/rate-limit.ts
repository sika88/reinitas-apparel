import "server-only";
import { adminClient } from "./supabase/admin";

// true = allowed. If the limiter itself breaks we fail open, so a bug can't block sales.
export async function rateLimit(key: string, max: number, windowSeconds: number): Promise<boolean> {
  try {
    const { data, error } = await adminClient().rpc("rate_limit", {
      p_key: key,
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      console.error("rate_limit failed:", error.message);
      return true;
    }
    return data === true;
  } catch (e) {
    console.error("rate_limit error:", e);
    return true;
  }
}
