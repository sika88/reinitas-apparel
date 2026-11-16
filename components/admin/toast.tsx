"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type Toast = { id: number; kind: "success" | "error"; text: string };
type ToastApi = { success: (text: string) => void; error: (text: string) => void };

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback(
    (kind: Toast["kind"], text: string) => {
      const id = nextId.current++;
      setToasts((t) => [...t.slice(-3), { id, kind, text }]);
      setTimeout(() => dismiss(id), kind === "error" ? 7000 : 4000);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({ success: (t) => push("success", t), error: (t) => push("error", t) }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : undefined}
            className={`fade-up pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${
              t.kind === "error"
                ? "border-red-300 bg-red-50 text-red-800"
                : "border-emerald-300 bg-emerald-50 text-emerald-900"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true">
              {t.kind === "error" ? <path d="M12 7v6M12 17h.01" /> : <path d="M5 12.5l4.5 4.5L19 7.5" />}
            </svg>
            <p className="flex-1">{t.text}</p>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss" className="-mr-1 px-1 text-lg leading-none opacity-60 transition hover:opacity-100">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
