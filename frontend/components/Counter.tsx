"use client";
import { useEffect, useRef, useState } from "react";

/** Animated count-up. Pass a formatter for locale/compact display. */
export default function Counter({
  value,
  format,
  duration = 1100,
}: {
  value: number;
  format: (n: number) => string;
  duration?: number;
}) {
  const [n, setN] = useState(0);
  const raf = useRef<number>();
  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setN(from + (value - from) * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [value, duration]);
  return <span className="stat">{format(n)}</span>;
}
