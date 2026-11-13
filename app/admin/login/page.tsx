import { redirect } from "next/navigation";
import { login } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Sign in" };

const messages: Record<string, string> = {
  invalid: "Incorrect email or password.",
  forbidden: "This account doesn't have admin access.",
  rate: "Too many attempts. Please try again in a few minutes.",
};

const field =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  // already signed in as admin? go straight in
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (isAdmin) redirect("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form action={login} className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <div>
          <h1 className="font-display text-2xl">Admin sign in</h1>
          <p className="mt-1 text-sm text-muted">Authorised staff only.</p>
        </div>

        {error && (
          <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {messages[error] ?? "Could not sign in."}
          </p>
        )}

        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Email</span>
          <input name="email" type="email" required autoComplete="email" className={field} />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Password</span>
          <input name="password" type="password" required autoComplete="current-password" className={field} />
        </label>

        <button className="w-full rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition hover:opacity-90">
          Sign in
        </button>
      </form>
    </main>
  );
}
