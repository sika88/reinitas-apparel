const styles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  processing: "bg-sky-100 text-sky-800",
  completed: "bg-stone-200 text-stone-700",
  cancelled: "bg-red-100 text-red-700",
};

export function statusLabel(status: string, method?: string) {
  if (status === "pending" && method === "momo") return "Awaiting MoMo";
  if (status === "pending" && method === "paystack") return "Awaiting payment";
  return status;
}

export default function StatusBadge({ status, method }: { status: string; method?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${styles[status] ?? "bg-stone-100 text-stone-700"}`}>
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabel(status, method)}
    </span>
  );
}
