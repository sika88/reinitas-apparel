"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { POLICIES } from "@/lib/policy-defaults";

type Result = { ok: true } | { ok: false; error: string };
const slugSchema = z.enum(["privacy", "terms", "delivery-returns"]);

export async function savePolicy(slug: string, body: string): Promise<Result> {
  const { supabase } = await requireAdmin();
  const s = slugSchema.safeParse(slug);
  const b = z.string().trim().min(20).max(20000).safeParse(body);
  if (!s.success || !b.success) return { ok: false, error: "The text must be between 20 and 20,000 characters." };

  const { error } = await supabase.from("policy_pages").upsert({
    slug: s.data,
    title: POLICIES[s.data].title,
    body: b.data,
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/${s.data}`);
  return { ok: true };
}

export async function resetPolicy(slug: string): Promise<Result> {
  const { supabase } = await requireAdmin();
  const s = slugSchema.safeParse(slug);
  if (!s.success) return { ok: false, error: "Unknown page." };

  const { error } = await supabase.from("policy_pages").delete().eq("slug", s.data);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/${s.data}`);
  return { ok: true };
}
