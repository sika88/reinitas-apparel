import { signOut } from "@/lib/actions/auth";

export const metadata = { title: "Not authorised" };

export default function Unauthorized() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
        <h1 className="font-display text-2xl">Not authorised</h1>
        <p className="mt-2 text-sm text-muted">This account doesn&apos;t have admin access.</p>
        <form action={signOut} className="mt-6">
          <button className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90">
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
