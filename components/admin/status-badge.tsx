const styles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  processing: "bg-sky-100 text-sky-800",
  completed: "bg-stone-200 text-stone-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status] ?? "bg-stone-100"}`}>
      {status}
    </span>
  );
}
