"use client";

import { useReveal } from "@/components/motion/useReveal";
import { unzipTime } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useRef } from "react";

/**
 * A section rule that runs the full width of the viewport, with a tick
 * where it crosses each column rail. When it scrolls into view a dot lands
 * at the centre and a signal line unzips to both edges, lights the ticks as
 * it reaches them, holds a beat and fades (keyframes in globals.css). Blue
 * ticks are the finished state.
 */
export default function Rule({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useReveal(ref, (el) => {
    // The ticks sit at the rails, part of the way from the centre to the edge.
    const tick = el.querySelector("i");
    const half = window.innerWidth / 2;
    const x = tick ? tick.getBoundingClientRect().left + 2.5 : 0;
    const fraction = half > 0 ? Math.min(1, Math.abs(x - half) / half) : 1;
    el.style.setProperty("--tick-at", `${(0.08 + unzipTime(fraction, 0.5)).toFixed(3)}s`);
    el.setAttribute("data-play", "");
    return () => el.removeAttribute("data-play");
  });

  return (
    <div ref={ref} aria-hidden data-reveal="rule" className={cn("rule", className)}>
      <i />
      <i />
      <span className="rule-line" />
      <span className="rule-dot" />
    </div>
  );
}
