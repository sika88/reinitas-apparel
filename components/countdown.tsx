"use client";

import { useEffect, useState } from "react";

export default function Countdown({ to, className = "" }: { to: string; className?: string }) {
  const end = new Date(to).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (now === null) return null; // nothing on the server, so no hydration mismatch
  const ms = end - now;
  if (ms <= 0) return <span className={className}>ended</span>;

  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const text = d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${String(s).padStart(2, "0")}s`;

  return <span className={className}>{text}</span>;
}
