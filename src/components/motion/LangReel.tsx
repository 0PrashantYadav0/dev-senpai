"use client";

import { reelClicks, reelDuration, reelPos } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useRef } from "react";
import { useReveal } from "./useReveal";

const LINE = 1.15; // em: one word cell, matching .reel-window's line-height

/**
 * "fluent in ___": a slot reel that clicks through the languages, slowing as
 * it goes, and lands on the last word with an overshoot, like the reel's
 * stack scene. The window is as wide as the widest word, so nothing moves
 * around it. The server renders the landed word.
 */
export default function LangReel({ words, className }: { words: string[]; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const last = words.length - 1;

  useReveal(ref, (el) => {
    const strip = el.querySelector<HTMLElement>(".reel-strip");
    if (!strip || last < 1) return () => {};
    const clicks = reelClicks(last);
    const end = reelDuration(clicks);
    const put = (pos: number) => {
      strip.style.transform = `translateY(${(-pos * LINE).toFixed(4)}em)`;
    };
    let raf = 0;
    const finish = () => {
      cancelAnimationFrame(raf);
      put(last);
    };
    const t0 = performance.now();
    const frame = (now: number) => {
      const t = (now - t0) / 1000;
      if (t >= end) return finish();
      put(reelPos(t, clicks));
      raf = requestAnimationFrame(frame);
    };
    put(0);
    raf = requestAnimationFrame(frame);
    return finish;
  });

  if (last < 0) return null;
  return (
    <p
      ref={ref}
      data-reveal="hide"
      className={cn("display-md text-[1.35rem] tracking-[-0.015em] sm:text-[1.6rem]", className)}
    >
      <span className="sr-only">fluent in {words[last]}</span>
      <span aria-hidden className="select-none">
        <span className="text-muted-foreground">fluent in</span>{" "}
        <span className="reel-window">
          <span className="reel-sizer">
            {words.map((w, i) => (
              <span key={i}>{w}</span>
            ))}
          </span>
          <span className="reel-strip" style={{ transform: `translateY(${(-last * LINE).toFixed(4)}em)` }}>
            {words.map((w, i) => (
              <span key={i}>{w}</span>
            ))}
          </span>
        </span>
      </span>
    </p>
  );
}
