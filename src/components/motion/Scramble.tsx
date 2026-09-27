"use client";

import { scramble, seedFor } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useRef } from "react";
import { useReveal } from "./useReveal";

interface Props {
  text: string;
  className?: string;
  /** "view" for section labels, "mount" for page labels. */
  on?: "view" | "mount";
  /** Seconds to settle. */
  duration?: number;
}

/**
 * A mono label that decodes left to right out of the reel's glyphs, like the
 * scene index in the reel's chrome. The server renders the final text;
 * screen readers get it plain, and the flicker is aria-hidden.
 */
export default function Scramble({ text, className, on = "view", duration = 0.45 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useReveal(
    ref,
    (el) => {
      const node = el.querySelector("[data-glyphs]")?.firstChild;
      if (!(node instanceof Text)) return () => {};
      const seed = seedFor(text);
      const t0 = performance.now();
      let raf = 0;
      const frame = (now: number) => {
        const p = (now - t0) / 1000 / duration;
        node.data = p >= 1 ? text : scramble(text, p, seed);
        if (p < 1) raf = requestAnimationFrame(frame);
      };
      node.data = scramble(text, 0, seed);
      raf = requestAnimationFrame(frame);
      return () => {
        cancelAnimationFrame(raf);
        node.data = text;
      };
    },
    { on },
  );

  return (
    <span ref={ref} data-reveal="hide" className={cn("label", className)}>
      <span className="sr-only select-none">{text}</span>
      <span aria-hidden data-glyphs>
        {text}
      </span>
    </span>
  );
}
