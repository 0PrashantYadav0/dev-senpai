"use client";

import { BEAT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useRef } from "react";
import { caretSpot, showChars } from "./typing";
import { useReveal } from "./useReveal";

interface Props {
  text: string;
  /** When each character appears, in seconds from the reveal (typeTimes). */
  times: number[];
  className?: string;
}

/**
 * Types `text` behind the blue block cursor when it scrolls into view, then
 * blinks the cursor three times on the beat and lets it go, like the URL on
 * the reel's end card. The server renders the finished text.
 */
export default function TypeOn({ text, times, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useReveal(ref, (el) => {
    const chars = [...el.querySelectorAll<HTMLElement>("[data-ch]")];
    const caret = el.querySelector<HTMLElement>("[data-caret]");
    const typed = times[times.length - 1] ?? 0;
    const end = typed + 6 * BEAT; // off and on, three times
    const park = (i: number) => {
      if (!caret) return;
      const s = caretSpot(el, chars, i);
      caret.style.transform = `translate(${s.x}px, ${s.y + (s.h - caret.offsetHeight) / 2}px)`;
    };
    let raf = 0;
    const finish = () => {
      cancelAnimationFrame(raf);
      chars.forEach((c) => (c.style.visibility = ""));
      if (caret) caret.style.opacity = "0";
    };
    const t0 = performance.now();
    const frame = (now: number) => {
      const t = (now - t0) / 1000;
      if (t >= end) return finish();
      park(showChars(chars, times, t) - 1);
      if (caret) {
        const after = t - typed;
        caret.style.opacity = after <= 0 || Math.floor(after / BEAT) % 2 === 1 ? "1" : "0";
      }
      raf = requestAnimationFrame(frame);
    };
    showChars(chars, times, -1);
    park(-1);
    if (caret) caret.style.opacity = "1";
    raf = requestAnimationFrame(frame);
    return finish;
  });

  return (
    <span ref={ref} data-reveal="hide" className={cn("relative inline-block", className)}>
      <span className="sr-only select-none">{text}</span>
      <span aria-hidden>
        {[...text].map((ch, i) => (
          <span key={i} data-ch>
            {ch}
          </span>
        ))}
      </span>
      <span aria-hidden data-caret className="caret-block" />
    </span>
  );
}
