"use client";

import { backOut, clamp01, power3Out, typeTimes } from "@/lib/motion";
import { useEffect, useLayoutEffect, useRef } from "react";
import { HELLO_KEY, markPlayed, motionMode, playedThisSession, unmarkPlayed } from "./runtime";
import { caretSpot, showChars } from "./typing";

// Layout effects only mean something in the browser; this avoids React's server warning.
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/* The reel's first bar, in seconds from the first frame. */
const DOT_AT = 1.15; // the cursor snaps into a dot
const LINE_FROM = 1.25; // the dot unzips the line...
const LINE_TO = 1.65; // ...out to the rails
const DROP = 1.875; // four beats: the line fades, the dot springs into the wave
const FADE = 0.3;
const SPRING = 0.34;
const END = DROP + Math.max(FADE, SPRING);
const spring = backOut(2.4);

/**
 * The hero greeting as the reel's opening bar: it types in mono behind the
 * blue block cursor, the cursor snaps into a dot with a ring, the dot unzips
 * a signal line along the baseline out to the rails, and on the drop the line
 * fades as the dot springs into the wave. Plays on the first visit to home in
 * a tab session; the boot script holds the greeting back with
 * html[data-hello] until then, and later visits find it already there.
 */
export default function HeroGreeting({ text }: { text: string }) {
  const ref = useRef<HTMLHeadingElement>(null);

  useBrowserLayoutEffect(() => {
    const html = document.documentElement;
    const release = () => html.removeAttribute("data-hello");
    const h1 = ref.current;
    const caret = h1?.querySelector<HTMLElement>("[data-caret]");
    const dot = h1?.querySelector<HTMLElement>(".hello-dot");
    const ring = h1?.querySelector<HTMLElement>(".hello-ring");
    const line = h1?.querySelector<HTMLElement>(".hello-line");
    const wave = h1?.querySelector<HTMLElement>(".hello-wave");
    const baseline = h1?.querySelector<HTMLElement>("[data-baseline]");
    if (!h1 || !caret || !dot || !ring || !line || !wave || !baseline) return release();
    if (motionMode() === "static" || playedThisSession(HELLO_KEY)) return release();

    // Hold the greeting back from the first paint. The intro itself starts on
    // the first frame, which a tab opened in the background does not get
    // until it is shown.
    html.setAttribute("data-hello", "play");
    const chars = [...h1.querySelectorAll<HTMLElement>("[data-ch]")];
    const times = typeTimes(text, { start: 0.3, step: 0.04, pause: 0.04 });

    let raf = 0;
    let marked = false;
    let finished = false;
    const finish = () => {
      finished = true;
      cancelAnimationFrame(raf);
      chars.forEach((c) => (c.style.visibility = ""));
      for (const el of [caret, dot, ring, line]) el.style.opacity = "0";
      wave.style.visibility = "";
      wave.style.transform = "";
      release();
    };

    let t0 = 0;
    let dotX = 0;
    let dotY = 0;
    const frame = (now: number) => {
      const t = (now - t0) / 1000;
      if (t >= END) return finish();
      const n = showChars(chars, times, t);
      // Cursor: solid while typing, gone once it becomes the dot.
      if (t < DOT_AT) {
        const s = caretSpot(h1, chars, n - 1);
        caret.style.transform = `translate(${s.x}px, ${s.y + (s.h - caret.offsetHeight) / 2}px)`;
        caret.style.opacity = "1";
      } else {
        caret.style.opacity = "0";
      }
      // Dot: pops at DOT_AT, shrinks away as the wave springs in on the drop.
      const pop = clamp01((t - DOT_AT) / 0.05);
      const gone = clamp01((t - DROP) / 0.12);
      dot.style.opacity = t >= DOT_AT && gone < 1 ? "1" : "0";
      dot.style.transform = `translate(${dotX - 5}px, ${dotY - 5}px) scale(${(pop * (1 - gone)).toFixed(3)})`;
      // Ring: expands from the dot and fades.
      const r = clamp01((t - DOT_AT) / 0.45);
      ring.style.opacity = t >= DOT_AT && r < 1 ? ((1 - r) * 0.9).toFixed(3) : "0";
      ring.style.transform = `translate(${dotX - 5}px, ${dotY - 5}px) scale(${(1 + r * 2.6).toFixed(3)})`;
      // Line: unzips both ways from the dot, holds, fades on the drop.
      const zip = power3Out((t - LINE_FROM) / (LINE_TO - LINE_FROM));
      line.style.opacity = t >= LINE_FROM ? (1 - clamp01((t - DROP) / FADE)).toFixed(3) : "0";
      line.style.transform = `scaleX(${zip.toFixed(4)})`;
      // Wave: springs in on the drop.
      wave.style.visibility = t < DROP ? "hidden" : "visible";
      wave.style.transform = `scale(${(t < DROP ? 0 : spring((t - DROP) / SPRING)).toFixed(4)})`;
      raf = requestAnimationFrame(frame);
    };
    // The first frame: someone is looking, so the session's intro is used up
    // here and the clock starts from this frame.
    const begin = (now: number) => {
      const box = h1.getBoundingClientRect();
      // Off screen, or on its way off: a deep link such as /#contact scrolls
      // smoothly, so the hero can still be in view on this frame. Show it
      // finished and keep the intro for a later visit.
      const target = location.hash.length > 1 ? document.getElementById(location.hash.slice(1)) : null;
      const away = target !== null && !target.contains(h1);
      if (away || box.bottom <= 0 || box.top >= window.innerHeight) return finish();
      markPlayed(HELLO_KEY);
      marked = true;
      const column = (h1.closest(".column") ?? document.body).getBoundingClientRect();
      const last = caretSpot(h1, chars, chars.length - 1);
      const size = parseFloat(getComputedStyle(h1).fontSize) || 16;
      dotX = last.x + caret.offsetWidth / 2;
      // Just under the baseline, like an underline: the dot lands on the line
      // right after the last letter, a full stop dropped onto it.
      dotY = baseline.getBoundingClientRect().bottom - box.top + 0.12 * size;
      const left = column.left - box.left;
      line.style.left = `${left}px`;
      line.style.width = `${column.width}px`;
      line.style.top = `${dotY - 1}px`;
      line.style.transformOrigin = `${dotX - left}px 50%`;
      t0 = now;
      frame(now);
    };
    raf = requestAnimationFrame(begin);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onReduce = () => {
      if (reduce.matches) finish();
    };
    reduce.addEventListener("change", onReduce);
    return () => {
      reduce.removeEventListener("change", onReduce);
      // Cut short (navigated away, or React re-running effects): let a later visit play it.
      if (marked && !finished) unmarkPlayed(HELLO_KEY);
      finish();
    };
  }, [text]);

  const letters = [...text];
  const lastLetter = letters.pop();
  return (
    <h1 ref={ref} className="hello relative font-mono text-[2rem] leading-[1.05] sm:text-[2.5rem]">
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {letters.map((ch, i) => (
          <span key={i} data-ch>
            {ch}
          </span>
        ))}
        {/* The last letter, a no-break space and the wave share one line. The
            space alone cannot hold them: an inline-block always allows a
            break beside it. */}
        <span className="whitespace-nowrap">
          <span data-ch>
            {lastLetter}
            {/* An empty inline-block: its bottom edge sits on the baseline. */}
            <span data-baseline className="inline-block h-0 w-0" />
          </span>
          {"\u00a0"}
          <span className="hello-wave inline-block">👋</span>
        </span>
      </span>
      <span aria-hidden data-caret className="caret-block" />
      <span aria-hidden className="hello-dot" />
      <span aria-hidden className="hello-ring" />
      <span aria-hidden className="hello-line" />
    </h1>
  );
}
