import { signOut } from "@/lib/actions/auth";

export const metadata = { title: "Not authorised" };

export default function Unauthorized() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-700">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden="true">
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </div>
        <h1 className="mt-5 font-display text-3xl font-medium">Not authorised</h1>
        <p className="mt-2 text-sm text-muted">This account doesn’t have admin access.</p>
        <form action={signOut} className="mt-6">
          <button className="btn-primary">Sign out</button>
        </form>
      </div>
    </main>
  );
}
