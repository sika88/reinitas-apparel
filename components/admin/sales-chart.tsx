import { formatPrice } from "@/lib/format";

type Day = { date: string; total: number; orders: number };

const label = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

export default function SalesChart({ data }: { data: Day[] }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  const total = data.reduce((s, d) => s + d.total, 0);
  const orders = data.reduce((s, d) => s + d.orders, 0);

  return (
    <figure>
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span>
          <span className="text-2xl font-medium">{formatPrice(total)}</span>
          <span className="ml-2 text-sm text-muted">
            from {orders} {orders === 1 ? "order" : "orders"}
          </span>
        </span>
        <span className="text-xs text-muted">Last 14 days</span>
      </figcaption>

      <div aria-hidden="true" className="mt-8 flex h-44 items-end gap-1.5 border-b border-border">
        {data.map((d) => {
          const pct = d.total > 0 ? Math.max((d.total / max) * 100, 4) : 0;
          return (
            <div key={d.date} className="group relative flex h-full flex-1 flex-col justify-end" title={`${label(d.date)}: ${formatPrice(d.total)}`}>
              {d.total > 0 ? (
                <div className="rounded-t-md bg-accent/75 transition group-hover:bg-accent" style={{ height: `${pct}%` }} />
              ) : (
                <div className="h-px bg-border" />
              )}
              <span className="pointer-events-none absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background group-hover:block">
                {label(d.date)} · {formatPrice(d.total)}
              </span>
            </div>
          );
        })}
      </div>
      <div aria-hidden="true" className="mt-2 flex gap-1.5 text-[11px] text-muted">
        {data.map((d, i) => (
          <span key={d.date} className={`flex-1 text-center ${i % 2 === 1 ? "invisible sm:visible" : ""}`}>
            {d.date.slice(8)}
          </span>
        ))}
      </div>

      <table className="sr-only">
        <caption>Sales per day for the last 14 days</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Sales</th>
            <th scope="col">Orders</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.date}>
              <td>{label(d.date)}</td>
              <td>{formatPrice(d.total)}</td>
              <td>{d.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
