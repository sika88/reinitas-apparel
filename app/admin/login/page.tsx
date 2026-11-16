import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import PasswordField from "@/components/admin/password-field";
import SubmitButton from "@/components/admin/submit-button";
import { login } from "@/lib/actions/auth";
import { getSettings } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Sign in" };

const messages: Record<string, string> = {
  invalid: "Incorrect email or password.",
  forbidden: "This account doesn't have admin access.",
  rate: "Too many attempts. Please try again in a few minutes.",
};

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

  const settings = await getSettings();

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="on-dark relative hidden overflow-hidden bg-accent text-cream lg:flex lg:flex-col lg:justify-between lg:p-14">
        <div aria-hidden="true" className="hero-glow absolute inset-0" />
        <div aria-hidden="true" className="ring-float absolute -bottom-44 -right-44 h-[36rem] w-[36rem] rounded-full border border-gold/25" />
        <div aria-hidden="true" className="ring-float absolute -bottom-24 -right-24 h-[26rem] w-[26rem] rounded-full border border-gold/15" />

        <div className="relative">
          {settings.logo_url ? (
            <Image src={settings.logo_url} alt={settings.business_name} width={330} height={112} priority className="h-14 w-auto brightness-0 invert" />
          ) : (
            <p className="font-display text-3xl">{settings.business_name}</p>
          )}
        </div>
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.28em] text-gold">Shop admin</p>
          <h1 className="mt-4 max-w-md font-display text-5xl font-medium leading-[1.05]">Everything your shop needs, in one place.</h1>
          <p className="mt-4 max-w-sm text-cream/80">Add products, track orders and confirm payments.</p>
        </div>
        <p className="relative text-xs text-cream/60">
          © {new Date().getFullYear()} {settings.business_name}
        </p>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <form action={login} className="w-full max-w-sm space-y-5">
          <div className="lg:hidden">
            {settings.logo_url ? (
              <Image src={settings.logo_url} alt={settings.business_name} width={330} height={112} priority className="mb-4 h-12 w-auto" />
            ) : (
              <p className="mb-4 font-display text-3xl text-accent">{settings.business_name}</p>
            )}
          </div>

          <div>
            <h2 className="font-display text-4xl font-medium">Welcome back</h2>
            <p className="mt-1.5 text-sm text-muted">Sign in to manage {settings.business_name}.</p>
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {messages[error] ?? "Could not sign in."}
            </p>
          )}

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
              Email
            </label>
            <input id="email" name="email" type="email" required autoComplete="email" className="field" />
          </div>
          <PasswordField />

          <SubmitButton pendingLabel="Signing in…" className="btn-primary w-full">
            Sign in
          </SubmitButton>

          <p className="text-center text-xs text-muted">
            <Link href="/" className="underline underline-offset-4 transition hover:text-foreground">
              ← Back to the shop
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
