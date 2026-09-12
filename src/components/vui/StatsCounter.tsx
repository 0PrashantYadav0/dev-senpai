"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Count-up number. Adapted from VengeanceUI's StatsCounter
 * (github.com/Ashutoshx7/VengeanceUI), rewritten on requestAnimationFrame
 * so it needs no animation library. Starts when scrolled into view; shows
 * the final value at once under reduced motion.
 */
interface Props {
  value: number;
  duration?: number; // seconds
  prefix?: string;
  suffix?: string;
  className?: string;
}

const ease = (t: number) => 1 - Math.pow(1 - t, 3);

export default function StatsCounter({
  value,
  duration = 1.4,
  prefix = "",
  suffix = "",
  className,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setShown(0);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setArmed(true);
          io.disconnect();
        }
      },
      { rootMargin: "-40px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!armed) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / (duration * 1000));
      setShown(Math.round(ease(p) * value));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [armed, value, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {shown.toLocaleString("en-US")}
      {suffix}
    </span>
  );
}
