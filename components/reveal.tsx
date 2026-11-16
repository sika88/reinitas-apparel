"use client";

import { useEffect, useRef, useState } from "react";

// Fades content up as it scrolls into view. Content already on screen, or when the
// visitor prefers reduced motion, is simply shown (so nothing is ever hidden by mistake).
export default function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "hidden" | "shown">("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window) || el.getBoundingClientRect().top < window.innerHeight * 0.9) return;

    setState("hidden");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("shown");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const cls = state === "hidden" ? "reveal-hidden" : state === "shown" ? "reveal-shown" : "";
  return (
    <div ref={ref} style={state === "shown" ? { transitionDelay: `${delay}ms` } : undefined} className={`${cls} ${className}`}>
      {children}
    </div>
  );
}
