"use client";

import { useTransition } from "react";
import { useToast } from "@/components/admin/toast";

type Result = { ok: boolean; error?: string; message?: string } | void;

// A button that runs a Server Action, with an optional confirm box and a toast when it finishes
export default function ActionButton({
  action,
  confirm,
  successMessage,
  className,
  pendingLabel = "Working…",
  role,
  children,
}: {
  action: () => Promise<Result>;
  confirm?: string;
  successMessage?: string;
  className?: string;
  pendingLabel?: string;
  role?: "menuitem";
  children: React.ReactNode;
}) {
  const [pending, start] = useTransition();
  const toast = useToast();

  return (
    <button
      type="button"
      role={role}
      disabled={pending}
      className={className}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        start(async () => {
          const r = await action();
          if (r && !r.ok) toast.error(r.error ?? "Something went wrong.");
          else if (r && r.message) toast.success(r.message);
          else if (successMessage) toast.success(successMessage);
        });
      }}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
